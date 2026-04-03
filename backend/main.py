from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from crypto.keys import get_public_key_pem
from models.schemas import PublicAuthKeyResponse, SubmitReportRequest, SubmitReportResponse, TrackCaseResponse
from services.privacy_service import PrivacyService
from services.ai_analysis_service import AIAnalysisService
from services.report_service import ReportService
from storage.database import SessionLocal, Case
import hashlib
app = FastAPI(title="POCSO Blockchain Reporting System", version="1.0.0")

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
async def submit_report(payload: SubmitReportRequest):
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
        
        # Step 3 & 4: Save Report
        # Mocking Blockchain TX and IPFS CID for now (until HOUR 14-20)
        mock_tx = "0x0000000000000000000mock_tx"
        mock_ipfs = "QmPlaceholderHash"
        
        case_id, case_key = ReportService.create_report(
            evidence_type=payload.evidence_type,
            analysis_results=analysis_results,
            ipfs_cid=mock_ipfs,
            evidence_hash=payload.original_hash,
            blockchain_tx=mock_tx
        )
        
        return SubmitReportResponse(
            case_id=case_id,
            case_key=case_key,
            blockchain_tx=mock_tx,
            ipfs_cid=mock_ipfs,
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
