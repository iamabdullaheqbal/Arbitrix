from __future__ import annotations

import logging
from typing import Optional

from rag.db import get_pool
from rag.embedder import Embedder

logger = logging.getLogger(__name__)

_embedder = Embedder()


async def retrieve_relevant_chunks(
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
        embedding = _embedder.embed(query)

        async with pool.acquire() as conn:
            if doc_type:
                rows = await conn.fetch(
                    """
                    SELECT content, source_file,
                           1 - (embedding <=> $1::vector) AS similarity
                    FROM legal_chunks
                    WHERE doc_type = $3
                    ORDER BY embedding <=> $1::vector
                    LIMIT $2
                    """,
                    embedding,
                    top_k,
                    doc_type,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT content, source_file,
                           1 - (embedding <=> $1::vector) AS similarity
                    FROM legal_chunks
                    ORDER BY embedding <=> $1::vector
                    LIMIT $2
                    """,
                    embedding,
                    top_k,
                )

        return [
            {
                "content": row["content"],
                "source_file": row["source_file"],
                "similarity": float(row["similarity"]),
            }
            for row in rows
            if float(row["similarity"]) > 0.5
        ]
    except Exception as exc:
        logger.warning("RAG retrieval failed: %s", exc)
        return []
