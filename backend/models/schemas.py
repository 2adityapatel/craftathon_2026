from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PublicAuthKeyResponse(BaseModel):
    public_key: str

# ── Original encrypted schema (kept for backward compatibility) ──────────────
class SubmitReportRequest(BaseModel):
    # Optional fields for encryption (to keep existing frontend working)
    encrypted_payload: Optional[str] = None
    encrypted_aes_key: Optional[str] = None
    original_hash: Optional[str] = None
    aes_iv: Optional[str] = None
    aes_tag: Optional[str] = None
    
    # New field for direct payload (no encryption)
    plain_payload: Optional[str] = None
    
    evidence_type: str
    description: Optional[str] = None

# ── New plain schema (no encryption, used by new endpoint) ──────────────────
class PlainSubmitRequest(BaseModel):
    description: Optional[str] = None
    image: Optional[str] = None   # base64-encoded image string
    url: Optional[str] = None     # target URL of the harmful content

class SubmitReportResponse(BaseModel):
    case_id: str
    case_key: str
    blockchain_tx: str
    ipfs_cid: str
    risk_score: float
    threat_level: str
    category: str
    message: str

class TrackCaseResponse(BaseModel):
    case_id: str
    status: str
    evidence_type: str
    category: str
    last_updated: str

# ── Admin schemas ─────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str

class UpdateStatusRequest(BaseModel):
    new_status: str   # Human-friendly string: "UNDER_REVIEW", "VERIFIED", etc.
    notes: str = ""

class CaseListItem(BaseModel):
    case_id: str
    status: str
    evidence_type: str
    risk_score: float
    category: str
    threat_level: str
    is_duplicate: bool
    should_escalate: bool
    submitted_at: Optional[datetime] = None
    blockchain_tx: Optional[str] = None

class CaseDetail(CaseListItem):
    confidence: float
    repeat_count: int
    repeat_offender: bool
    domain: Optional[str] = None
    ipfs_cid: str
    evidence_hash: str
    last_updated: Optional[datetime] = None

class StatusHistoryItem(BaseModel):
    old_status: str
    new_status: str
    notes: Optional[str] = None
    updated_at: Optional[datetime] = None
    blockchain_tx: Optional[str] = None

class DashboardStats(BaseModel):
    total_cases: int
    by_status: dict
    by_threat_level: dict
    escalated_count: int
    duplicate_count: int
    chain_count: int   # live count from blockchain
