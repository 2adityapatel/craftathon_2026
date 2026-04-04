from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from crypto.keys import get_public_key_pem
from models.schemas import PublicAuthKeyResponse, SubmitReportRequest, SubmitReportResponse, TrackCaseResponse, PlainSubmitRequest
from services.privacy_service import PrivacyService
from services.ai_analysis_service import AIAnalysisService
from services.report_service import ReportService
from services.pinata_service import upload_image_bytes, upload_json
from services.blockchain_service import anchor_report_on_chain
from storage.database import SessionLocal, Case
import hashlib
import base64
import json
from routers import admin as admin_router

app = FastAPI(title="POCSO Blockchain Reporting System", version="1.0.0")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Admin Routes ─────────────────────────────────────────────────────────────
app.include_router(admin_router.router)

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
    1. Decrypt AES key & Payload (TEMPORARILY COMMENTED FOR TESTING)
    2. Run AI Scoring
    3. Generate case ID & case Key
    4. Save to DB
    """
    try:
        # --- ENCRYPTION BYPASS (TEMPORARY) ---
        if payload.plain_payload:
            clean_payload = payload.plain_payload.encode()
            report_hash = hashlib.sha256(clean_payload).hexdigest()
        else:
            # Original encryption logic (commented out for now)
            # clean_payload = PrivacyService.decrypt_and_verify(
            #     encrypted_payload=payload.encrypted_payload,
            #     encrypted_aes_key=payload.encrypted_aes_key,
            #     original_hash=payload.original_hash,
            #     aes_iv=payload.aes_iv,
            #     aes_tag=payload.aes_tag
            # )
            # report_hash = payload.original_hash
            raise HTTPException(status_code=400, detail="Encryption is disabled for this test. Please use plain_payload.")
        
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
            evidence_hash=report_hash,
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
            message="[DEBUG MODE] Report saved without encryption. Keep your case key safe!"
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
            
        # Auto-sync with Blockchain
        try:
            from services.blockchain_service import get_report_from_chain
            from routers.admin import STATUS_MAP
            
            # Helper to invert enum map
            REVERSE_STATUS = {v: k for k, v in STATUS_MAP.items()}
            
            chain_struct = get_report_from_chain(case_id)
            if chain_struct:
                chain_status_int = chain_struct[5] # Status enum is index 5
                chain_status_str = REVERSE_STATUS.get(chain_status_int, case_record.status)
                
                if chain_status_str != case_record.status:
                    import datetime
                    # Sync DB to Blockchain
                    case_record.status = chain_status_str
                    case_record.last_updated = datetime.datetime.utcnow()
                    db.commit()
                    print(f"Auto-synced '{case_id}' to {chain_status_str} from blockchain.")
                    
                    # Also append this ghost update to history
                    db.add(StatusHistory(
                        case_id=case_id,
                        old_status=case_record.status,
                        new_status=chain_status_str,
                        notes="Status auto-synced from Blockchain.",
                        updated_at=datetime.datetime.utcnow()
                    ))
                    db.commit()
        except Exception as e:
            print(f"Warning: Track sync failed: {e}")
            
        # Fetch history
        from storage.database import StatusHistory
        histories = db.query(StatusHistory).filter(StatusHistory.case_id == case_id).order_by(StatusHistory.updated_at.asc()).all()
        
        history_list = []
        history_list.append({
            "status": "RECEIVED",
            "timestamp": str(case_record.submitted_at),
            "notes": "Report received and queued for AI triage."
        })
        
        for h in histories:
            history_list.append({
                "status": h.new_status,
                "timestamp": str(h.updated_at),
                "notes": h.notes or f"Status updated to {h.new_status}"
            })

        calc_threat = "CRITICAL" if case_record.risk_score >= 0.8 else "HIGH" if case_record.risk_score >= 0.6 else "MEDIUM" if case_record.risk_score >= 0.4 else "LOW"
        
        return TrackCaseResponse(
            case_id=case_record.case_id,
            status=case_record.status,
            evidence_type=case_record.evidence_type,
            category=case_record.category,
            last_updated=str(case_record.last_updated),
            threat_level=calc_threat,
            blockchain_tx=case_record.blockchain_tx,
            ipfs_cid=case_record.ipfs_cid,
            history=history_list,
        )
    finally:
        db.close()


# ── NEW: Plain Submit (no encryption) ────────────────────────────────────────
@app.post("/api/v1/submit-plain", response_model=SubmitReportResponse)
async def submit_plain(payload: PlainSubmitRequest):
    """
    New simplified endpoint:
    1. Accepts { description, image (base64), url } — no encryption required
    2. Uploads image to Pinata IPFS (if provided)
    3. Uploads metadata JSON to Pinata IPFS
    4. Runs AI analysis on the combined content
    5. Saves to DB
    6. Anchors on Sepolia blockchain
    """
    try:
        # Decrypt if hybrid crypto is used
        if payload.encrypted_payload and payload.encrypted_aes_key:
            try:
                from services.privacy_service import PrivacyService
                clean_payload_bytes = PrivacyService.decrypt_and_verify(
                    encrypted_payload=payload.encrypted_payload,
                    encrypted_aes_key=payload.encrypted_aes_key,
                    original_hash=payload.original_hash,
                    aes_iv=payload.aes_iv,
                    aes_tag=payload.aes_tag
                )
                import json
                decrypted_data = json.loads(clean_payload_bytes.decode('utf-8'))
                
                # Override the plain fields with the decrypted JSON securely extracted
                payload.description = decrypted_data.get("description")
                payload.image = decrypted_data.get("image")
                payload.url = decrypted_data.get("url")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Hybrid decryption failed: {str(e)}")

        image_bytes = None
        if payload.image:
            image_bytes = base64.b64decode(payload.image)

        # ── Step 1: Preliminary evidence typing and AI Analysis ───────────
        description_text = payload.description or ""
        
        if payload.url:
            if description_text:
                description_text += f"\nURL : {payload.url}"
            else:
                description_text = payload.url

        has_text = bool(description_text.strip())
        has_image = bool(image_bytes)

        if has_text and has_image:
            evidence_type = "mixed"
            ai_content = image_bytes
        elif has_image:
            evidence_type = "image"
            ai_content = image_bytes
        elif has_text:
            evidence_type = "text"
            ai_content = description_text.encode()
        else:
            evidence_type = "text"
            ai_content = b"no content"

        try:
            analysis_results = await AIAnalysisService.analyze_evidence(
                evidence_type=evidence_type,
                content=ai_content,
                description=description_text,
            )
        except Exception as ai_err:
            raise HTTPException(status_code=500, detail=f"AI Analysis Failed: {str(ai_err)}")

        # ── Step 2: Upload to Pinata (only after AI success) ──────────────
        image_ipfs_cid = None
        if image_bytes:
            image_ipfs_cid = upload_image_bytes(image_bytes, filename="evidence.jpg")

        metadata = {
            "description": payload.description or "",
            "url": payload.url or "",
            "image_cid": image_ipfs_cid or "",
        }
        metadata_cid = upload_json(metadata, name="report_metadata")

        # ── Step 3: Compute evidence hash ─────────────────────────────────
        content_str = json.dumps(metadata, sort_keys=True)
        evidence_hash = hashlib.sha256(content_str.encode()).hexdigest()

        # ── Step 4: Save to DB ────────────────────────────────────────────
        from services.report_service import ReportService
        case_id, case_key = ReportService.create_report(
            evidence_type=evidence_type,
            analysis_results=analysis_results,
            ipfs_cid=metadata_cid,
            evidence_hash=evidence_hash,
            blockchain_tx="pending",
        )

        # ── Step 5: Anchor on Blockchain ──────────────────────────────────
        try:
            blockchain_tx = anchor_report_on_chain(
                case_id=case_id,
                ipfs_cid=metadata_cid,
                risk_score=analysis_results["risk_score"],
                evidence_hash=evidence_hash,
                category=analysis_results["category"],
            )
            # Update DB with real tx hash
            db = SessionLocal()
            try:
                record = db.query(Case).filter(Case.case_id == case_id).first()
                if record:
                    record.blockchain_tx = blockchain_tx
                    db.commit()
            finally:
                db.close()
        except Exception as chain_err:
            blockchain_tx = f"chain_error:{str(chain_err)[:60]}"

        return SubmitReportResponse(
            case_id=case_id,
            case_key=case_key,
            blockchain_tx=blockchain_tx,
            ipfs_cid=metadata_cid,
            risk_score=analysis_results["risk_score"],
            threat_level=analysis_results["threat_level"],
            category=analysis_results["category"],
            message="Report analyzed, saved to IPFS, and anchored! Keep your case key safe."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")
