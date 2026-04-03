import json
from storage.database import SessionLocal, Case

def check_duplicate_url(domain: str) -> tuple[bool, int]:
    """
    Checks if a given domain has been reported before.
    Returns (is_duplicate: bool, repeat_count: int).
    """
    if not domain:
        return False, 0
    db = SessionLocal()
    try:
        count = db.query(Case).filter(Case.domain == domain).count()
        return (count > 0, count)
    finally:
        db.close()
