/**
 * Admin API — connects to the FastAPI backend.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1'

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms))

// ── Mock data for other functions (to be replaced in Phase 3) ───────────────
const MOCK_CASES = [
  { case_id: 'POCSO-7F4A2X', status: 'UNDER_REVIEW', threat_level: 'HIGH',     risk_score: 0.74, category: 'harassment',  evidence_type: 'image',      submitted_at: new Date(Date.now() - 3*3600*1000).toISOString(), domain: null,            repeat_offender: false, should_escalate: false, is_duplicate: false },
  { case_id: 'POCSO-3C9K8M', status: 'VERIFIED',     threat_level: 'CRITICAL',  risk_score: 0.93, category: 'CSAM',        evidence_type: 'url',        submitted_at: new Date(Date.now() - 24*3600*1000).toISOString(), domain: 'harmful-site.xyz', repeat_offender: true,  should_escalate: true,  is_duplicate: false },
  { case_id: 'POCSO-K2P9QR', status: 'RECEIVED',     threat_level: 'CRITICAL',  risk_score: 0.89, category: 'trafficking', evidence_type: 'text',       submitted_at: new Date(Date.now() - 1*3600*1000).toISOString(), domain: null,            repeat_offender: false, should_escalate: true,  is_duplicate: false },
  { case_id: 'POCSO-MN3X5Y', status: 'RECEIVED',     threat_level: 'HIGH',      risk_score: 0.67, category: 'harassment',  evidence_type: 'screenshot', submitted_at: new Date(Date.now() - 30*60*1000).toISOString(),  domain: null,            repeat_offender: false, should_escalate: false, is_duplicate: false },
  { case_id: 'POCSO-BW1LZ8', status: 'ESCALATED',    threat_level: 'CRITICAL',  risk_score: 0.95, category: 'CSAM',        evidence_type: 'image',      submitted_at: new Date(Date.now() - 48*3600*1000).toISOString(), domain: null,            repeat_offender: false, should_escalate: true,  is_duplicate: true  },
  { case_id: 'POCSO-QT6HF4', status: 'ACTION_TAKEN', threat_level: 'HIGH',      risk_score: 0.71, category: 'hate_speech', evidence_type: 'url',        submitted_at: new Date(Date.now() - 72*3600*1000).toISOString(), domain: 'badsite.net',   repeat_offender: true,  should_escalate: false, is_duplicate: false },
  { case_id: 'POCSO-VC8JD2', status: 'CLOSED',       threat_level: 'LOW',       risk_score: 0.32, category: 'other',       evidence_type: 'text',       submitted_at: new Date(Date.now() - 96*3600*1000).toISOString(), domain: null,            repeat_offender: false, should_escalate: false, is_duplicate: false },
  { case_id: 'POCSO-RX4SP1', status: 'RECEIVED',     threat_level: 'MEDIUM',    risk_score: 0.55, category: 'harassment',  evidence_type: 'image',      submitted_at: new Date(Date.now() - 15*60*1000).toISOString(),  domain: null,            repeat_offender: false, should_escalate: false, is_duplicate: false },
]

const MOCK_AUDIT = [
  { id: 1, event: 'StatusUpdated', case_id: 'POCSO-3C9K8M', old_status: 'UNDER_REVIEW', new_status: 'VERIFIED',     admin: 'admin', tx: '0xa1b2c3d4e5f6...', timestamp: new Date(Date.now() - 2*3600*1000).toISOString(),  notes: 'Confirmed as legitimate CSAM content.' },
  { id: 2, event: 'ReportSubmitted', case_id: 'POCSO-K2P9QR', old_status: null,          new_status: 'RECEIVED',     admin: 'system', tx: '0xdeadbeef1234...', timestamp: new Date(Date.now() - 1*3600*1000).toISOString(), notes: 'New report submitted via portal.' },
  { id: 3, event: 'StatusUpdated', case_id: 'POCSO-BW1LZ8', old_status: 'VERIFIED',     new_status: 'ESCALATED',    admin: 'admin', tx: '0xcafe9876abcd...', timestamp: new Date(Date.now() - 4*3600*1000).toISOString(),  notes: 'Escalated to CBI cybercrime unit.' },
  { id: 4, event: 'StatusUpdated', case_id: 'POCSO-QT6HF4', old_status: 'ESCALATED',    new_status: 'ACTION_TAKEN', admin: 'admin', tx: '0xf00dface5678...', timestamp: new Date(Date.now() - 12*3600*1000).toISOString(), notes: 'ISP notified. Takedown initiated.' },
  { id: 5, event: 'ReportSubmitted', case_id: 'POCSO-MN3X5Y', old_status: null,          new_status: 'RECEIVED',     admin: 'system', tx: '0xbabe0001abcd...', timestamp: new Date(Date.now() - 30*60*1000).toISOString(), notes: 'New report submitted via portal.' },
]

const MOCK_DOMAINS = [
  { domain: 'harmful-site.xyz', count: 7, last_seen: new Date(Date.now() - 24*3600*1000).toISOString(), categories: ['CSAM', 'trafficking'], status: 'UNDER_REVIEW' },
  { domain: 'badsite.net',      count: 4, last_seen: new Date(Date.now() - 72*3600*1000).toISOString(), categories: ['hate_speech'],         status: 'ACTION_TAKEN' },
  { domain: 'abuse-forum.io',   count: 3, last_seen: new Date(Date.now() - 5*3600*1000).toISOString(),  categories: ['harassment', 'CSAM'],  status: 'RECEIVED' },
]

let cases = [...MOCK_CASES]

// ── Auth ─────────────────────────────────────────────────────────────────────
export async function adminLogin(username, password) {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Access Denied: Invalid credentials.')
  }

  const data = await response.json()
  // Normalizing for frontend: data = { access_token, role, token_type }
  return { 
    token: data.access_token, 
    role: data.role, 
    username: username, 
    department: 'Cyber Crime Cell' 
  }
}

const getAuthHeader = () => {
    const user = JSON.parse(sessionStorage.getItem('admin_user'));
    return user?.token ? { 'Authorization': `Bearer ${user.token}` } : {};
};

// ── Cases ────────────────────────────────────────────────────────────────────
export async function getCases(filters = {}) {
  const query = new URLSearchParams()
  if (filters.priority) query.append('priority', filters.priority)
  if (filters.status) query.append('status', filters.status)

  const response = await fetch(`${API_BASE_URL}/admin/cases?${query.toString()}`, {
    headers: getAuthHeader()
  })

  if (!response.ok) throw new Error('Failed to fetch cases.')
  return await response.json()
}

export async function getCaseDetail(caseId) {
  const response = await fetch(`${API_BASE_URL}/admin/case/${caseId}`, {
    headers: getAuthHeader()
  })

  if (!response.ok) throw new Error('Case detail not found.')
  const data = await response.json()
  
  // Normalize response
  return {
    ...data.case,
    history: data.history
  }
}

export async function updateCaseStatus(caseId, newStatus, notes) {
  const response = await fetch(`${API_BASE_URL}/admin/case/${caseId}/status`, {
    method: 'POST',
    headers: { 
        ...getAuthHeader(),
        'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ status: newStatus, notes }),
  })

  if (!response.ok) throw new Error('Failed to update case status.')
  const data = await response.json()
  return { 
    case_id: caseId, 
    status: newStatus, 
    tx: data.blockchain_tx 
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  // We can calculate stats from the full case list or create a dedicated endpoint
  // For simplicity, we'll fetch all cases and calculate
  const cases = await getCases()
  
  const total   = cases.length
  const critical = cases.filter(c => c.risk_score >= 0.8).length
  const pending  = cases.filter(c => c.status === 'RECEIVED' || c.status === 'UNDER_REVIEW').length
  const resolved = cases.filter(c => c.status === 'ACTION_TAKEN' || c.status === 'CLOSED').length
  const byStatus = {}
  cases.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1 })
  const byCategory = {}
  cases.forEach(c => { byCategory[c.category] = (byCategory[c.category] || 0) + 1 })
  
  return { total, critical, pending, resolved, byStatus, byCategory }
}

// ── Domains ───────────────────────────────────────────────────────────────────
export async function getRepeatOffenders() {
  const response = await fetch(`${API_BASE_URL}/admin/domains`, {
    headers: getAuthHeader()
  })

  if (!response.ok) throw new Error('Failed to fetch offender data.')
  return await response.json()
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export async function getAuditLog() {
  const response = await fetch(`${API_BASE_URL}/admin/audit`, {
    headers: getAuthHeader()
  })

  if (!response.ok) throw new Error('Failed to fetch blockchain audit log.')
  const data = await response.json()
  
  // Format blockchain timestamps (unix) to ISO for frontend
  return data.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp * 1000).toISOString()
  }))
}
