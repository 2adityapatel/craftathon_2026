/**
 * Admin Mock API — replace fetch calls with real backend when ready.
 */

const delay = (ms = 800) => new Promise(r => setTimeout(r, ms))

// ── Mock data ────────────────────────────────────────────────────────────────
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
  await delay(900)
  if (username === 'admin' && password === 'admin123') {
    const token = 'mock_jwt_' + Date.now()
    return { token, role: 'authority', username: 'Admin Officer', department: 'Cyber Crime Cell' }
  }
  throw new Error('Invalid credentials. Please check your username and password.')
}

// ── Cases ────────────────────────────────────────────────────────────────────
export async function getCases(filters = {}) {
  await delay(600)
  let result = [...cases].sort((a, b) => b.risk_score - a.risk_score)
  if (filters.priority === 'critical') result = result.filter(c => c.risk_score >= 0.8 || c.should_escalate)
  if (filters.status) result = result.filter(c => c.status === filters.status)
  return result
}

export async function getCaseDetail(caseId) {
  await delay(500)
  const c = cases.find(c => c.case_id === caseId)
  if (!c) throw new Error('Case not found')
  return {
    ...c,
    blockchain_tx: '0xa1b2c3d4e5f67890abcdef1234567890abcdef12',
    ipfs_cid: 'QmX7k9NbYMpTaqCzv5R3GHnq1N2s3B4KLmParWxY8eUoF',
    confidence: 0.87,
    repeat_count: c.repeat_offender ? 4 : 0,
    history: [
      { status: 'RECEIVED',     timestamp: c.submitted_at,                                       notes: 'Report received. AI triage completed.',    admin: 'system' },
      ...(c.status !== 'RECEIVED' ? [{ status: 'UNDER_REVIEW', timestamp: new Date(new Date(c.submitted_at).getTime() + 30*60*1000).toISOString(), notes: 'Assigned to authority for review.', admin: 'admin' }] : []),
      ...(c.status === 'VERIFIED' || c.status === 'ESCALATED' || c.status === 'ACTION_TAKEN' || c.status === 'CLOSED'
        ? [{ status: c.status, timestamp: new Date(new Date(c.submitted_at).getTime() + 2*3600*1000).toISOString(), notes: 'Status updated by authority.', admin: 'admin' }] : []),
    ],
  }
}

export async function updateCaseStatus(caseId, newStatus, notes) {
  await delay(1200)
  const idx = cases.findIndex(c => c.case_id === caseId)
  if (idx === -1) throw new Error('Case not found')
  cases[idx] = { ...cases[idx], status: newStatus }
  return {
    case_id: caseId,
    status: newStatus,
    tx: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2,'0')).join(''),
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getDashboardStats() {
  await delay(500)
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
  await delay(500)
  return [...MOCK_DOMAINS].sort((a, b) => b.count - a.count)
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export async function getAuditLog() {
  await delay(600)
  return [...MOCK_AUDIT].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}
