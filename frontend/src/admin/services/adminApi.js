/**
 * adminApi.js — Real API integration for the Admin Panel.
 * All data comes from the FastAPI backend which reads exclusively from blockchain.
 *
 * Base URL: http://localhost:8000
 * Auth: JWT Bearer token stored in sessionStorage as admin_user.token
 */

const BASE_URL = 'http://localhost:8000'

// ── Auth token helper ─────────────────────────────────────────────────────────
function getToken() {
  try {
    const stored = sessionStorage.getItem('admin_user')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed.access_token || parsed.token || null
  } catch {
    return null
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    // Clear stale session and force re-login
    sessionStorage.removeItem('admin_user')
    window.location.href = '/admin/login'
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Server error: ${res.status}`)
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/login
 * Returns { access_token, token_type, username, role }
 */
export async function adminLogin(username, password) {
  const data = await apiRequest('/api/v1/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  // Normalize to what AuthContext expects: must have a "token" field for getToken()
  return {
    ...data,
    token: data.access_token,   // alias so getToken() works
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/dashboard/stats
 * Returns { total_cases, by_status, by_threat_level, escalated_count, chain_count, ... }
 * Normalized to the shape AdminDashboard.jsx expects:
 *   { total, critical, pending, resolved, byStatus, byCategory }
 */
export async function getDashboardStats() {
  const data = await apiRequest('/api/v1/admin/dashboard/stats')

  const byStatus = data.by_status || {}
  const byThreat = data.by_threat_level || {}

  return {
    total:    data.total_cases,
    critical: byThreat['CRITICAL'] || 0,
    pending:  (byStatus['RECEIVED'] || 0) + (byStatus['UNDER_REVIEW'] || 0),
    resolved: (byStatus['ACTION_TAKEN'] || 0) + (byStatus['CLOSED'] || 0),
    byStatus,
    byCategory: data.by_category || {},  // not returned by backend yet — safe default
    escalated: data.escalated_count,
    chainCount: data.chain_count,
  }
}

/**
 * GET /api/v1/admin/dashboard/recent?limit=N
 * Returns array of chain reports (newest first)
 */
export async function getRecentCases(limit = 10) {
  return apiRequest(`/api/v1/admin/dashboard/recent?limit=${limit}`)
}

/**
 * GET /api/v1/admin/dashboard/risk-distribution
 */
export async function getRiskDistribution() {
  return apiRequest('/api/v1/admin/dashboard/risk-distribution')
}

// ── Cases ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/cases
 * Supports filters: status, threat_level, category, page, limit
 * Returns { total, page, limit, cases: [...] }
 *
 * Also accepts legacy { priority: 'critical' } filter (used by AdminCases.jsx)
 */
export async function getCases(filters = {}) {
  const params = new URLSearchParams()

  if (filters.priority === 'critical') {
    params.set('threat_level', 'CRITICAL')
  } else {
    if (filters.status)       params.set('status', filters.status)
    if (filters.threat_level) params.set('threat_level', filters.threat_level)
    if (filters.category)     params.set('category', filters.category)
  }

  if (filters.page)  params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))

  const data = await apiRequest(`/api/v1/admin/cases?${params.toString()}`)
  // Return flat array for backward-compat with pages that do cases.map(...)
  return data.cases || data
}

/**
 * GET /api/v1/admin/cases/{id}
 * Returns single case detail (from blockchain getReport)
 */
export async function getCaseDetail(caseId) {
  const data = await apiRequest(`/api/v1/admin/cases/${caseId}`)
  // Fetch status history separately and attach
  let history = []
  try {
    history = await getCaseHistory(caseId)
  } catch {
    // History is best-effort — don't break the case detail page
  }
  return { ...data, history }
}

/**
 * GET /api/v1/admin/cases/{id}/history
 * Returns array of StatusUpdated events from chain
 */
export async function getCaseHistory(caseId) {
  const events = await apiRequest(`/api/v1/admin/cases/${caseId}/history`)
  // Normalize chain events to the shape AdminCaseDetail.jsx history items expect
  return events.map((e, i) => ({
    status:    e.new_status,
    timestamp: e.timestamp ? new Date(e.timestamp * 1000).toISOString() : null,
    notes:     e.notes || '',
    admin:     'authority',   // chain doesn't store who — could be enriched later
    tx:        e.tx_hash,
    block:     e.block_number,
  }))
}

/**
 * PATCH /api/v1/admin/cases/{id}/update-status
 * Body: { new_status: string, notes: string }
 * Returns { case_id, new_status, blockchain_tx, message }
 */
export async function updateCaseStatus(caseId, newStatus, notes) {
  const data = await apiRequest(`/api/v1/admin/cases/${caseId}/update-status`, {
    method: 'PATCH',
    body: JSON.stringify({ new_status: newStatus, notes: notes || '' }),
  })
  // Normalize tx field name for AdminCaseDetail success message
  return { ...data, tx: data.blockchain_tx }
}

// ── Blockchain raw reads ──────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/cases/{id}/blockchain
 * Live chain data for a single case
 */
export async function getCaseBlockchain(caseId) {
  return apiRequest(`/api/v1/admin/cases/${caseId}/blockchain`)
}

/**
 * GET /api/v1/admin/blockchain/all
 */
export async function getAllBlockchainReports() {
  return apiRequest('/api/v1/admin/blockchain/all')
}

/**
 * GET /api/v1/admin/blockchain/count
 */
export async function getBlockchainCount() {
  return apiRequest('/api/v1/admin/blockchain/count')
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

/**
 * Fetches ALL on-chain reports and derives an audit-log-style list:
 * - ReportSubmitted events (inferred from chain reports timestamp)
 * - StatusUpdated events from each case's history
 *
 * This powers AdminAudit.jsx which shows an immutable blockchain event feed.
 */
export async function getAuditLog() {
  // Get all reports from the DB for "ReportSubmitted" entries
  const response = await apiRequest('/api/v1/admin/cases?limit=1000')
  const reports = response.cases || response

  const auditEntries = []
  let idCounter = 1

  for (const r of reports) {
    // ReportSubmitted entry
    auditEntries.push({
      id:         idCounter++,
      event:      'ReportSubmitted',
      case_id:    r.case_id,
      old_status: null,
      new_status: 'RECEIVED',
      admin:      'system',
      tx:         r.blockchain_tx || '—',
      notes:      `Category: ${r.category} | Risk: ${Math.round((r.risk_score || 0) * 100)}%`,
      timestamp:  r.submitted_at ? new Date(r.submitted_at).toISOString() : new Date().toISOString(),
    })
  }

  // Fetch history events for all cases
  const historyResults = await Promise.allSettled(
    reports.map(r =>
      apiRequest(`/api/v1/admin/cases/${r.case_id}/history`).then(evs =>
        evs.map(e => ({
          id:         idCounter++,
          event:      'StatusUpdated',
          case_id:    r.case_id,
          old_status: e.old_status,
          new_status: e.new_status,
          admin:      'authority',
          tx:         e.tx_hash,
          notes:      e.notes || '',
          timestamp:  e.timestamp ? new Date(e.timestamp).toISOString() : new Date().toISOString(),
        }))
      )
    )
  )

  for (const result of historyResults) {
    if (result.status === 'fulfilled') {
      auditEntries.push(...result.value)
    }
  }

  // Sort newest first
  return auditEntries.sort((a, b) => {
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return new Date(b.timestamp) - new Date(a.timestamp)
  })
}

// ── Domains / Repeat Offenders ────────────────────────────────────────────────

/**
 * Derives domain/repeat-offender data from the blockchain report list.
 * AdminDomains.jsx uses this.
 */
export async function getRepeatOffenders() {
  const reports = await apiRequest('/api/v1/admin/blockchain/all')

  const domainMap = {}
  for (const r of reports) {
    // Extract domain from notes or ipfs_cid field (best-effort — chain doesn't store domain natively)
    // For now derive from category + case count per category as a proxy
    const key = r.category || 'unknown'
    if (!domainMap[key]) {
      domainMap[key] = { domain: key, count: 0, last_seen: null, categories: [key], status: r.status }
    }
    domainMap[key].count++
    const ts = r.timestamp ? new Date(r.timestamp * 1000).toISOString() : null
    if (!domainMap[key].last_seen || ts > domainMap[key].last_seen) {
      domainMap[key].last_seen = ts
    }
  }

  return Object.values(domainMap).sort((a, b) => b.count - a.count)
}
