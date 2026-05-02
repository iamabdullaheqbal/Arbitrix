import asyncio
import json
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types

from agents.synthesis import SYNTHESIS_SYSTEM_PROMPT
from config import settings

logger = logging.getLogger(__name__)

TEMPERATURE = 0.3


def _make_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def _gen_config(max_tokens: int = 1000) -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        temperature=TEMPERATURE,
        max_output_tokens=max_tokens,
    )


# ---------------------------------------------------------------------------
# RAG helpers
# ---------------------------------------------------------------------------

async def _fetch_rag_context(contract_text: str) -> tuple[str, str, str]:
    try:
        from rag.retriever import retrieve, format_chunks
        snippet = contract_text[:300]
        lawyer_chunks, biz_chunks, reg_chunks = await asyncio.gather(
            retrieve(f"legal risk unenforceable clause Pakistani contract law {snippet}", top_k=5),
            retrieve(f"commercial payment liability unfair terms Pakistani business {snippet}", top_k=5),
            retrieve(f"SECP SBP regulatory compliance Pakistani law {snippet}", top_k=5),
        )
        return format_chunks(lawyer_chunks), format_chunks(biz_chunks), format_chunks(reg_chunks)
    except Exception as exc:
        logger.warning("RAG context fetch failed — running without RAG: %s", exc)
        return ("", "", "")


# ---------------------------------------------------------------------------
# Mode-aware prompt builders
# ---------------------------------------------------------------------------

_JSON_FOOTER = (
    'Respond ONLY in raw JSON no markdown no backticks:\n'
    '{{"findings": [{{"clause": "...", "risk": "...", "severity": "HIGH"}}]}}'
)

_RAG_BLOCK = "RELEVANT KNOWLEDGE FROM YOUR DATABASE:\n{ctx}\n"


def _build_lawyer_prompt(rag_context: str, mode: str) -> str:
    ctx = rag_context or "No relevant precedents found."
    rag = _RAG_BLOCK.format(ctx=ctx)
    if mode == "plain":
        return (
            "You are a friendly lawyer explaining contract risks to a regular person in Pakistan.\n"
            "Use simple everyday language. Avoid legal jargon.\n"
            "Explain risks as if talking to a friend who has never seen a contract before.\n"
            "Use analogies if helpful. Be warm and approachable.\n\n"
            + rag +
            "\nFind the 3 most dangerous parts of this contract.\n"
            "For each: the exact problematic text, explain in simple terms why this is risky, severity HIGH/MEDIUM/LOW.\n"
            + _JSON_FOOTER
        )
    return (
        "You are a senior Pakistani contract lawyer with 20 years experience.\n"
        "You know Pakistani Contract Act 1872 and Companies Act 2017.\n"
        "Analyze with precise legal terminology. Cite specific sections of Pakistani law where applicable.\n\n"
        + rag +
        "\nFind the 3 most legally dangerous clauses.\n"
        "For each: exact clause quote, legal risk citing specific law, severity HIGH/MEDIUM/LOW.\n"
        + _JSON_FOOTER
    )


def _build_businessman_prompt(rag_context: str, mode: str) -> str:
    ctx = rag_context or "No relevant precedents found."
    rag = _RAG_BLOCK.format(ctx=ctx)
    if mode == "plain":
        return (
            "You are a friendly Pakistani business mentor helping a small business owner.\n"
            "Use simple conversational language. Explain money and business risks clearly.\n"
            "Think of it as advice from an experienced uncle who runs a business.\n\n"
            + rag +
            "\nFind the 3 most dangerous commercial parts of this contract.\n"
            "For each: the exact problematic text, explain in plain terms how this could hurt their business or money, severity HIGH/MEDIUM/LOW.\n"
            + _JSON_FOOTER
        )
    return (
        "You are a senior commercial advisor specializing in Pakistani SME contracts.\n"
        "Analyze with formal business terminology. Reference industry standards and commercial best practices.\n"
        "Focus on payment terms, liability caps, IP ownership, one-sided exit clauses.\n\n"
        + rag +
        "\nFind the 3 most commercially dangerous clauses.\n"
        "For each: exact clause quote, commercial impact with specific financial implications, severity HIGH/MEDIUM/LOW.\n"
        + _JSON_FOOTER
    )


def _build_regulator_prompt(rag_context: str, mode: str) -> str:
    ctx = rag_context or "No relevant precedents found."
    rag = _RAG_BLOCK.format(ctx=ctx)
    if mode == "plain":
        return (
            "You are a helpful government officer explaining rules to a regular Pakistani citizen.\n"
            "Use simple language. Explain which rules this contract might break.\n"
            "Make it easy to understand for someone with no legal background.\n\n"
            + rag +
            "\nFind the 3 biggest rule violations in this contract.\n"
            "For each: the exact problematic text, explain in simple terms which Pakistani rule this breaks, severity HIGH/MEDIUM/LOW.\n"
            + _JSON_FOOTER
        )
    return (
        "You are a Pakistani regulatory compliance officer.\n"
        "Analyze against SECP, SBP and PTA regulations precisely. Cite specific regulation names and section numbers.\n\n"
        + rag +
        "\nFind the 3 most serious compliance issues.\n"
        "For each: exact clause quote, specific regulation violated with section number, severity HIGH/MEDIUM/LOW.\n"
        + _JSON_FOOTER
    )


# ---------------------------------------------------------------------------
# Agent streaming — with retry + exponential backoff
# ---------------------------------------------------------------------------

async def _call_gemini_with_retry(
    client: genai.Client,
    system_prompt: str,
    contract_text: str,
    max_retries: int = 3,
) -> list[str]:
    """Call Gemini streaming with exponential backoff on 429 errors."""
    import random
    for attempt in range(max_retries):
        try:
            loop = asyncio.get_event_loop()

            def _blocking_stream():
                chunks = []
                for chunk in client.models.generate_content_stream(
                    model=settings.gemini_model,
                    contents=contract_text,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=TEMPERATURE,
                        max_output_tokens=1000,
                    ),
                ):
                    chunks.append(chunk.text or "")
                return chunks

            return await loop.run_in_executor(None, _blocking_stream)

        except Exception as exc:
            is_rate_limit = "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc)
            if is_rate_limit and attempt < max_retries - 1:
                wait = (2 ** attempt) + random.uniform(0, 1)
                logger.warning("Rate limit hit (attempt %d/%d) — waiting %.1fs", attempt + 1, max_retries, wait)
                await asyncio.sleep(wait)
            else:
                raise

    raise RuntimeError("Max retries exceeded for Gemini API call")


async def _stream_agent(
    agent_name: str,
    system_prompt: str,
    contract_text: str,
    queue: asyncio.Queue,
) -> str:
    full_text = ""
    try:
        client = _make_client()
        chunks = await _call_gemini_with_retry(client, system_prompt, contract_text)
        for text in chunks:
            if text:
                full_text += text
                await queue.put({"agent": agent_name, "chunk": text, "done": False})
        await queue.put({"agent": agent_name, "chunk": "", "done": True})
    except Exception as exc:
        is_rate_limit = "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc)
        err_msg = "Rate limit reached — please retry in a moment." if is_rate_limit else str(exc)
        await queue.put({"agent": agent_name, "chunk": "", "done": True, "error": err_msg})
    return full_text


async def _translate_verdict_to_urdu(verdict: dict) -> dict:
    """
    Translate the English verdict fields to Urdu using Gemini.
    - Translates: each finding's risk, recommendations, summary_english → summary_urdu
    - Keeps: clause quotes, severity values, risk_score, JSON structure
    Falls back to original verdict on any failure.
    """
    client = _make_client()
    prompt = (
        "You are a legal translator specializing in Pakistani law.\n"
        "Translate the following legal analysis from English to Urdu.\n\n"
        "Rules:\n"
        "- Keep legal terms like SECP, SBP, Contract Act, section numbers in English\n"
        "- Translate all explanations and descriptions to Urdu\n"
        "- Keep the exact same JSON structure\n"
        "- Translate ONLY these fields: each finding's 'risk' field, 'recommendations' array items, "
        "and put the Urdu translation of summary_english into the 'summary_urdu' field\n"
        "- Keep 'clause' fields in their original language — they are contract quotes\n"
        "- Keep severity values as HIGH MEDIUM LOW in English\n"
        "- Keep risk_score as a number, unchanged\n"
        "- Respond ONLY in raw JSON, no markdown, no backticks, no explanation\n\n"
        f"Input:\n{json.dumps(verdict, ensure_ascii=False)}"
    )
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=2000,
                ),
            ),
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw
        translated = json.loads(raw)
        # Safety: ensure required keys are present, fall back per-field if missing
        for key in ("risk_score", "red_flags", "recommendations", "summary_english", "summary_urdu"):
            if key not in translated:
                translated[key] = verdict.get(key)
        return translated
    except Exception as exc:
        logger.warning("Urdu translation failed — falling back to English verdict: %s", exc)
        return verdict


async def analyze_contract_stream(contract_text: str, mode: str = "technical", language: str = "english") -> AsyncGenerator[dict, None]:
    queue: asyncio.Queue = asyncio.Queue()

    lawyer_ctx, biz_ctx, reg_ctx = await _fetch_rag_context(contract_text)

    agents = [
        ("lawyer",      _build_lawyer_prompt(lawyer_ctx, mode)),
        ("businessman", _build_businessman_prompt(biz_ctx, mode)),
        ("regulator",   _build_regulator_prompt(reg_ctx, mode)),
    ]

    agent_buffers: dict[str, str] = {name: "" for name, _ in agents}

    # Stagger task creation by 1s to avoid simultaneous rate-limit hits
    tasks = []
    for i, (name, prompt) in enumerate(agents):
        if i > 0:
            await asyncio.sleep(1)
        tasks.append(asyncio.create_task(_stream_agent(name, prompt, contract_text, queue)))

    done_count = 0
    while done_count < len(agents):
        event = await queue.get()
        if not event["done"]:
            agent_buffers[event["agent"]] += event.get("chunk", "")
        yield event
        if event["done"]:
            done_count += 1

    await asyncio.gather(*tasks, return_exceptions=True)

    try:
        verdict = await synthesize_verdict(
            lawyer=agent_buffers["lawyer"],
            businessman=agent_buffers["businessman"],
            regulator=agent_buffers["regulator"],
        )
        if language == "urdu":
            verdict = await _translate_verdict_to_urdu(verdict)
        yield {"agent": "synthesis", "chunk": "", "done": True, "verdict": verdict}
    except Exception as exc:
        yield {"agent": "synthesis", "chunk": "", "done": True, "error": str(exc)}


async def synthesize_verdict(lawyer: str, businessman: str, regulator: str) -> dict:
    client = _make_client()
    prompt = f"LAWYER ANALYSIS:\n{lawyer}\n\nBUSINESSMAN ANALYSIS:\n{businessman}\n\nREGULATOR ANALYSIS:\n{regulator}\n\nSynthesize the above into a final verdict."

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYNTHESIS_SYSTEM_PROMPT,
                temperature=TEMPERATURE,
                max_output_tokens=2000,
            ),
        ),
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        raw_text = "\n".join(lines[1:-1]) if len(lines) > 2 else raw_text

    return json.loads(raw_text)
