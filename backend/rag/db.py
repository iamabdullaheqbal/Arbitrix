from __future__ import annotations

import logging
from typing import Optional

import asyncpg
from pgvector.asyncpg import register_vector

from config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def _init_conn(conn: asyncpg.Connection) -> None:
    # Ensure the pgvector extension exists, then register the codec.
    await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
    await register_vector(conn)


async def _ensure_schema(pool: asyncpg.Pool) -> None:
    """Create the legal_chunks table and index if they don't exist yet."""
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS legal_chunks (
                id          SERIAL PRIMARY KEY,
                source_file TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                content     TEXT NOT NULL,
                embedding   vector(384),
                doc_type    TEXT NOT NULL,
                created_at  TIMESTAMP DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx
            ON legal_chunks
            USING hnsw (embedding vector_cosine_ops)
        """)


async def init_pool() -> None:
    """Create the asyncpg connection pool. Called on app startup."""
    global _pool
    if not settings.neon_database_url:
        logger.warning("NEON_DATABASE_URL not set — RAG disabled.")
        print("NEON_DATABASE_URL not set — RAG disabled.")
        return
    try:
        # min_size=0 prevents asyncpg from opening connections eagerly during
        # create_pool — connections are only opened on first acquire(), at which
        # point the init callback has already registered the vector codec.
        _pool = await asyncpg.create_pool(
            settings.neon_database_url,
            ssl="require",
            min_size=0,
            max_size=10,
            init=_init_conn,
        )
        logger.info("Neon DB pool created.")
        await _ensure_schema(_pool)
        print("Connecting to Neon DB … connected")
    except Exception as exc:
        logger.warning("Could not connect to Neon DB: %s — RAG disabled.", exc)
        print(f"Could not connect to Neon DB: {exc} — RAG disabled.")
        _pool = None


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool
