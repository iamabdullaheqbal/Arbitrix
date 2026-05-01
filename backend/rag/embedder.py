from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


class Embedder:
    """Singleton wrapper around sentence-transformers all-MiniLM-L6-v2 (384 dims)."""

    _instance: "Embedder | None" = None

    def __new__(cls) -> "Embedder":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def _load(self) -> None:
        if self._loaded:
            return
        from sentence_transformers import SentenceTransformer
        logger.info("Loading sentence-transformers model all-MiniLM-L6-v2 …")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self._loaded = True

    def embed(self, text: str) -> list[float]:
        self._load()
        return self.model.encode(text).tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        self._load()
        return self.model.encode(texts).tolist()
