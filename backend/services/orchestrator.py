import asyncio
import json
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types

from agents.synthesis import SYNTHESIS_SYSTEM_PROMPT
from config import settings

logger = logging.getLogger(__name__)


def _make_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


# ---------------------------------------------------------------------------
# RAG helpers
# ---------------------------------------------------------------------------

async def _fetch_rag_context(contract_text: str) -> tuple[str, str, str]:
    """
    Fire three parallel retrieval queries and return formatted context strings.
    Returns empty strings gracefully if RAG is unavailable.
    """
    try:
        from rag.retriever import retrieve, format_chunks

        snippet = contract_text[:300]

        lawyer_q     = f"legal risk unenforceable clause Pakistani contract law {snippet}"
        biz_q        = f"commercial payment liability unfair terms Pakistani business {snippet}"
        reg_q        = f"SECP SBP regulatory compliance Pakistani law {snippet}"

        # No doc_type filter — search all chunks so every agent gets results
        lawyer_chunks, biz_chunks, reg_chunks = await asyncio.gather(
            retrieve(lawyer_q,  top_k=5),
            retrieve(biz_q,     top_k=5),
            retrieve(reg_q,     top_k=5),
        )

        return (
            format_chunks(lawyer_chunks),
            format_chunks(biz_chunks),
            format_chunks(reg_chunks),
        )
    except Exception as exc:
        logger.warning("RAG context fetch failed — running without RAG: %s", exc)
        return ("", "", "")


def _build_lawyer_prompt(rag_context: str) -> str:
    return f"""You are a senior Pakistani contract lawyer with 20 years experience.
You know Pakistani Contract Act 1872 and Companies Act 2017.

RELEVANT LEGAL KNOWLEDGE FROM YOUR DATABASE:
{rag_context if rag_context else "No relevant precedents found."}

Using the above as reference, analyze this contract.
Find the 3 most legally dangerous clauses.
For each: exact clause quote, legal risk 2 sentences, severity HIGH/MEDIUM/LOW.
Respond ONLY in raw JSON no markdown no backticks:
{{"findings": [{{"clause": "...", "risk": "...", "severity": "HIGH"}}]}}"""


def _build_businessman_prompt(rag_context: str) -> str:
    return f"""You are a hard-nosed Pakistani SME owner who has been burned by bad contracts before.
You care only about commercial and financial risk.

RELEVANT COMMERCIAL KNOWLEDGE FROM YOUR DATABASE:
{rag_context if rag_context else "No relevant precedents found."}

Using the above as reference, analyze this contract.
Find the 3 most commercially dangerous clauses.
Focus on payment terms, liability caps, IP ownership, one-sided exit clauses.
For each: exact clause quote, business impact 2 sentences, severity HIGH/MEDIUM/LOW.
Respond ONLY in raw JSON no markdown no backticks:
{{"findings": [{{"clause": "...", "risk": "...", "severity": "HIGH"}}]}}"""


def _build_regulator_prompt(rag_context: str) -> str:
    return f"""You are a Pakistani regulatory compliance officer.
You check contracts against SECP regulations, SBP guidelines, PTA rules, and relevant Pakistani sector law.

RELEVANT REGULATORY KNOWLEDGE FROM YOUR DATABASE:
{rag_context if rag_context else "No relevant precedents found."}

Using the above as reference, analyze this contract.
Find the 3 most serious regulatory compliance issues.
For each: exact clause quote, which regulation it may violate, severity HIGH/MEDIUM/LOW.
Respond ONLY in raw JSON no markdown no backticks:
{{"findings": [{{"clause": "...", "risk": "...", "severity": "HIGH"}}]}}"""


# ---------------------------------------------------------------------------
# Agent streaming
# ---------------------------------------------------------------------------

async def _stream_agent(
    agent_name: str,
    system_prompt: str,
    contract_text: str,
    queue: asyncio.Queue,
) -> str:
    """Stream a single agent's response into the shared queue. Returns full text."""
    full_text = ""
    try:
        client = _make_client()
        loop = asyncio.get_event_loop()

        def _blocking_stream():
            chunks = []
            for chunk in client.models.generate_content_stream(
                model=settings.gemini_model,
                contents=contract_text,
                config=types.GenerateContentConfig(system_instruction=system_prompt),
            ):
                chunks.append(chunk.text or "")
            return chunks

        chunks = await loop.run_in_executor(None, _blocking_stream)
        for text in chunks:
            if text:
                full_text += text
                await queue.put({"agent": agent_name, "chunk": text, "done": False})
        await queue.put({"agent": agent_name, "chunk": "", "done": True})
    except Exception as exc:
        error_msg = f"[ERROR] {exc}"
        await queue.put({"agent": agent_name, "chunk": error_msg, "done": True, "error": str(exc)})
    return full_text


async def analyze_contract_stream(contract_text: str) -> AsyncGenerator[dict, None]:
    """
    1. Fetch RAG context in parallel for all three agents.
    2. Fire all three agents simultaneously with enriched prompts.
    3. Stream their tokens, then run synthesis and emit final verdict.
    """
    queue: asyncio.Queue = asyncio.Queue()

    # Parallel RAG retrieval — never blocks agents if it fails
    lawyer_ctx, biz_ctx, reg_ctx = await _fetch_rag_context(contract_text)

    agents = [
        ("lawyer", _build_lawyer_prompt(lawyer_ctx)),
        ("businessman", _build_businessman_prompt(biz_ctx)),
        ("regulator", _build_regulator_prompt(reg_ctx)),
    ]

    agent_buffers: dict[str, str] = {name: "" for name, _ in agents}

    tasks = [
        asyncio.create_task(_stream_agent(name, prompt, contract_text, queue))
        for name, prompt in agents
    ]

    done_count = 0
    while done_count < len(agents):
        event = await queue.get()
        agent_name = event["agent"]

        if not event["done"]:
            agent_buffers[agent_name] += event.get("chunk", "")

        yield event

        if event["done"]:
            done_count += 1

    await asyncio.gather(*tasks, return_exceptions=True)

    # Synthesis
    try:
        verdict = await synthesize_verdict(
            lawyer=agent_buffers["lawyer"],
            businessman=agent_buffers["businessman"],
            regulator=agent_buffers["regulator"],
        )
        yield {"agent": "synthesis", "chunk": "", "done": True, "verdict": verdict}
    except Exception as exc:
        yield {"agent": "synthesis", "chunk": "", "done": True, "error": str(exc)}


async def synthesize_verdict(lawyer: str, businessman: str, regulator: str) -> dict:
    """Generate final verdict from three agent outputs."""
    client = _make_client()

    prompt = f"""LAWYER ANALYSIS:
{lawyer}

BUSINESSMAN ANALYSIS:
{businessman}

REGULATOR ANALYSIS:
{regulator}

Synthesize the above into a final verdict."""

    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=SYNTHESIS_SYSTEM_PROMPT),
        ),
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        raw_text = "\n".join(lines[1:-1]) if len(lines) > 2 else raw_text

    return json.loads(raw_text)
