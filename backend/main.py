from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from crypto.keys import get_public_key_pem
from models.schemas import (
    PublicAuthKeyResponse, SubmitReportRequest, SubmitReportResponse, 
    TrackCaseResponse, AdminLoginRequest, TokenResponse
)
from services.privacy_service import PrivacyService
from services.ai_analysis_service import AIAnalysisService
from services.report_service import ReportService
from services.case_management_service import CaseManagementService
from blockchain.reader import BlockchainReader
from storage.database import SessionLocal, Case
from middleware.security import create_access_token, verify_password, get_current_admin
import hashlib
from datetime import timedelta
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI(title="POCSO Blockchain Reporting System", version="1.0.0")

# Rate Limiting Setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "POCSO API is running. Layer 2 Backend is active."}

@app.get("/api/v1/public-key", response_model=PublicAuthKeyResponse)
def get_public_key():
    """
    Returns the RSA public key used for encrypting the AES key client-side.
    """
    try:
        pem = get_public_key_pem(settings.rsa_public_key_path)
        return PublicAuthKeyResponse(public_key=pem)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Public key not found on server. Please generate keys first.")

@app.post("/api/v1/submit", response_model=SubmitReportResponse)
@limiter.limit(settings.rate_limit)
async def submit_report(request: Request, payload: SubmitReportRequest):
    """
    1. Decrypt AES key & Payload
    2. Run AI Scoring
    3. Generate case ID & case Key
    4. Save to DB
    """
    try:
        # Step 1: Decrypt and Verify
        clean_payload = PrivacyService.decrypt_and_verify(
            encrypted_payload=payload.encrypted_payload,
            encrypted_aes_key=payload.encrypted_aes_key,
            original_hash=payload.original_hash,
            aes_iv=payload.aes_iv,
            aes_tag=payload.aes_tag
        )
        
        # Step 2: AI Analysis
        analysis_results = await AIAnalysisService.analyze_evidence(
            evidence_type=payload.evidence_type,
            content=clean_payload,
            description=payload.description
        )
        
        # Step 3 & 4: Save Report (IPFS + Blockchain + DB)
        case_id, case_key, ipfs_cid, tx_hash = ReportService.create_report(
            evidence_type=payload.evidence_type,
            analysis_results=analysis_results,
            encrypted_payload=clean_payload,
            evidence_hash=payload.original_hash
        )
        
        return SubmitReportResponse(
            case_id=case_id,
            case_key=case_key,
            blockchain_tx=tx_hash,
            ipfs_cid=ipfs_cid,
            risk_score=analysis_results["risk_score"],
            threat_level=analysis_results["threat_level"],
            category=analysis_results["category"],
            message="Report highly secured and saved successfully. Keep your case key safe!"
        )
        
    except ValueError as val_e:
        raise HTTPException(status_code=400, detail=str(val_e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.get("/api/v1/track", response_model=TrackCaseResponse)
def track_report(case_id: str, case_key: str):
    """
    Look up a case anonymously using the case_id and the raw case_key.
    We hash the passed case_key and compare it to the DB's case_key_hash.
    """
    db = SessionLocal()
    try:
        case_record = db.query(Case).filter(Case.case_id == case_id).first()
        if not case_record:
            raise HTTPException(status_code=404, detail="Case not found.")
            
        # Hash the provided key to verify
        provided_hash = hashlib.sha256(case_key.encode()).hexdigest()
        
        if case_record.case_key_hash != provided_hash:
            raise HTTPException(status_code=403, detail="Invalid Case Key. Access Denied.")
            
        return TrackCaseResponse(
            case_id=case_record.case_id,
            status=case_record.status,
            evidence_type=case_record.evidence_type,
            category=case_record.category,
            last_updated=str(case_record.last_updated)
        )
    finally:
        db.close()

@app.post("/api/v1/admin/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login_admin(request: Request, payload: AdminLoginRequest):
    """
    Verifies admin credentials and returns a JWT access token.
    For hackathon purposes, if no hash is set in config, a default is used.
    """
    # 1. Check for default demo credentials if no hash exists
    if not settings.admin_password_hash or settings.admin_password_hash == "":
        if payload.username == "admin" and payload.password == "pocso_authority_2026":
            access_token = create_access_token(data={"sub": payload.username})
            return TokenResponse(access_token=access_token)
    
    # 2. Check against environmental credentials
    if payload.username != settings.admin_username:
         raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # 3. Verify BCrypt Hash
    try:
        if not verify_password(payload.password, settings.admin_password_hash):
            raise HTTPException(status_code=401, detail="Invalid username or password")
    except Exception:
         # Fallback if bcrypt library itself has issues on the host
         raise HTTPException(status_code=500, detail="Security module error")

    access_token = create_access_token(data={"sub": payload.username})
    return TokenResponse(access_token=access_token)

# ── Administrative Endpoints (Protected) ──

@app.get("/api/v1/admin/cases")
async def get_all_cases(priority: Optional[str] = None, current_user: str = Depends(get_current_admin)):
    """
    List all cases from the database.
    Can be filtered by priority (risk_score >= 0.8).
    """
    return CaseManagementService.get_all_cases(priority=priority)

@app.get("/api/v1/admin/case/{case_id}")
async def get_case_detail(case_id: str, current_user: str = Depends(get_current_admin)):
    """
    Returns full details of a specific case, including its status history.
    """
    detail = CaseManagementService.get_case_detail(case_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Case not found")
    return detail

@app.post("/api/v1/admin/case/{case_id}/status")
async def update_status(case_id: str, payload: dict, current_user: str = Depends(get_current_admin)):
    """
    Updates the status of a case. 
    This triggers a Blockchain anchor to ensure immutability.
    """
    new_status = payload.get("status")
    notes = payload.get("notes", "")
    
    if not new_status:
        raise HTTPException(status_code=400, detail="Missing status in payload")

    tx_hash = CaseManagementService.update_case_status(
        case_id=case_id,
        new_status=new_status,
        notes=notes,
        admin_user=current_user
    )
    return {"message": "Status updated successfully", "blockchain_tx": tx_hash}

@app.get("/api/v1/admin/audit")
async def get_audit_log(current_user: str = Depends(get_current_admin)):
    """
    Fetches the tamper-proof audit trail directly from the Sepolia blockchain.
    """
    reader = BlockchainReader()
    return reader.get_audit_events()

@app.get("/api/v1/admin/domains")
async def get_repeated_domains(current_user: str = Depends(get_current_admin)):
    """
    Returns domains ordered by frequency to identify repeat offenders.
    """
    db = SessionLocal()
    try:
        from sqlalchemy import func
        results = db.query(
            Case.domain, 
            func.count(Case.case_id).label("count"),
            func.max(Case.last_updated).label("last_seen"),
            Case.status
        ).filter(Case.domain != None).group_by(Case.domain).all()
        
        return [
            {"domain": r.domain, "count": r.count, "last_seen": str(r.last_seen), "status": r.status}
            for r in results
        ]
    finally:
        db.close()
