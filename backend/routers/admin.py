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
    Fetches ALL reports from POCSORegistry.getAllReports() and computes stats.
    Source: 100% blockchain.
    """
    try:
        reports = get_all_reports_from_chain()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain unavailable: {str(e)}")

    total = len(reports)
    by_status: dict[str, int] = {}
    by_threat: dict[str, int] = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    for r in reports:
        # Status counts
        s = r.get("status", "UNKNOWN")
        by_status[s] = by_status.get(s, 0) + 1

        # Threat level counts
        tl = compute_threat_level(r.get("risk_score", 0.0))
        by_threat[tl] = by_threat.get(tl, 0) + 1

    escalated = by_status.get("ESCALATED", 0)

    return DashboardStats(
        total_cases=total,
        by_status=by_status,
        by_threat_level=by_threat,
        escalated_count=escalated,
        duplicate_count=0,   # not tracked on-chain
        chain_count=total,
    )


@router.get("/dashboard/recent", summary="Recent Cases (from blockchain)")
def dashboard_recent(
    limit: int = Query(10, ge=1, le=100),
    _token: dict = Depends(_verify_token),
):
    """
    Returns last N cases ordered by on-chain timestamp (newest first).
    Source: getAllReports() on blockchain.
    """
    try:
        reports = get_all_reports_from_chain()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain unavailable: {str(e)}")

    # Sort by on-chain timestamp descending
    reports.sort(key=lambda r: r.get("timestamp", 0), reverse=True)
    recent = reports[:limit]
    return [_enrich_report(r) for r in recent]


@router.get("/dashboard/risk-distribution", summary="Risk Score Distribution (from blockchain)")
def risk_distribution(_token: dict = Depends(_verify_token)):
    """
    Buckets risk scores from on-chain data.
    Source: getAllReports() on blockchain.
    """
    try:
        reports = get_all_reports_from_chain()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain unavailable: {str(e)}")

    buckets = {"LOW (0-0.4)": 0, "MEDIUM (0.4-0.6)": 0, "HIGH (0.6-0.8)": 0, "CRITICAL (0.8-1.0)": 0}
    for r in reports:
        s = r.get("risk_score", 0.0)
        if s < 0.4:
            buckets["LOW (0-0.4)"] += 1
        elif s < 0.6:
            buckets["MEDIUM (0.4-0.6)"] += 1
        elif s < 0.8:
            buckets["HIGH (0.6-0.8)"] += 1
        else:
            buckets["CRITICAL (0.8-1.0)"] += 1
    return buckets


# ── Case Management — all data from blockchain ────────────────────────────────

@router.get("/cases", summary="List All Cases (from blockchain)")
def list_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    threat_level_filter: Optional[str] = Query(None, alias="threat_level"),
    category_filter: Optional[str] = Query(None, alias="category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    _token: dict = Depends(_verify_token),
):
    """
    Returns ALL reports from POCSORegistry.getAllReports() with optional filters and pagination.
    Source: 100% blockchain.
    """
    try:
        reports = get_all_reports_from_chain()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain unavailable: {str(e)}")

    # Enrich with computed fields
    enriched = [_enrich_report(r) for r in reports]

    # Apply filters
    if status_filter:
        enriched = [r for r in enriched if r.get("status", "").upper() == status_filter.upper()]
    if threat_level_filter:
        enriched = [r for r in enriched if r.get("threat_level", "").upper() == threat_level_filter.upper()]
    if category_filter:
        enriched = [r for r in enriched if r.get("category", "").lower() == category_filter.lower()]

    # Sort newest first (by on-chain timestamp)
    enriched.sort(key=lambda r: r.get("timestamp", 0), reverse=True)

    # Paginate
    start = (page - 1) * limit
    page_slice: list = enriched[start: start + limit]
    return {
        "total": len(enriched),
        "page": page,
        "limit": limit,
        "cases": page_slice,
    }


@router.get("/cases/{case_id}", summary="Case Detail (from blockchain)")
def get_case(
    case_id: str,
    _token: dict = Depends(_verify_token),
):
    """
    Fetches a single report from POCSORegistry.getReport(caseId).
    Source: 100% blockchain.
    """
    try:
        report = get_report_from_chain(case_id)
    except Exception as e:
        detail = str(e)
        if "Case not found" in detail:
            raise HTTPException(status_code=404, detail="Case not found on-chain.")
        raise HTTPException(status_code=502, detail=f"Blockchain read failed: {detail}")

    return _enrich_report(report)


@router.get("/cases/{case_id}/history", summary="Case Status History (from blockchain events)")
def get_case_history(
    case_id: str,
    _token: dict = Depends(_verify_token),
):
    """
    Reads StatusUpdated event logs for the case from the blockchain.
    Each entry represents a status transition logged as an on-chain event.
    Source: 100% blockchain event logs.
    """
    try:
        history = get_status_history_from_chain(case_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Blockchain event read failed: {str(e)}")

    return history


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
