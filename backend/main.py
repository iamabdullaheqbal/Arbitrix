import json
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from config import settings
from models.schemas import AnalyzeRequest, UploadResponse, VerdictRequest, VerdictResponse
from services.pdf_extractor import extract_text_from_pdf
from services.orchestrator import analyze_contract_stream, synthesize_verdict


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Arbitrix API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload", response_model=UploadResponse)
async def upload_contract(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    
    try:
        text = extract_text_from_pdf(file_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Failed to extract PDF text: {exc}")
    
    if not text:
        raise HTTPException(status_code=422, detail="No text could be extracted from the PDF.")
    
    return UploadResponse(contract_id=str(uuid.uuid4()), text=text)


@app.post("/analyze")
async def analyze_contract(request: AnalyzeRequest):
    if not request.contract_text.strip():
        raise HTTPException(status_code=400, detail="contract_text cannot be empty.")
    
    async def event_generator():
        try:
            async for event in analyze_contract_stream(request.contract_text):
                yield {"data": json.dumps(event)}
        except Exception as exc:
            yield {"data": json.dumps({"error": str(exc)})}
    
    return EventSourceResponse(event_generator())


@app.post("/verdict", response_model=VerdictResponse)
async def get_verdict(request: VerdictRequest):
    if not all([request.lawyer.strip(), request.businessman.strip(), request.regulator.strip()]):
        raise HTTPException(status_code=400, detail="All three agent outputs are required.")
    
    try:
        result = await synthesize_verdict(request.lawyer, request.businessman, request.regulator)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Synthesis agent returned invalid JSON: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Synthesis failed: {exc}")
    
    return VerdictResponse(**result)
