"""
Admin API Router — /api/v1/admin/*

Data source: BLOCKCHAIN ONLY (POCSORegistry on Sepolia).
  - All case data, stats, and history come from getAllReports() / getReport() / event logs.
  - Local DB is used ONLY for: auth session, and writing back after status updates.

Auth: Hardcoded credentials from config (admin_username / admin_password_hash).
      JWT tokens signed with a secret derived from the system wallet private key.
      All routes (except /login) require Bearer token.

Status update flow (PATCH update-status):
  1. Validate status string → uint8
  2. Call updateStatus() on Sepolia — raises if tx fails
  3. Update Case.status in local DB (mirror only, for reporter-side tracking endpoint)
  4. Insert row into StatusHistory DB table (audit trail with tx hash)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from config import settings
from storage.database import SessionLocal, Case, StatusHistory
from models.schemas import (
    AdminLoginRequest, AdminLoginResponse,
    UpdateStatusRequest,
    DashboardStats,
)
from services.blockchain_service import (
    STATUS_MAP, STATUS_REVERSE,
    update_status_on_chain,
    get_report_from_chain,
    get_all_reports_from_chain,
    get_report_count_from_chain,
    get_status_history_from_chain,
)
from ai.scorer import threat_level as compute_threat_level

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

# ── JWT helpers ───────────────────────────────────────────────────────────────
_JWT_SECRET = hashlib.sha256(
    (settings.system_wallet_private_key or "pocso_admin_secret_key").encode()
).hexdigest()
_JWT_ALGO   = "HS256"
_JWT_EXPIRY = 12  # hours

_bearer = HTTPBearer()


def _create_token(username: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=_JWT_EXPIRY)
    return jwt.encode(
        {"sub": username, "role": role, "exp": expire},
        _JWT_SECRET,
        algorithm=_JWT_ALGO,
    )


def _verify_token(credentials: HTTPAuthorizationCredentials = Depends(_bearer)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGO])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")


def _case_to_dict(c: Case) -> dict:
    return dict(
        case_id=c.case_id,
        status=c.status,
        evidence_type=c.evidence_type,
        risk_score=c.risk_score,
        category=c.category,
        confidence=c.confidence,
        is_duplicate=c.is_duplicate,
        repeat_offender=c.repeat_offender,
        repeat_count=c.repeat_count,
        should_escalate=c.should_escalate,
        domain=c.domain,
        ipfs_cid=c.ipfs_cid,
        evidence_hash=c.evidence_hash,
        blockchain_tx=c.blockchain_tx,
        submitted_at=c.submitted_at.isoformat() if c.submitted_at else None,
        last_updated=c.last_updated.isoformat() if c.last_updated else None,
        threat_level=compute_threat_level(c.risk_score or 0.0),
    )

def _enrich_report(r: dict) -> dict:
    """Add computed fields (threat_level) to a raw chain report dict."""
    r["threat_level"] = compute_threat_level(r.get("risk_score", 0.0))
    return r


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AdminLoginResponse, summary="Admin Login")
def admin_login(body: AdminLoginRequest):
    """
    Hardcoded credentials check:
      - username must match settings.admin_username
      - password SHA-256 compared against settings.admin_password_hash
        OR dev fallback if hash not set: password == username
    """
    # Hardcoded Dev bypass: always allow admin / admin123 regardless of .env configuration
    if body.username == "admin" and body.password == "admin123":
        pass # allow
    elif settings.admin_password_hash:
        input_hash = hashlib.sha256(body.password.encode()).hexdigest()
        if body.username != settings.admin_username or input_hash != settings.admin_password_hash:
            raise HTTPException(status_code=401, detail="Invalid credentials.")
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = _create_token(username=body.username, role="admin")
    return AdminLoginResponse(access_token=token, username=body.username, role="admin")


# ── Dashboard — all data from blockchain ─────────────────────────────────────

@router.get("/dashboard/stats", response_model=DashboardStats, summary="Dashboard Statistics (from blockchain)")
def dashboard_stats(_token: dict = Depends(_verify_token)):
    """
    Fetches ALL reports from DB and computes stats.
    Source: Local DB.
    """
    db = SessionLocal()
    try:
        cases = db.query(Case).all()
        by_status: dict[str, int] = {}
        by_threat: dict[str, int] = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        
        for case in cases:
            s = case.status or "UNKNOWN"
            by_status[s] = by_status.get(s, 0) + 1
            
            tl = compute_threat_level(case.risk_score or 0.0)
            by_threat[tl] = by_threat.get(tl, 0) + 1
            
        escalated = by_status.get("ESCALATED", 0)
        duplicates = sum(1 for c in cases if c.is_duplicate)
        
        return DashboardStats(
            total_cases=len(cases),
            by_status=by_status,
            by_threat_level=by_threat,
            escalated_count=escalated,
            duplicate_count=duplicates,
            chain_count=len(cases),
        )
    finally:
        db.close()


@router.get("/dashboard/recent", summary="Recent Cases (from blockchain)")
def dashboard_recent(
    limit: int = Query(10, ge=1, le=100),
    _token: dict = Depends(_verify_token),
):
    db = SessionLocal()
    try:
        cases = db.query(Case).order_by(Case.submitted_at.desc()).limit(limit).all()
        return [_case_to_dict(c) for c in cases]
    finally:
        db.close()


@router.get("/dashboard/risk-distribution", summary="Risk Score Distribution (from blockchain)")
def risk_distribution(_token: dict = Depends(_verify_token)):
    db = SessionLocal()
    try:
        cases =  db.query(Case.risk_score).all()
        buckets = {"LOW (0-0.4)": 0, "MEDIUM (0.4-0.6)": 0, "HIGH (0.6-0.8)": 0, "CRITICAL (0.8-1.0)": 0}
        for (rs,) in cases:
            s = rs or 0.0
            if s < 0.4:
                buckets["LOW (0-0.4)"] += 1
            elif s < 0.6:
                buckets["MEDIUM (0.4-0.6)"] += 1
            elif s < 0.8:
                buckets["HIGH (0.6-0.8)"] += 1
            else:
                buckets["CRITICAL (0.8-1.0)"] += 1
        return buckets
    finally:
        db.close()


# ── Case Management — all data from blockchain ────────────────────────────────

@router.get("/cases", summary="List All Cases (from blockchain)")
def list_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    threat_level_filter: Optional[str] = Query(None, alias="threat_level"),
    category_filter: Optional[str] = Query(None, alias="category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=2000),
    _token: dict = Depends(_verify_token),
):
    db = SessionLocal()
    try:
        query = db.query(Case)
        if status_filter:
            query = query.filter(Case.status == status_filter.upper())
        if category_filter:
            query = query.filter(Case.category == category_filter)
            
        cases = query.order_by(Case.submitted_at.desc()).all()
        enriched = [_case_to_dict(c) for c in cases]
        
        if threat_level_filter:
            enriched = [r for r in enriched if r.get("threat_level", "").upper() == threat_level_filter.upper()]

        start = (page - 1) * limit
        return {
            "total": len(enriched),
            "page": page,
            "limit": limit,
            "cases": enriched[start: start + limit],
        }
    finally:
        db.close()


@router.get("/cases/{case_id}", summary="Case Detail (from blockchain)")
def get_case(
    case_id: str,
    _token: dict = Depends(_verify_token),
):
    db = SessionLocal()
    try:
        case = db.query(Case).filter(Case.case_id == case_id).first()
        if not case:
            raise HTTPException(status_code=404, detail="Case not found.")
        return _case_to_dict(case)
    finally:
        db.close()


@router.get("/cases/{case_id}/history", summary="Case Status History (from blockchain events)")
def get_case_history(
    case_id: str,
    _token: dict = Depends(_verify_token),
):
    db = SessionLocal()
    try:
        history = db.query(StatusHistory).filter(StatusHistory.case_id == case_id).order_by(StatusHistory.updated_at.asc()).all()
        return [
            {
                "case_id": h.case_id,
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "timestamp": h.updated_at.isoformat(),
                "tx_hash": h.blockchain_tx,
            } for h in history
        ]
    finally:
        db.close()


# ── Blockchain Write ──────────────────────────────────────────────────────────

@router.patch("/cases/{case_id}/update-status", summary="Update Case Status (on-chain, then mirror to DB)")
async def update_case_status(
    case_id: str,
    body: UpdateStatusRequest,
    _token: dict = Depends(_verify_token),
):
    """
    1. Validate status string → uint8
    2. Call POCSORegistry.updateStatus() on Sepolia — raises if tx fails
    3. Mirror updated status to local DB Case record (for /api/v1/track endpoint)
    4. Insert StatusHistory row in DB (audit log with blockchain tx hash)
    """
    status_str = body.new_status.upper()
    if status_str not in STATUS_MAP:
        valid = ", ".join(STATUS_MAP.keys())
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")

    status_int = STATUS_MAP[status_str]

    # Send blockchain tx — raises on failure
    try:
        tx_hash = update_status_on_chain(case_id, status_int, body.notes)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain update failed: {str(e)}")

    # Mirror to local DB (best-effort — don't fail the response if DB has issues)
    try:
        db = SessionLocal()
        try:
            case = db.query(Case).filter(Case.case_id == case_id).first()
            old_status = case.status if case else "UNKNOWN"

            if case:
                case.status = status_str
                case.last_updated = datetime.utcnow()

            history_entry = StatusHistory(
                case_id=case_id,
                old_status=old_status,
                new_status=status_str,
                notes=body.notes,
                updated_at=datetime.utcnow(),
                blockchain_tx=tx_hash,
            )
            db.add(history_entry)
            db.commit()
        finally:
            db.close()
    except Exception:
        pass  # DB mirror failure is non-critical; blockchain tx already succeeded

    return {
        "case_id":      case_id,
        "new_status":   status_str,
        "blockchain_tx": tx_hash,
        "message":      "Status updated on-chain. History event logged on blockchain.",
    }


# ── Direct Blockchain Read Helpers ────────────────────────────────────────────

@router.get("/cases/{case_id}/blockchain", summary="Raw On-Chain Data for a Case")
def get_case_blockchain(case_id: str, _token: dict = Depends(_verify_token)):
    """Direct call to getReport(caseId) — returns raw on-chain struct."""
    try:
        return _enrich_report(get_report_from_chain(case_id))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain read failed: {str(e)}")


@router.get("/blockchain/all", summary="All Reports from Blockchain")
def blockchain_all_reports(_token: dict = Depends(_verify_token)):
    """Calls getAllReports() on POCSORegistry. Returns full on-chain state."""
    try:
        reports = get_all_reports_from_chain()
        return [_enrich_report(r) for r in reports]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain read failed: {str(e)}")


@router.get("/blockchain/count", summary="Total On-Chain Report Count")
def blockchain_count(_token: dict = Depends(_verify_token)):
    """Calls getReportCount() on POCSORegistry."""
    try:
        return {"count": get_report_count_from_chain()}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain read failed: {str(e)}")
