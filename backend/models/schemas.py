from pydantic import BaseModel
from typing import Optional

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

