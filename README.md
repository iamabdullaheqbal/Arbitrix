# Arbitrix
### *Three Minds. One Verdict.*

AI-powered legal contract analysis platform built natively for Pakistani law. Upload a contract, watch three expert AI advisors debate it in real time, and receive a structured verdict in English and Urdu.

**Live backend:** https://arbitrix.onrender.com

---

## How It Works

1. **Upload** — Drop a PDF or DOCX contract. Text is extracted server-side via PyMuPDF or python-docx.
2. **RAG Retrieval** — Before agents fire, three parallel vector searches pull relevant precedents from a Neon DB of Pakistani legal documents (Contract Act 1872, Companies Act 2017, SECP regulations, SBP guidelines).
3. **Parallel Analysis** — Three Gemini agents run simultaneously, each citing specific Pakistani law sections:
   - **Lawyer** — flags legally dangerous clauses, cites Contract Act 1872 / Companies Act 2017 sections
   - **Businessman** — identifies commercial and financial risks, cites labour and commercial regulations
   - **Regulator** — checks compliance against SECP, SBP, PTA, EOBI, ESSI with exact regulation citations
4. **Live Streaming** — Each agent streams findings token-by-token to the frontend via SSE.
5. **Synthesis** — A fourth Gemini agent consolidates findings into a calibrated verdict: risk score 1–10, red flags with severity, recommendations, and bilingual summary.
6. **Score Validation** — A post-synthesis validation layer prevents score inflation — fair contracts score 1–3, not 8–9.
7. **Urdu Translation** — Mistral translates the full verdict to Urdu with RTL layout and Noto Nastaliq font. Both languages cached in sessionStorage — language toggle is instant with zero extra API calls.

---

## Features

- Multi-agent parallel analysis — three expert personas run concurrently, not sequentially
- Law citation enforcement — every finding must cite a specific Pakistani law, act, or section number
- Calibrated risk scoring — fair contracts score low; score validation layer prevents hallucinated high scores
- RAG pipeline — 3,200+ chunks from Pakistani legal documents ingested into Neon pgvector
- Live SSE streaming — token-by-token debate visible on screen as it happens
- Two analysis modes — Technical (formal legal language) and Plain Language (simple explanations)
- Bilingual output — full verdict in English and Urdu, both generated in one backend call
- Session cache — both language versions stored in sessionStorage; language toggle needs zero API calls
- Risk score 1–10 — color-coded (green / amber / red) for instant risk assessment
- Structured red flags — exact clause quote, risk with law citation, severity (HIGH / MEDIUM / LOW), agent source
- PDF and DOCX support — drag-and-drop or file picker, up to 20 MB
- Retry with exponential backoff — respects Gemini's `retryDelay` header on 429 errors
- Session-only state — no localStorage, no data persistence, resets on page refresh

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS v4 | UI, routing, SSE consumer |
| Backend | Python 3.13 + FastAPI | API server, async orchestration |
| Agents + Synthesis | Gemini 1.5 Flash (`google-genai`) | Three analysis agents + synthesis |
| Translation | Mistral Small (`mistralai`) | English → Urdu verdict translation |
| Embeddings | `sentence-transformers` all-MiniLM-L6-v2 | Local 384-dim embeddings for RAG |
| Vector DB | Neon DB + pgvector | Stores and queries legal document chunks |
| PDF Parsing | PyMuPDF (`fitz`) | Text extraction from PDF contracts |
| DOCX Parsing | `python-docx` | Text extraction from Word contracts |
| Streaming | Server-Sent Events (`sse-starlette`) | Real-time token delivery to frontend |
| DB Driver | `asyncpg` | Async PostgreSQL connection pool |
| Config | `pydantic-settings` + `python-dotenv` | Typed environment variable management |
| Backend PM | `uv` | Dependency management |
| Frontend PM | `npm` | Node dependency management |

---

## Project Structure

```
arbitrix/
├── backend/
│   ├── main.py                     # FastAPI app, endpoints, CORS, lifespan
│   ├── config.py                   # Typed settings (Gemini, Mistral, Neon, CORS)
│   ├── setup_db.sql                # Neon DB schema — run once on Neon dashboard
│   ├── pyproject.toml
│   ├── .env                        # API keys and connection strings
│   │
│   ├── agents/                     # System prompt definitions
│   │   ├── lawyer.py               # Cites Contract Act 1872, Companies Act 2017
│   │   ├── businessman.py          # Cites labour law, commercial regulations
│   │   ├── regulator.py            # Cites SECP, SBP, EOBI, ESSI, PTA
│   │   └── synthesis.py            # Calibrated scoring guide + honest assessment rules
│   │
│   ├── services/
│   │   ├── orchestrator.py         # RAG → agents → synthesis → score validation → translation
│   │   └── pdf_extractor.py        # PyMuPDF text extraction
│   │
│   ├── models/
│   │   └── schemas.py              # Pydantic request/response models
│   │
│   ├── rag/
│   │   ├── db.py                   # asyncpg pool, pgvector codec, schema auto-creation
│   │   ├── embedder.py             # Singleton sentence-transformers wrapper
│   │   ├── ingester.py             # PDF/DOCX reader, sentence chunker, batch insert
│   │   └── retriever.py            # Cosine similarity search, pool + standalone fallback
│   │
│   ├── scripts/
│   │   └── ingest_docs.py          # CLI: uv run python scripts/ingest_docs.py ./legal_docs
│   │
│   └── legal_docs/                 # Pakistani legal documents for RAG ingestion
│       ├── core_law/               # Contract Act 1872, Companies Act 2017, Arbitration Act 1940
│       ├── secp/                   # SECP Companies Regulations
│       ├── sbp/                    # SBP EFT Act
│       └── sample_contracts/
│
└── frontend/
    ├── package.json
    └── src/
        ├── index.css               # Global styles, Tailwind, custom tokens
        ├── app/
        │   ├── layout.tsx          # Root layout, Noto Nastaliq font, Navbar
        │   ├── page.tsx            # Landing page
        │   ├── not-found.tsx
        │   ├── analyze/
        │   │   ├── page.tsx
        │   │   └── AnalyzeClient.tsx   # Mode selector + contract type + upload
        │   ├── debate/
        │   │   ├── page.tsx
        │   │   └── DebateClient.tsx    # SSE consumer, three-column live stream
        │   ├── verdict/
        │   │   ├── page.tsx
        │   │   └── VerdictClient.tsx   # Risk score, red flags, summaries, debate replay
        │   └── features/
        │       └── page.tsx
        │
        ├── components/
        │   ├── Providers.tsx
        │   ├── arbitrix/
        │   │   ├── Navbar.tsx          # Language toggle (EN / اردو)
        │   │   ├── Hero.tsx
        │   │   ├── HowItWorks.tsx
        │   │   ├── KnowledgeSection.tsx
        │   │   ├── TrustSection.tsx
        │   │   ├── ContractTypeSelector.tsx
        │   │   ├── UploadZone.tsx      # Drag-drop upload, calls POST /upload
        │   │   ├── LiveDebate.tsx      # Animated debate replay with real findings
        │   │   ├── Verdict.tsx
        │   │   └── DisclaimerStrip.tsx
        │   └── ui/                     # shadcn/ui primitives
        │
        ├── contexts/
        │   └── AppContext.tsx          # Global state + sessionStorage bilingual cache
        │
        ├── hooks/
        │   ├── use-mobile.tsx
        │   └── use-toast.ts
        │
        └── lib/
            ├── i18n.ts                 # EN / UR translation strings
            └── utils.ts
```

---

## Prerequisites

- Python 3.13+
- Node.js 18+
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- Gemini API key — [aistudio.google.com](https://aistudio.google.com) (use `gemini-1.5-flash` for higher free-tier limits)
- Mistral API key — [console.mistral.ai](https://console.mistral.ai) (free tier available)
- Neon DB account — [neon.tech](https://neon.tech) (free tier works)

---

## Setup

### 1. Configure environment

Set these values in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
MISTRAL_API_KEY=your_mistral_api_key_here
CORS_ORIGIN=http://localhost:3000
NEON_DATABASE_URL=postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Set this in `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Set up Neon DB

Run `backend/setup_db.sql` in the Neon SQL editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS legal_chunks (
    id           SERIAL PRIMARY KEY,
    source_file  TEXT NOT NULL,
    chunk_index  INTEGER NOT NULL,
    content      TEXT NOT NULL,
    embedding    vector(384),
    doc_type     TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS legal_chunks_embedding_idx
    ON legal_chunks USING hnsw (embedding vector_cosine_ops);
```

The schema is also auto-created on first startup if the table doesn't exist.

### 3. Ingest legal documents

Place Pakistani legal PDFs/DOCXs into subfolders under `backend/legal_docs/`:

```
legal_docs/
├── core_law/      ← Contract Act 1872, Companies Act 2017, Arbitration Act 1940
├── secp/          ← SECP Companies Regulations
├── sbp/           ← SBP EFT Act, FE Manual
└── sample_contracts/
```

Then run:

```bash
cd backend
uv run python scripts/ingest_docs.py ./legal_docs
```

Skips already-ingested files automatically. RAG is optional — agents run with base prompts if Neon is unreachable.

### 4. Run the backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | From [aistudio.google.com](https://aistudio.google.com) — use `gemini-1.5-flash` (1500 req/day free) |
| `GEMINI_MODEL` | No | Default: `gemini-1.5-flash` |
| `MISTRAL_API_KEY` | Yes (for Urdu) | From [console.mistral.ai](https://console.mistral.ai) — used only for translation |
| `CORS_ORIGIN` | No | Default: `http://localhost:3000` |
| `NEON_DATABASE_URL` | Yes (for RAG) | Neon connection string with `sslmode=require` |
| `NEXT_PUBLIC_API_URL` | No | Default: `http://localhost:8000` |

---

## API Endpoints

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/upload` | `multipart/form-data` — PDF or DOCX | `{ contract_id, contract_text }` |
| `POST` | `/analyze` | `{ contract_text, mode, language }` | SSE stream of agent events |
| `POST` | `/verdict` | `{ lawyer, businessman, regulator }` | Synthesized verdict JSON |

### SSE Event Shape (`/analyze`)

```json
// Streaming chunk
{ "agent": "lawyer", "chunk": "token text", "done": false }

// Agent complete
{ "agent": "lawyer", "chunk": "", "done": true }

// Synthesis complete — verdict contains both language versions
{
  "agent": "synthesis",
  "chunk": "",
  "done": true,
  "verdict": {
    "english": { "risk_score": 2.1, "red_flags": [...], "recommendations": [...], "summary_english": "..." },
    "urdu":    { "risk_score": 2.1, "red_flags": [...], "recommendations": [...], "summary_urdu": "..." }
  }
}
```

### Risk Score Guide

| Score | Meaning |
|---|---|
| 1–2 | Well-drafted, fair contract — no major issues |
| 3–4 | Minor issues only — largely fair |
| 5–6 | Several MEDIUM findings — unfair in notable ways |
| 7–8 | At least one HIGH finding — significant risk |
| 9–10 | Multiple HIGH findings — illegal clauses or severe rights violations |

---

## Team

| Name | Role |
|---|---|
| Abdullah | Backend — FastAPI, RAG pipeline, agent orchestration, SSE streaming, scoring calibration |
| Sharina | Frontend — Next.js UI, SSE consumer, verdict page, bilingual cache, Urdu support |

**Organization:** Archonera
