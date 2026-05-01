from __future__ import annotations

import logging
from typing import Optional

import asyncpg
from pgvector.asyncpg import register_vector

from config import settings

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> None:
    """Create the asyncpg connection pool. Called on app startup."""
    global _pool
    if not settings.neon_database_url:
        logger.warning("NEON_DATABASE_URL not set — RAG disabled.")
        return
    try:
        _pool = await asyncpg.create_pool(
            settings.neon_database_url,
            ssl="require",
            min_size=2,
            max_size=10,
            init=_init_conn,
        )
        logger.info("Neon DB pool created.")
    except Exception as exc:
        logger.warning("Could not connect to Neon DB: %s — RAG disabled.", exc)
        _pool = None


async def _init_conn(conn: asyncpg.Connection) -> None:
    await register_vector(conn)


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> Optional[asyncpg.Pool]:
    return _pool
