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

def _split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def chunk_text(text: str, min_len: int = 50, max_len: int = 500, overlap: int = 50) -> list[str]:
    """Split text into chunks of min_len–max_len chars with *overlap* carry-over."""
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: list[str] = []
    carry = ""

    for para in paragraphs:
        working = (carry + " " + para).strip() if carry else para

        if len(working) <= max_len:
            if len(working) >= min_len:
                chunks.append(working)
                carry = working[-overlap:] if len(working) > overlap else working
            else:
                carry = working  # accumulate short paragraphs
            continue

        # Para too long — split by sentence
        sentences = _split_sentences(working)
        buf = ""
        for sent in sentences:
            candidate = (buf + " " + sent).strip() if buf else sent
            if len(candidate) > max_len:
                if len(buf) >= min_len:
                    chunks.append(buf)
                    carry = buf[-overlap:] if len(buf) > overlap else buf
                buf = (carry + " " + sent).strip() if carry else sent
            else:
                buf = candidate
        if len(buf) >= min_len:
            chunks.append(buf)
            carry = buf[-overlap:] if len(buf) > overlap else buf
        elif buf:
            carry = buf

    # Flush remaining carry if substantial
    if len(carry) >= min_len and (not chunks or chunks[-1] != carry):
        chunks.append(carry)

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

        chunks = chunk_text(raw_text)
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
