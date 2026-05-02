from __future__ import annotations

import logging
import re
from pathlib import Path

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Document readers
# ---------------------------------------------------------------------------

def _read_pdf(path: Path) -> str:
    import fitz  # PyMuPDF
    doc = fitz.open(str(path))
    return "\n".join(page.get_text() for page in doc)


def _read_docx(path: Path) -> str:
    from docx import Document
    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def read_document(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _read_pdf(path)
    if suffix == ".docx":
        return _read_docx(path)
    raise ValueError(f"Unsupported file type: {suffix}")


# ---------------------------------------------------------------------------
# Chunker
# ---------------------------------------------------------------------------

def chunk_by_sentences(text: str, sentences_per_chunk: int = 4) -> list[str]:
    """
    Split *text* into overlapping sentence-based chunks.

    Rules:
    - Split on sentence boundaries (. ! ?)
    - Group sentences_per_chunk sentences per chunk
    - Overlap of 1 sentence between consecutive chunks
    - Keep chunks between 40–800 chars; split oversized chunks at commas
    - Skip sentences shorter than 20 chars (headers, page numbers, etc.)
    """
    # Normalise whitespace first
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Split on sentence-ending punctuation followed by whitespace or end
    raw = re.split(r"(?<=[.!?])[\s]+", text)
    sentences = [s.strip() for s in raw if len(s.strip()) > 20]

    chunks: list[str] = []
    step = max(1, sentences_per_chunk - 1)  # overlap = 1 sentence

    for i in range(0, len(sentences), step):
        group = sentences[i : i + sentences_per_chunk]
        chunk = " ".join(group).strip()

        if len(chunk) < 40:
            continue

        if len(chunk) <= 800:
            chunks.append(chunk)
        else:
            # Split oversized chunk at commas
            parts = chunk.split(", ")
            mid = max(1, len(parts) // 2)
            left = ", ".join(parts[:mid]).strip()
            right = ", ".join(parts[mid:]).strip()
            if len(left) >= 40:
                chunks.append(left)
            if len(right) >= 40:
                chunks.append(right)

    return chunks


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

async def _already_ingested(conn, source_file: str) -> bool:
    row = await conn.fetchrow(
        "SELECT 1 FROM legal_chunks WHERE source_file = $1 LIMIT 1", source_file
    )
    return row is not None


async def _batch_insert(conn, rows: list[dict]) -> None:
    await conn.executemany(
        """
        INSERT INTO legal_chunks (source_file, chunk_index, content, embedding, doc_type)
        VALUES ($1, $2, $3, $4, $5)
        """,
        [
            (r["source_file"], r["chunk_index"], r["content"], r["embedding"], r["doc_type"])
            for r in rows
        ],
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def ingest_file(filepath: str | Path, doc_type: str = "general") -> int:
    """
    Ingest a single PDF or DOCX file into Neon.
    Returns the number of chunks inserted (0 if already ingested or error).
    """
    from rag.db import get_pool
    from rag.embedder import singleton as embedder

    path = Path(filepath)
    pool = get_pool()
    if pool is None:
        logger.warning("No DB pool — skipping ingestion of %s", path.name)
        return 0

    async with pool.acquire() as conn:
        if await _already_ingested(conn, path.name):
            print(f"Skipping already ingested: {path.name}", flush=True)
            return 0

        try:
            raw_text = read_document(path)
        except Exception as exc:
            logger.error("Failed to read %s: %s", path.name, exc)
            return 0

        chunks = chunk_by_sentences(raw_text)
        if not chunks:
            logger.warning("No chunks produced from %s", path.name)
            return 0

        BATCH = 50
        total = len(chunks)
        inserted = 0

        for batch_start in range(0, total, BATCH):
            batch_texts = chunks[batch_start: batch_start + BATCH]
            try:
                embeddings = embedder.embed_batch(batch_texts)
            except Exception as exc:
                logger.error("Embedding failed for batch in %s: %s", path.name, exc)
                continue

            rows = [
                {
                    "source_file": path.name,
                    "chunk_index": batch_start + i,
                    "content": chunk,          # ← fixed: was `text` (outer var)
                    "embedding": emb,
                    "doc_type": doc_type,
                }
                for i, (chunk, emb) in enumerate(zip(batch_texts, embeddings))
            ]

            try:
                await _batch_insert(conn, rows)
                inserted += len(rows)
                print(
                    f"  Ingesting chunk {inserted}/{total} from {path.name}",
                    flush=True,
                )
            except Exception as exc:
                logger.error("DB insert failed for batch in %s: %s", path.name, exc)

        return inserted


async def ingest_folder(folder_path: str | Path) -> tuple[int, int]:
    """
    Walk *folder_path*, infer doc_type from immediate subfolder name,
    and ingest every .pdf / .docx file found.
    Returns (files_ingested, chunks_total).
    """
    root = Path(folder_path).resolve()
    files = [p for p in root.rglob("*") if p.suffix.lower() in {".pdf", ".docx"}]

    total_files = 0
    total_chunks = 0

    for file_path in files:
        # Infer doc_type from the immediate subfolder under root
        try:
            relative = file_path.relative_to(root)
            doc_type = relative.parts[0] if len(relative.parts) > 1 else "general"
        except ValueError:
            doc_type = "general"

        print(f"\nProcessing: {file_path.name} (doc_type={doc_type})", flush=True)
        n = await ingest_file(file_path, doc_type=doc_type)
        if n > 0:
            total_files += 1
            total_chunks += n

    return total_files, total_chunks
