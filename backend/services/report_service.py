import uuid
import secrets
import hashlib
from datetime import datetime
from storage.database import SessionLocal, Case

class ReportService:
    @staticmethod
    def create_report(evidence_type: str, analysis_results: dict, 
                      ipfs_cid: str, evidence_hash: str, blockchain_tx: str) -> tuple[str, str]:
        """
        Generates IDs and stores the case metadata in the local database.
        Returns (case_id, case_key)
        """
        # Generate custom short case ID: POCSO-XXXXXX
        short_hash = uuid.uuid4().hex[:6].upper()
        case_id = f"POCSO-{short_hash}"
        
        # Generate Case Key for anonymous tracking
        case_key = secrets.token_hex(16)
        case_key_hash = hashlib.sha256(case_key.encode()).hexdigest()
        
        db = SessionLocal()
        try:
            new_case = Case(
                case_id=case_id,
                case_key_hash=case_key_hash,
                status="RECEIVED",
                evidence_type=evidence_type,
                risk_score=analysis_results.get("risk_score", 0.0),
                category=analysis_results.get("category", "unknown"),
                confidence=analysis_results.get("confidence", 0.0),
                is_duplicate=analysis_results.get("is_duplicate", False),
                repeat_offender=analysis_results.get("repeat_offender", False),
                repeat_count=analysis_results.get("repeat_count", 0),
                should_escalate=analysis_results.get("should_escalate", False),
                domain=analysis_results.get("domain"),
                ipfs_cid=ipfs_cid,
                evidence_hash=evidence_hash,
                blockchain_tx=blockchain_tx
            )
            
            db.add(new_case)
            db.commit()
            
            return case_id, case_key
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
