from pydantic import BaseModel
from typing import List, Literal


class UploadResponse(BaseModel):
    contract_id: str
    contract_text: str


class AnalyzeRequest(BaseModel):
    contract_text: str
    mode: str = "technical"      # "technical" | "plain"
    language: str = "english"    # "english" | "urdu"


class Finding(BaseModel):
    clause: str
    risk: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]


class AgentResponse(BaseModel):
    findings: List[Finding]


class VerdictRequest(BaseModel):
    lawyer: str
    businessman: str
    regulator: str


class RedFlag(BaseModel):
    clause: str
    risk: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    agent: Literal["lawyer", "businessman", "regulator"]


class VerdictResponse(BaseModel):
    risk_score: float
    red_flags: List[RedFlag]
    recommendations: List[str]
    summary_english: str
    summary_urdu: str
