#!/usr/bin/env python
"""
CLI script to ingest Pakistani legal documents into Neon DB.

Usage:
    uv run python scripts/ingest_docs.py ./legal_docs
"""
from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path

# Ensure backend root is on sys.path when run from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


async def main(folder: str) -> None:
    from rag.db import init_pool, close_pool
    from rag.ingester import ingest_folder

    docs_path = Path(folder).resolve()
    if not docs_path.is_dir():
        print(f"ERROR: '{folder}' is not a directory.")
        sys.exit(1)

    print(f"Connecting to Neon DB …")
    await init_pool()

    start = time.monotonic()
    total_files, total_chunks = await ingest_folder(docs_path)
    elapsed = time.monotonic() - start

    await close_pool()

    minutes, seconds = divmod(int(elapsed), 60)
    print()
    print("✅ Ingestion complete")
    print(f"📁 Files processed: {total_files}")
    print(f"📄 Chunks stored: {total_chunks:,}")
    print(f"⏱️  Time taken: {minutes}m {seconds}s")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/ingest_docs.py <folder_path>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
