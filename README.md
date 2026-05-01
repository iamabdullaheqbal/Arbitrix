# Arbitrix
### *Three Minds. One Verdict.*

---

## Introduction

Arbitrix is a multi-agent AI legal consulting platform that analyzes contracts through three expert AI personas simultaneously — a Lawyer, a Businessman, and a Regulator — who debate every clause in real time before a Synthesis agent delivers a final verdict. It solves a critical gap in Pakistan's SME and startup ecosystem: most founders and freelancers sign contracts they don't fully understand, with no affordable access to legal review. Unlike generic AI tools trained on Western legal templates, Arbitrix is built natively for Pakistani law — grounded in the Contract Act 1872, Companies Act 2017, SECP regulations, and SBP guidelines. Every verdict is delivered in both English and Urdu, making professional-grade contract analysis accessible to a wider audience.

---

## How It Works

1. **Upload** — User uploads a contract PDF. PyMuPDF extracts the full text server-side.
2. **Parallel Analysis** — Three Gemini agents fire simultaneously via `asyncio.gather()`:
   - **Lawyer** — flags legally dangerous clauses under Pakistani contract law
   - **Businessman** — identifies commercial and financial risks
   - **Regulator** — checks compliance against SECP, SBP, PTA, and sector-specific rules
3. **Live Streaming** — Each agent streams its findings token-by-token to the frontend via SSE, populating three columns in real time.
4. **Synthesis** — Once all three agents complete, a fourth Synthesis agent consolidates their findings into a structured verdict: risk score, red flags with severity ratings, actionable recommendations, and a bilingual summary.

---

## Features

- **Multi-agent parallel analysis** — three expert personas run concurrently, not sequentially
- **Live SSE streaming** — token-by-token debate visible on screen as it happens
- **Risk score 1–10** — color-coded gauge (green / amber / red) for instant risk assessment
- **Bilingual output** — full verdict in English and Urdu (Noto Nastaliq, RTL)
- **Pakistani law native** — Contract Act 1872, Companies Act 2017, SECP, SBP, PTA
- **PDF upload** — drag-and-drop or file picker, up to 20 MB
- **Structured red flags** — each flag cites the exact clause, risk explanation, severity (HIGH / MEDIUM / LOW), and the agent that raised it
- **No data retention** — contracts are analyzed in memory and never stored

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 + Tailwind CSS v4 | UI, routing, SSE consumer |
| Backend | Python 3.13 + FastAPI | API server, async orchestration |
| LLM | Gemini 1.5 Pro (`google-genai`) | All four AI agents |
| PDF Parsing | PyMuPDF (`fitz`) | Text extraction from uploaded PDFs |
| Streaming | Server-Sent Events (`sse-starlette`) | Real-time token delivery to frontend |
| Config | `pydantic-settings` + `python-dotenv` | Typed environment variable management |
| Backend Package Manager | `uv` | Dependency management — never `pip install` |
| Frontend Package Manager | `npm` | Node dependency management |

---

## Project Structure

```
arbitrix/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── agents/
│   │   ├── lawyer.py
│   │   ├── businessman.py
│   │   ├── regulator.py
│   │   └── synthesis.py
│   ├── services/
│   │   ├── pdf_extractor.py
│   │   └── orchestrator.py
│   ├── models/
│   │   └── schemas.py
│   ├── pyproject.toml
│   └── .env
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── analyze/
    │   │   ├── debate/
    │   │   └── verdict/
    │   ├── components/
    │   │   └── arbitrix/
    │   └── contexts/
    │       └── AppContext.tsx
    └── package.json
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- [`uv`](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- Gemini API key from [Google AI Studio](https://aistudio.google.com)

---

## Running the Backend

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Install dependencies
uv sync

# 3. Create the environment file
cp .env.example .env
# Then open .env and set your key:
# GEMINI_API_KEY=your_key_here

# 4. Start the server
uvicorn main:app --reload
```

Backend runs at **http://localhost:8000**

---

## Running the Frontend

```bash
# 1. Open a new terminal and navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Environment Variables

| Variable | Where to get it | Used by |
|---|---|---|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | Backend — all Gemini agent calls |
| `GEMINI_MODEL` | Set to `gemini-1.5-pro` (default) | Backend — model selection |
| `CORS_ORIGIN` | Set to `http://localhost:3000` (default) | Backend — CORS policy |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Accepts a PDF file, extracts text via PyMuPDF, returns `{ contract_id, text }` |
| `POST` | `/analyze` | Accepts `{ contract_text }`, fires three agents in parallel, returns SSE stream |
| `POST` | `/verdict` | Accepts `{ lawyer, businessman, regulator }` outputs, returns synthesized verdict JSON |

---

## Team

| Name | Role | Responsibilities |
|---|---|---|
| Abdullah | Backend Engineer | FastAPI, agent orchestration, SSE streaming |
| Sharina | Frontend Engineer | Next.js UI, SSE consumer, verdict card |

**Organization:** Archonera
