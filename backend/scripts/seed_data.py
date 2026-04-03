import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to sys.path so we can import from backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from storage.database import SessionLocal, Case, StatusHistory, Base, engine

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Case).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database with professional demo cases...")

        demo_cases = [
            {
                "case_id": "POCSO-7F4A2X",
                "case_key_hash": "hash_1",
                "status": "UNDER_REVIEW",
                "evidence_type": "image",
                "risk_score": 0.74,
                "category": "harassment",
                "confidence": 0.82,
                "domain": "socialmedia-leaks.com",
                "ipfs_cid": "QmX7k9NbYMpTaqCzv5R3GHnq1N2s3B4KLmParWxY8eUoF",
                "evidence_hash": "e_hash_1",
                "blockchain_tx": "0xa1b2c3d4e5f67890abcdef1234567890abcdef12",
                "submitted_at": datetime.utcnow() - timedelta(hours=3)
            },
            {
                "case_id": "POCSO-3C9K8M",
                "case_key_hash": "hash_2",
                "status": "VERIFIED",
                "evidence_type": "url",
                "risk_score": 0.93,
                "category": "CSAM",
                "confidence": 0.98,
                "domain": "harmful-site.xyz",
                "repeat_offender": True,
                "repeat_count": 4,
                "should_escalate": True,
                "ipfs_cid": "QmY8k9NbYMpTaqCzv5R3GHnq1N2s3B4KLmParWxY8eUoG",
                "evidence_hash": "e_hash_2",
                "blockchain_tx": "0xb2c3d4e5f67890abcdef1234567890abcdef123",
                "submitted_at": datetime.utcnow() - timedelta(days=1)
            },
            {
                "case_id": "POCSO-K2P9QR",
                "case_key_hash": "hash_3",
                "status": "RECEIVED",
                "evidence_type": "text",
                "risk_score": 0.89,
                "category": "trafficking",
                "confidence": 0.91,
                "should_escalate": True,
                "domain": "shady-forum.dark",
                "ipfs_cid": "QmZ9k9NbYMpTaqCzv5R3GHnq1N2s3B4KLmParWxY8eUoH",
                "evidence_hash": "e_hash_3",
                "blockchain_tx": "0xc3d4e5f67890abcdef1234567890abcdef12345",
                "submitted_at": datetime.utcnow() - timedelta(minutes=45)
            }
        ]

        for c_data in demo_cases:
            case = Case(**c_data)
            db.add(case)
            
            # Add initial history
            history = StatusHistory(
                case_id=c_data["case_id"],
                old_status=None,
                new_status="RECEIVED",
                notes="AI analysis complete. High risk detected.",
                blockchain_tx=c_data["blockchain_tx"],
                updated_at=c_data["submitted_at"]
            )
            db.add(history)
            
            if c_data["status"] != "RECEIVED":
                update_history = StatusHistory(
                    case_id=c_data["case_id"],
                    old_status="RECEIVED",
                    new_status=c_data["status"],
                    notes="Updated by Authority for further investigation.",
                    blockchain_tx=f"update_{c_data['blockchain_tx']}",
                    updated_at=c_data["submitted_at"] + timedelta(minutes=20)
                )
                db.add(update_history)

        db.commit()
        print("Seeding complete! 🚀")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
