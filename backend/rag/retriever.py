from __future__ import annotations

import logging
from typing import Optional

from rag.db import get_pool
from rag.embedder import singleton as embedder

logger = logging.getLogger(__name__)


async def retrieve(
    query: str,
    top_k: int = 5,
    doc_type: Optional[str] = None,
) -> list[dict]:
    """
    Embed *query* and return the top_k most similar chunks from Neon.
    Returns [] gracefully if the pool is unavailable or query fails.
    """
    pool = get_pool()
    if pool is None:
        return []

    try:
        embedding = embedder.embed(query)

        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT content, source_file, doc_type,
                       1 - (embedding <=> $1::vector) AS similarity
                FROM legal_chunks
                WHERE ($2::text IS NULL OR doc_type = $2)
                ORDER BY embedding <=> $1::vector
                LIMIT $3
                """,
                embedding,
                doc_type,
                top_k,
            )

        return [
            {
                "content": row["content"],
                "source_file": row["source_file"],
                "doc_type": row["doc_type"],
                "similarity": float(row["similarity"]),
            }
            for row in rows
            if float(row["similarity"]) >= 0.5
        ]
    except Exception as exc:
        logger.warning("RAG retrieval failed: %s", exc)
        return []


def format_chunks(chunks: list[dict]) -> str:
    if not chunks:
        return "(No relevant precedents found.)"
    return "\n\n---\n\n".join(
        f"Source: {c['source_file']} (relevance: {c['similarity']:.2f})\n{c['content']}"
        for c in chunks
    )
