# Arbitrix
### *Three Minds. One Verdict.*

AI-powered legal contract analysis platform built natively for Pakistani law. Upload a contract, watch three expert AI advisors debate it in real time, and receive a structured verdict in English and Urdu.

---

## How It Works

1. **Upload** — Drop a PDF or DOCX contract. Text is extracted server-side via PyMuPDF or python-docx.
2. **RAG Retrieval** — Before agents fire, three parallel vector searches pull relevant precedents from a Neon DB of Pakistani legal documents (Contract Act 1872, Companies Act 2017, SECP regulations, SBP guidelines).
3. **Parallel Analysis** — Three Gemini agents run simultaneously via `asyncio.gather()`:
   - **Lawyer** — flags legally dangerous clauses under Pakistani contract law
   - **Businessman** — identifies commercial and financial risks
   - **Regulator** — checks compliance against SECP, SBP, PTA, and sector rules
4. **Live Streaming** — Each agent streams findings token-by-token to the frontend via SSE, populating three columns in real time.
5. **Synthesis** — A fourth agent consolidates all findings into a structured verdict: risk score, red flags with severity, recommendations, and a bilingual summary.
6. **Urdu Translation** — If Urdu mode is selected, a translation pass renders the full verdict in Urdu with RTL layout and Noto Nastaliq font.

---

## Features

- Multi-agent parallel analysis — three expert personas run concurrently, not sequentially
- RAG pipeline — 3,200+ chunks from Pakistani legal documents ingested into Neon pgvector
- Live SSE streaming — token-by-token debate visible on screen as it happens
- Two analysis modes — Technical (formal legal language) and Plain Language (simple explanations)
- Bilingual output — full verdict in English and Urdu with proper RTL rendering
- Risk score 1–10 — color-coded (green / amber / red) for instant risk assessment
- Structured red flags — exact clause quote, risk explanation, severity (HIGH / MEDIUM / LOW), agent source
- PDF and DOCX support — drag-and-drop or file picker, up to 20 MB
- Retry with exponential backoff — handles Gemini rate limits gracefully
- Session-only state — no localStorage, no data persistence, resets on refresh

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS v4 | UI, routing, SSE consumer |
| Backend | Python 3.13 + FastAPI | API server, async orchestration |
| LLM | Gemini 1.5 Flash (`google-genai`) | All four AI agents + Urdu translation |
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
│   ├── main.py                     # FastAPI app, endpoints, lifespan
│   ├── config.py                   # Typed settings via pydantic-settings
│   ├── setup_db.sql                # Neon DB schema (run once on Neon dashboard)
│   ├── pyproject.toml
│   ├── .env                        # GEMINI_API_KEY, NEON_DATABASE_URL, etc.
│   │
│   ├── agents/                     # System prompt definitions
│   │   ├── lawyer.py
│   │   ├── businessman.py
│   │   ├── regulator.py
│   │   └── synthesis.py
│   │
│   ├── services/
│   │   ├── orchestrator.py         # RAG fetch → agent dispatch → synthesis → translation
│   │   └── pdf_extractor.py        # PyMuPDF text extraction
│   │
│   ├── models/
│   │   └── schemas.py              # Pydantic request/response models
│   │
│   ├── rag/
│   │   ├── db.py                   # asyncpg pool, schema auto-creation
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
│       └── sample_contracts/       # (add sample contracts here)
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
        │   ├── Providers.tsx           # React Query + theme providers
        │   ├── NavLink.tsx
        │   ├── arbitrix/               # Domain-specific components
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
        │   └── ui/                     # shadcn/ui primitives (button, card, etc.)
        │
        ├── contexts/
        │   └── AppContext.tsx          # Global state: contractText, verdict, mode, lang
        │
        ├── hooks/
        │   ├── use-mobile.tsx
        │   └── use-toast.ts
        │
        └── lib/
            ├── i18n.ts                 # EN / UR translation strings
            └── utils.ts                # Tailwind class merge helper
```

---

## Prerequisites

- Python 3.13+
- Node.js 18+
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- Gemini API key from [Google AI Studio](https://aistudio.google.com)
- Neon DB account — [neon.tech](https://neon.tech) (free tier works)

---

## Setup

### 1. Clone and configure environment

```bash
# Backend
cd backend
cp .env .env.local   # or edit .env directly
```

Set these values in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
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

### 3. Ingest legal documents

Place Pakistani legal PDFs/DOCXs into subfolders under `backend/legal_docs/`:

```
legal_docs/
├── core_law/      ← Contract Act, Companies Act, etc.
├── secp/          ← SECP regulations
├── sbp/           ← SBP guidelines
└── sample_contracts/
```

Then run:

```bash
cd backend
uv run python scripts/ingest_docs.py ./legal_docs
```

This embeds and stores all documents into Neon. Skips already-ingested files automatically.

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
| `GEMINI_API_KEY` | Yes | From [aistudio.google.com](https://aistudio.google.com) |
| `GEMINI_MODEL` | No | Default: `gemini-1.5-flash` |
| `CORS_ORIGIN` | No | Default: `http://localhost:3000` |
| `NEON_DATABASE_URL` | Yes (for RAG) | Neon connection string with `sslmode=require` |
| `NEXT_PUBLIC_API_URL` | No | Default: `http://localhost:8000` |

RAG is optional — if `NEON_DATABASE_URL` is missing or Neon is unreachable, agents run with base prompts only. The app never crashes due to RAG failure.

---

## API Endpoints

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/upload` | `multipart/form-data` — PDF or DOCX file | `{ contract_id, contract_text }` |
| `POST` | `/analyze` | `{ contract_text, mode, language }` | SSE stream of agent events |
| `POST` | `/verdict` | `{ lawyer, businessman, regulator }` | Synthesized verdict JSON |

### SSE Event Shape (`/analyze`)

```json
// Streaming chunk
{ "agent": "lawyer", "chunk": "token text", "done": false }

// Agent complete
{ "agent": "lawyer", "chunk": "", "done": true }

// Synthesis complete (final event)
{ "agent": "synthesis", "chunk": "", "done": true, "verdict": { ... } }
```

### Verdict Shape

```json
{
  "risk_score": 7.4,
  "red_flags": [
    { "clause": "...", "risk": "...", "severity": "HIGH", "agent": "lawyer" }
  ],
  "recommendations": ["..."],
  "summary_english": "...",
  "summary_urdu": "..."
}
```

---

## Team

| Name | Role |
|---|---|
| Abdullah | Backend — FastAPI, RAG pipeline, agent orchestration, SSE streaming |
| Sharina | Frontend — Next.js UI, SSE consumer, verdict page, Urdu support |

**Organization:** Archonera
