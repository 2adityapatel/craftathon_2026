/**
 * Mock API service — replace with real fetch calls when backend is ready.
 * All functions return Promises to simulate real async behaviour.
 */

const delay = (ms = 1200) => new Promise(res => setTimeout(res, ms))

// Simulated case database (in-memory, resets on reload)
const mockCases = {
  'POCSO-7F4A2X': {
    case_id: 'POCSO-7F4A2X',
    status: 'UNDER_REVIEW',
    threat_level: 'HIGH',
    risk_score: 0.74,
    category: 'harassment',
    evidence_type: 'image',
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    last_updated: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    blockchain_tx: '0xa1b2c3d4e5f67890abcdef1234567890abcdef12',
    ipfs_cid: 'QmX7k9NbYMpTaqCzv5R3GHnq1N2s3B4KLmParWxY8eUoF',
    history: [
      { status: 'RECEIVED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), notes: 'Report received and queued for review.' },
      { status: 'UNDER_REVIEW', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), notes: 'Assigned to authority team for review.' },
    ],
  },
  'POCSO-3C9K8M': {
    case_id: 'POCSO-3C9K8M',
    status: 'VERIFIED',
    threat_level: 'CRITICAL',
    risk_score: 0.91,
    category: 'CSAM',
    evidence_type: 'url',
    submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    last_updated: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    blockchain_tx: '0xdeadbeef1234567890abcdef1234567890abcdef',
    ipfs_cid: 'QmK3h8RePtAcNsVw2LdBgYqM7sNuFiRvXe5JcWoZpT6kL',
    history: [
      { status: 'RECEIVED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), notes: 'Report received.' },
      { status: 'UNDER_REVIEW', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), notes: 'Under review by senior authority.' },
      { status: 'VERIFIED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), notes: 'Verified as legitimate. Escalation initiated.' },
    ],
  },
}

/**
 * GET /api/v1/public-key
 */
export async function fetchPublicKey() {
  await delay(300)
  return {
    public_key: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
  }
}

/**
 * POST /api/v1/submit
 */
export async function submitReport(payload) {
  await delay(2000) // simulate processing time

  const caseId = 'POCSO-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  const caseKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const riskScore = Math.random() * 0.4 + 0.55
  const categories = ['harassment', 'CSAM', 'trafficking', 'hate_speech']
  const category = categories[Math.floor(Math.random() * categories.length)]

  const threatLevel =
    riskScore >= 0.8 ? 'CRITICAL' :
    riskScore >= 0.6 ? 'HIGH' :
    riskScore >= 0.4 ? 'MEDIUM' : 'LOW'

  return {
    case_id: caseId,
    case_key: caseKey,
    blockchain_tx: '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join(''),
    ipfs_cid: 'Qm' + Array.from(crypto.getRandomValues(new Uint8Array(22))).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 44),
    risk_score: Math.round(riskScore * 100) / 100,
    threat_level: threatLevel,
    category,
    message: 'Report submitted successfully. Save your case key to track status.',
  }
}

/**
 * GET /api/v1/track?case_id=...&case_key=...
 */
export async function trackCase(caseId, caseKey) {
  await delay(1000)

  // case_key validation (mock: any 32-char hex is valid for known cases)
  if (!caseKey || caseKey.length < 10) {
    throw new Error('Invalid case key. Please check and try again.')
  }

  const found = mockCases[caseId]
  if (!found) {
    // For newly submitted cases in this session (stored in localStorage)
    const stored = localStorage.getItem(`case_${caseId}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...parsed,
        history: [
          { status: 'RECEIVED', timestamp: parsed.submitted_at, notes: 'Report received and queued for AI triage.' },
        ],
      }
    }
    throw new Error('Case not found. Please check your Case ID and Case Key.')
  }

  return found
}
