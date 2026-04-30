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
) -> None:
    """Stream a single agent's response into the shared queue."""
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
                await queue.put({"agent": agent_name, "chunk": text, "done": False})
        await queue.put({"agent": agent_name, "chunk": "", "done": True})
    except Exception as exc:
        await queue.put({"agent": agent_name, "chunk": f"[ERROR] {exc}", "done": True})


async def analyze_contract_stream(contract_text: str) -> AsyncGenerator[dict, None]:
    """Fire all three agents simultaneously and yield SSE events."""
    queue: asyncio.Queue = asyncio.Queue()

    agents = [
        ("lawyer", LAWYER_SYSTEM_PROMPT),
        ("businessman", BUSINESSMAN_SYSTEM_PROMPT),
        ("regulator", REGULATOR_SYSTEM_PROMPT),
    ]

    tasks = [
        asyncio.create_task(_stream_agent(name, prompt, contract_text, queue))
        for name, prompt in agents
    ]

    done_count = 0
    while done_count < len(agents):
        event = await queue.get()
        yield event
        if event["done"]:
            done_count += 1

    await asyncio.gather(*tasks)


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
