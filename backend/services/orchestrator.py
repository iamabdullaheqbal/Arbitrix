import asyncio
import json
from typing import AsyncGenerator

from google import genai
from google.genai import types

from agents.lawyer import LAWYER_SYSTEM_PROMPT
from agents.businessman import BUSINESSMAN_SYSTEM_PROMPT
from agents.regulator import REGULATOR_SYSTEM_PROMPT
from agents.synthesis import SYNTHESIS_SYSTEM_PROMPT
from config import settings


def _make_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


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
    Fire all three agents simultaneously, stream their tokens, then
    run synthesis and emit a final SSE event with the full verdict.
    """
    queue: asyncio.Queue = asyncio.Queue()

    agents = [
        ("lawyer", LAWYER_SYSTEM_PROMPT),
        ("businessman", BUSINESSMAN_SYSTEM_PROMPT),
        ("regulator", REGULATOR_SYSTEM_PROMPT),
    ]

    # Collect full text per agent for synthesis
    agent_results: dict[str, str] = {name: "" for name, _ in agents}

    # Track chunks per agent to reconstruct full text
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
            agent_results[agent_name] = agent_buffers[agent_name]
            done_count += 1

    # Gather tasks (they're already done at this point)
    await asyncio.gather(*tasks, return_exceptions=True)

    # Now run synthesis
    try:
        verdict = await synthesize_verdict(
            lawyer=agent_results["lawyer"],
            businessman=agent_results["businessman"],
            regulator=agent_results["regulator"],
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
    # Strip markdown code fences if present
    if raw_text.startswith("```"):
        lines = raw_text.split("\n")
        raw_text = "\n".join(lines[1:-1]) if len(lines) > 2 else raw_text

    return json.loads(raw_text)
