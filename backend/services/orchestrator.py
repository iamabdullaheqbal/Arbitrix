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


def _make_gemini() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


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
        logger.info(
            "RAG fetched — lawyer: %d, businessman: %d, regulator: %d chunks",
            len(lawyer_chunks), len(biz_chunks), len(reg_chunks),
        )
        return format_chunks(lawyer_chunks), format_chunks(biz_chunks), format_chunks(reg_chunks)
    except Exception as exc:
        logger.warning("RAG failed — running without context: %s", exc)
        return ("", "", "")


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

_JSON_FOOTER = (
    'Respond ONLY in raw JSON no markdown no backticks:\n'
    '{"findings": [{"clause": "...", "risk": "...", "severity": "HIGH"}]}'
)
_RAG_BLOCK = "RELEVANT KNOWLEDGE FROM YOUR DATABASE:\n{ctx}\n"


def _build_lawyer_prompt(rag_context: str, mode: str) -> str:
    rag = _RAG_BLOCK.format(ctx=rag_context or "No relevant precedents found.")
    if mode == "plain":
        return (
            "You are a friendly lawyer explaining contract risks to a regular person in Pakistan.\n"
            "Use simple everyday language. Avoid legal jargon. Be warm and approachable.\n"
            "IMPORTANT: Only flag GENUINE risks. If the contract is fair, say so. Empty findings are valid.\n\n"
            + rag +
            "\nAnalyze this contract honestly. Only flag real problems — do not invent risks.\n"
            "For each GENUINE finding: exact problematic text, explain in simple terms why it is risky (mention the Pakistani law or rule), severity HIGH/MEDIUM/LOW.\n"
            'Respond ONLY in raw JSON: {"findings": [...], "overall_assessment": "fair|minor_issues|significant_issues|high_risk", "justification": "..."}'
        )
    return (
        "You are a senior Pakistani contract lawyer with 20 years experience.\n"
        "You know Pakistani Contract Act 1872 and Companies Act 2017.\n"
        "IMPORTANT: Only flag GENUINE legal risks. If the contract is legally sound, say so. Empty findings are valid and correct.\n\n"
        + rag +
        "\nAnalyze this contract objectively. Only flag clauses that are actually illegal, void, or genuinely unfair under Pakistani law.\n"
        "For each GENUINE finding: exact clause quote, legal risk citing specific Pakistani law, severity HIGH/MEDIUM/LOW.\n"
        'Respond ONLY in raw JSON: {"findings": [...], "overall_assessment": "fair|minor_issues|significant_issues|high_risk", "justification": "..."}'
    )


def _build_businessman_prompt(rag_context: str, mode: str) -> str:
    rag = _RAG_BLOCK.format(ctx=rag_context or "No relevant precedents found.")
    if mode == "plain":
        return (
            "You are a friendly Pakistani business mentor helping a small business owner.\n"
            "Use simple conversational language. Explain money and business risks clearly.\n"
            "IMPORTANT: Only flag GENUINE commercial risks. If terms are fair, say so. Empty findings are valid.\n\n"
            + rag +
            "\nAnalyze this contract honestly. Only flag clauses that genuinely harm the signing party.\n"
            "For each GENUINE finding: exact problematic text, plain explanation of business harm, severity HIGH/MEDIUM/LOW.\n"
            'Respond ONLY in raw JSON: {"findings": [...], "overall_assessment": "fair|minor_issues|significant_issues|high_risk", "justification": "..."}'
        )
    return (
        "You are a senior commercial advisor specializing in Pakistani SME contracts.\n"
        "Focus on payment terms, liability caps, IP ownership, one-sided exit clauses.\n"
        "IMPORTANT: Only flag GENUINE commercial risks. Standard terms should NOT be flagged. Empty findings are valid and correct.\n\n"
        + rag +
        "\nAnalyze this contract objectively. Only flag clauses that genuinely harm the signing party commercially.\n"
        "For each GENUINE finding: exact clause quote, specific commercial impact, severity HIGH/MEDIUM/LOW.\n"
        'Respond ONLY in raw JSON: {"findings": [...], "overall_assessment": "fair|minor_issues|significant_issues|high_risk", "justification": "..."}'
    )


def _build_regulator_prompt(rag_context: str, mode: str) -> str:
    rag = _RAG_BLOCK.format(ctx=rag_context or "No relevant precedents found.")
    if mode == "plain":
        return (
            "You are a helpful government officer explaining rules to a regular Pakistani citizen.\n"
            "Use simple language. Make it easy to understand for someone with no legal background.\n"
            "IMPORTANT: Only flag ACTUAL violations. If the contract follows the law, say so. Empty findings are valid.\n\n"
            + rag +
            "\nAnalyze this contract honestly. Only flag clauses that actually break Pakistani rules.\n"
            "For each GENUINE finding: exact problematic text, which Pakistani rule it breaks, severity HIGH/MEDIUM/LOW.\n"
            'Respond ONLY in raw JSON: {"findings": [...], "overall_assessment": "compliant|minor_gaps|significant_issues|non_compliant", "justification": "..."}'
        )
    return (
        "You are a Pakistani regulatory compliance officer.\n"
        "Analyze against SECP, SBP, PTA, and labour regulations. Cite specific regulation names and section numbers.\n"
        "IMPORTANT: Only flag ACTUAL regulatory violations — not theoretical ones. If the contract is compliant, say so. Empty findings are valid.\n\n"
        + rag +
        "\nAnalyze this contract objectively. Only flag clauses that actually violate Pakistani regulations.\n"
        "For each GENUINE finding: exact clause quote, specific regulation violated with section number, severity HIGH/MEDIUM/LOW.\n"
        'Respond ONLY in raw JSON: {"findings": [...], "overall_assessment": "compliant|minor_gaps|significant_issues|non_compliant", "justification": "..."}'
    )


# ---------------------------------------------------------------------------
# Gemini call with retry + exponential backoff
# ---------------------------------------------------------------------------

async def _call_gemini_with_retry(
    system_prompt: str,
    contract_text: str,
    max_tokens: int = 2000,
    max_retries: int = 2,
) -> list[str]:
    for attempt in range(max_retries + 1):
        try:
            client = _make_gemini()
            loop = asyncio.get_event_loop()
            _system = system_prompt
            _content = contract_text
            _model = settings.gemini_model
            _max_tok = max_tokens

            def _blocking_stream() -> list[str]:
                chunks = []
                for chunk in client.models.generate_content_stream(
                    model=_model,
                    contents=_content,
                    config=types.GenerateContentConfig(
                        system_instruction=_system,
                        temperature=TEMPERATURE,
                        max_output_tokens=_max_tok,
                    ),
                ):
                    if chunk.text:
                        chunks.append(chunk.text)
                logger.info("Gemini stream: %d chunks, %d chars",
                            len(chunks), sum(len(c) for c in chunks))
                return chunks

            return await loop.run_in_executor(None, _blocking_stream)

        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
            is_permanent = "403" in err_str or "PERMISSION_DENIED" in err_str or "API_KEY_INVALID" in err_str
            if is_rate_limit and not is_permanent and attempt < max_retries:
                logger.warning("Rate limit (attempt %d/%d) — waiting 5s", attempt + 1, max_retries)
                await asyncio.sleep(5)
            else:
                raise

    raise RuntimeError("Max retries exceeded for Gemini API call")


# ---------------------------------------------------------------------------
# Agent streaming
# ---------------------------------------------------------------------------

async def _stream_agent(
    agent_name: str,
    system_prompt: str,
    contract_text: str,
    queue: asyncio.Queue,
) -> str:
    full_text = ""
    try:
        chunks = await _call_gemini_with_retry(system_prompt, contract_text)
        for text in chunks:
            full_text += text
            await queue.put({"agent": agent_name, "chunk": text, "done": False})
        logger.info("Agent %s done. %d chars. Preview: %s", agent_name, len(full_text), full_text[:150])
        await queue.put({"agent": agent_name, "chunk": "", "done": True})
    except Exception as exc:
        err_str = str(exc)
        is_rate_limit = "429" in err_str or "RESOURCE_EXHAUSTED" in err_str
        is_permission = "403" in err_str or "PERMISSION_DENIED" in err_str
        if is_permission:
            err_msg = "API key denied — please check your Gemini API key."
        elif is_rate_limit:
            err_msg = "Rate limit reached — please retry in a moment."
        else:
            err_msg = err_str
        logger.error("Agent %s failed: %s", agent_name, exc)
        await queue.put({"agent": agent_name, "chunk": "", "done": True, "error": err_msg})
    return full_text


# ---------------------------------------------------------------------------
# Urdu translation via Mistral
# ---------------------------------------------------------------------------

async def _translate_verdict_to_urdu(verdict: dict) -> dict:
    if not settings.mistral_api_key:
        logger.warning("MISTRAL_API_KEY not set — skipping Urdu translation")
        return verdict

    prompt = (
        "You are a legal translator specializing in Pakistani law.\n"
        "Translate the following legal analysis from English to Urdu.\n\n"
        "Strict rules:\n"
        "- Keep legal terms like SECP, SBP, Contract Act, section numbers in English\n"
        "- Translate all explanations and descriptions to Urdu script\n"
        "- Keep the exact same JSON structure — do not add or remove any fields\n"
        "- Translate ONLY: each finding's 'risk' field, 'recommendations' items, "
        "and summary_english → summary_urdu\n"
        "- Keep 'clause' fields in original English — they are contract quotes\n"
        "- Keep 'severity' as HIGH MEDIUM LOW, 'agent' values, and 'risk_score' unchanged\n"
        "- Respond ONLY in raw JSON — no markdown, no backticks\n\n"
        f"Input JSON:\n{json.dumps(verdict, ensure_ascii=False, indent=2)}"
    )

    try:
        from mistralai.client import Mistral
        loop = asyncio.get_event_loop()

        def _blocking_call() -> str:
            client = Mistral(api_key=settings.mistral_api_key)
            response = client.chat.complete(
                model="mistral-small-latest",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=3000,
            )
            return response.choices[0].message.content.strip()

        raw = await loop.run_in_executor(None, _blocking_call)
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw

        translated = json.loads(raw)
        for key in ("risk_score", "red_flags", "recommendations", "summary_english", "summary_urdu"):
            if key not in translated:
                translated[key] = verdict.get(key)
        return translated

    except json.JSONDecodeError as exc:
        logger.warning("Translation JSON parse failed: %s — returning English", exc)
        return verdict
    except Exception as exc:
        logger.warning("Urdu translation failed: %s — returning English", exc)
        return verdict


# ---------------------------------------------------------------------------
# Main analysis stream
# ---------------------------------------------------------------------------

async def analyze_contract_stream(
    contract_text: str,
    mode: str = "technical",
    language: str = "english",
) -> AsyncGenerator[dict, None]:
    queue: asyncio.Queue = asyncio.Queue()

    lawyer_ctx, biz_ctx, reg_ctx = await _fetch_rag_context(contract_text)
    logger.info("Starting analysis — mode=%s", mode)

    agents = [
        ("lawyer",      _build_lawyer_prompt(lawyer_ctx, mode)),
        ("businessman", _build_businessman_prompt(biz_ctx, mode)),
        ("regulator",   _build_regulator_prompt(reg_ctx, mode)),
    ]

    agent_buffers: dict[str, str] = {name: "" for name, _ in agents}

    # Fire all three simultaneously — no stagger
    tasks = [
        asyncio.create_task(_stream_agent(name, prompt, contract_text, queue))
        for name, prompt in agents
    ]

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
        verdict_en = await synthesize_verdict(
            lawyer=agent_buffers["lawyer"],
            businessman=agent_buffers["businessman"],
            regulator=agent_buffers["regulator"],
        )
        verdict_en = _validate_risk_score(verdict_en)
        logger.info("Synthesis done. risk_score=%s flags=%d",
                    verdict_en.get("risk_score"), len(verdict_en.get("red_flags", [])))

        # Yield English verdict immediately — user navigates to verdict page now
        yield {
            "agent": "synthesis",
            "chunk": "",
            "done": True,
            "verdict": {"english": verdict_en, "urdu": verdict_en},  # urdu filled in by translation_ready
        }

        # Translate in background — separate event arrives a few seconds later
        verdict_ur = await _translate_verdict_to_urdu(verdict_en)
        yield {"type": "translation_ready", "verdict_urdu": verdict_ur}

    except Exception as exc:
        yield {"agent": "synthesis", "chunk": "", "done": True, "error": str(exc)}


# ---------------------------------------------------------------------------
# Score validation — prevents hallucinated high scores
# ---------------------------------------------------------------------------

def _validate_risk_score(verdict: dict) -> dict:
    findings = verdict.get("red_flags", [])
    high_count   = sum(1 for f in findings if f.get("severity") == "HIGH")
    medium_count = sum(1 for f in findings if f.get("severity") == "MEDIUM")
    total        = len(findings)
    score        = verdict.get("risk_score", 5)

    if total == 0 and score > 3:
        verdict["risk_score"] = 1.5
    elif high_count == 0 and medium_count == 0 and score > 4:
        verdict["risk_score"] = min(score, 3.5)
    elif high_count == 0 and score > 6:
        verdict["risk_score"] = min(score, 5.5)
    elif high_count <= 1 and score > 7:
        verdict["risk_score"] = min(score, 6.5)

    if verdict["risk_score"] != score:
        logger.info("Score adjusted: %.1f → %.1f (high=%d med=%d total=%d)",
                    score, verdict["risk_score"], high_count, medium_count, total)
    return verdict


# ---------------------------------------------------------------------------
# Synthesis (Gemini)
# ---------------------------------------------------------------------------

async def synthesize_verdict(lawyer: str, businessman: str, regulator: str) -> dict:
    prompt = (
        f"LAWYER ANALYSIS:\n{lawyer}\n\n"
        f"BUSINESSMAN ANALYSIS:\n{businessman}\n\n"
        f"REGULATOR ANALYSIS:\n{regulator}\n\n"
        "Synthesize the above into a final verdict."
    )

    chunks = await _call_gemini_with_retry(
        system_prompt=SYNTHESIS_SYSTEM_PROMPT,
        contract_text=prompt,
        max_tokens=3000,
    )
    raw_text = "".join(chunks).strip()

    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        raw_text = "\n".join(lines[1:-1]) if len(lines) > 2 else raw_text

    return json.loads(raw_text)
