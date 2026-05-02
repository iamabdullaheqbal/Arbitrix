from __future__ import annotations

import logging
import os
from typing import Optional

import asyncpg
from pgvector.asyncpg import register_vector

from rag.embedder import singleton as embedder
from rag.db import get_pool

logger = logging.getLogger(__name__)


async def retrieve(
    query: str,
    top_k: int = 5,
    doc_type: Optional[str] = None,
) -> list[dict]:
    """
    Embed *query* and return the top_k most similar chunks from Neon.

    Uses the shared pool when available (FastAPI runtime).
    Falls back to a direct connection when called standalone (scripts/tests).
    Returns [] gracefully on any failure.
    """
    try:
        embedding = embedder.embed(query)

        pool = get_pool()
        if pool is not None:
            async with pool.acquire() as conn:
                rows = await _fetch_rows(conn, embedding, doc_type, top_k)
        else:
            # No pool — open a direct connection (standalone / script usage)
            conn = await asyncpg.connect(
                os.getenv("NEON_DATABASE_URL", ""),
                ssl="require",
            )
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            await register_vector(conn)
            try:
                rows = await _fetch_rows(conn, embedding, doc_type, top_k)
            finally:
                await conn.close()

        return [
            {
                "content": row["content"],
                "source_file": row["source_file"],
                "doc_type": row["doc_type"],
                "similarity": float(row["similarity"]),
            }
            for row in rows
            if float(row["similarity"]) > 0.3
        ]
    except Exception as exc:
        logger.warning("RAG retrieval failed: %s", exc)
        return []


async def _fetch_rows(conn, embedding, doc_type, top_k):
    if doc_type:
        return await conn.fetch(
            """
            SELECT content, source_file, doc_type,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM legal_chunks
            WHERE doc_type = $2
            ORDER BY embedding <=> $1::vector
            LIMIT $3
            """,
            embedding,
            doc_type,
            top_k,
        )
    else:
        return await conn.fetch(
            """
            SELECT content, source_file, doc_type,
                   1 - (embedding <=> $1::vector) AS similarity
            FROM legal_chunks
            ORDER BY embedding <=> $1::vector
            LIMIT $2
            """,
            embedding,
            top_k,
        )


def format_chunks(chunks: list[dict]) -> str:
    if not chunks:
        return "(No relevant precedents found.)"
    return "\n\n---\n\n".join(
        f"Source: {c['source_file']} (relevance: {c['similarity']:.2f})\n{c['content']}"
        for c in chunks
    )
