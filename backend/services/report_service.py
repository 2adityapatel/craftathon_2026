import uuid
import secrets
import hashlib
from storage.ipfs import IPFSStorage
from blockchain.relayer import BlockchainRelayer
from storage.database import SessionLocal, Case

class ReportService:
    @staticmethod
    def create_report(evidence_type: str, analysis_results: dict, 
                      encrypted_payload: bytes, evidence_hash: str) -> tuple[str, str, str, str]:
        """
        1. Uploads to IPFS
        2. Anchors to Blockchain
        3. Saves to DB
        Returns (case_id, case_key, ipfs_cid, tx_hash)
        """
        # Step 1: Upload encrypted payload to IPFS
        filename = f"evidence_{uuid.uuid4().hex[:8]}.bin"
        ipfs_cid = IPFSStorage.upload_to_ipfs(encrypted_payload, filename)

        # Step 2: Generate IDs
        short_hash = uuid.uuid4().hex[:6].upper()
        case_id = f"POCSO-{short_hash}"
        case_key = secrets.token_hex(16)
        case_key_hash = hashlib.sha256(case_key.encode()).hexdigest()

        # Step 3: Anchor to Blockchain
        relayer = BlockchainRelayer()
        blockchain_tx = relayer.submit_report_to_chain(
            case_id=case_id,
            ipfs_cid=ipfs_cid,
            risk_score=analysis_results.get("risk_score", 0.0),
            evidence_hash=evidence_hash,
            category=analysis_results.get("category", "unknown")
        )
        
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
            
            return case_id, case_key, ipfs_cid, blockchain_tx
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
