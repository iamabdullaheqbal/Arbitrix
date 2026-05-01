#!/usr/bin/env python
"""
CLI script to ingest Pakistani legal documents into Neon DB.

Usage:
    uv run python scripts/ingest_docs.py ./legal_docs
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

# Make sure backend root is on sys.path when run from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


async def main(folder: str) -> None:
    from rag.db import init_pool, close_pool
    from rag.ingester import ingest_file

    docs_path = Path(folder).resolve()
    if not docs_path.is_dir():
        print(f"ERROR: '{folder}' is not a directory.")
        sys.exit(1)

    files = [
        p for p in docs_path.rglob("*")
        if p.suffix.lower() in {".pdf", ".docx"}
    ]

    if not files:
        print("No .pdf or .docx files found.")
        return

    print(f"Found {len(files)} document(s). Connecting to Neon …")
    await init_pool()

    total_files = 0
    total_chunks = 0

    for file_path in files:
        print(f"\nProcessing: {file_path.name}")
        chunks = await ingest_file(file_path)
        if chunks > 0:
            total_files += 1
            total_chunks += chunks

    await close_pool()
    print(f"\nDone. Ingested {total_files} files, {total_chunks:,} chunks total.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/ingest_docs.py <folder_path>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
