from storage.database import SessionLocal, Case, StatusHistory
from blockchain.relayer import BlockchainRelayer
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import desc

class CaseManagementService:
    @staticmethod
    def get_all_cases(priority: str = None):
        """Fetches all cases from the DB, optionally filtering by priority."""
        db = SessionLocal()
        try:
            query = db.query(Case)
            if priority == "critical":
                query = query.filter((Case.risk_score >= 0.8) | (Case.should_escalate == True))
            
            # Sort by risk_score descending by default
            cases = query.order_by(desc(Case.risk_score)).all()
            return cases
        finally:
            db.close()

    @staticmethod
    def get_case_detail(case_id: str):
        """Fetches a single case and its history from the DB."""
        db = SessionLocal()
        try:
            case = db.query(Case).filter(Case.case_id == case_id).first()
            if not case:
                return None
            
            # Fetch history
            history = db.query(StatusHistory).filter(StatusHistory.case_id == case_id).order_by(desc(StatusHistory.updated_at)).all()
            
            return {
                "case": case,
                "history": history
            }
        finally:
            db.close()

    @staticmethod
    def update_case_status(case_id: str, new_status: str, notes: str, admin_user: str):
        """
        Updates the case status in the DB AND anchors the update to the Blockchain.
        """
        db = SessionLocal()
        try:
            case = db.query(Case).filter(Case.case_id == case_id).first()
            if not case:
                raise HTTPException(status_code=404, detail="Case not found")

            old_status = case.status
            case.status = new_status
            case.last_updated = datetime.now()

            # 1. Update on Blockchain via Relayer
            relayer = BlockchainRelayer()
            # We map the status string to the Enum index in Solidity (0-5)
            status_map = {
                "RECEIVED": 0,
                "UNDER_REVIEW": 1,
                "VERIFIED": 2,
                "ESCALATED": 3,
                "ACTION_TAKEN": 4,
                "CLOSED": 5
            }
            status_int = status_map.get(new_status, 1)

            # Relayer needs an update method. I'll add it if missing or use a mock if offline.
            try:
                tx_hash = relayer.update_status_on_chain(case_id, status_int, notes)
            except Exception as e:
                print(f"Blockchain Update Error: {e}")
                tx_hash = f"error_tx_{case_id}"

            # 2. Add to Status History
            history_entry = StatusHistory(
                case_id=case_id,
                old_status=old_status,
                new_status=new_status,
                notes=notes,
                blockchain_tx=tx_hash
            )
            db.add(history_entry)
            db.commit()

            return tx_hash
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
