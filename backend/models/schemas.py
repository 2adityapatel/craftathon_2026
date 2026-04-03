from pydantic import BaseModel
from typing import Optional

class PublicAuthKeyResponse(BaseModel):
    public_key: str

class SubmitReportRequest(BaseModel):
    encrypted_payload: str
    encrypted_aes_key: str
    original_hash: str
    evidence_type: str
    description: Optional[str] = None
    # For AES-GCM decryption, frontend needs to send these along (or they can be embedded in encrypted_payload)
    aes_iv: Optional[str] = None
    aes_tag: Optional[str] = None

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

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "authority"
