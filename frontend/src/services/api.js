/**
 * API service — connects to FastAPI backend at localhost:8000
 * Mock functions are kept for the track endpoint until backend is wired up.
 */

const BASE_URL = 'http://localhost:8000'
const delay = (ms = 1200) => new Promise(res => setTimeout(res, ms))

async function encryptPayload(data) {
  // 1. Fetch public key
  const rsaRes = await fetch(`${BASE_URL}/api/v1/public-key`)
  const { public_key } = await rsaRes.json()
  
  // PEM to ArrayBuffer (strip headers)
  const pemContents = public_key.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, "")
  const binaryDerString = window.atob(pemContents)
  const binaryDer = new Uint8Array(binaryDerString.length)
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i)
  }
  
  const rsaKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    { name: "RSA-OAEP", hash: "SHA-1" },
    true,
    ["encrypt"]
  )
  
  // 2. Generate random AES-256-GCM key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
  
  // 3. Encrypt data payload
  const iv = window.crypto.getRandomValues(new Uint8Array(16))
  const encodedContent = new TextEncoder().encode(JSON.stringify(data))
  
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodedContent
  )
  
  // Separate WebCrypto ciphertext & tag (last 16 bytes for GCM)
  const cipherBytes = new Uint8Array(encryptedBuf)
  const cipherText = cipherBytes.slice(0, cipherBytes.length - 16)
  const tagBytes = cipherBytes.slice(cipherBytes.length - 16)
  
  // 4. Encrypt the AES key with RSA pub key
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey)
  const encAesBuf = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaKey,
    exportedAesKey
  )
  
  // 5. SHA-256 hash of original data
  const hashBuf = await window.crypto.subtle.digest("SHA-256", encodedContent)
  
  // Helper to convert array buffer to hex
  const toHex = buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return {
    encrypted_payload: toHex(cipherText),
    encrypted_aes_key: toHex(encAesBuf),
    original_hash: toHex(hashBuf),
    aes_iv: toHex(iv),
    aes_tag: toHex(tagBytes)
  }
}

/**
 * POST /api/v1/submit-plain
 * Submits utilizing End-to-End Hybrid Crypto wrapping the JSON payload.
 */
export async function submitReportPlain({ description, image, url }) {
  // Encrypt the payload before sending
  const encryptedData = await encryptPayload({ description, image, url })

  const response = await fetch(`${BASE_URL}/api/v1/submit-plain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(encryptedData),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || `Server error: ${response.status}`)
  }

  return response.json()
}



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

export async function trackCase(caseId, caseKey) {
  if (!caseKey || caseKey.length < 10) {
    throw new Error('Invalid case key. Please check and try again.')
  }

  const response = await fetch(`${BASE_URL}/api/v1/track?case_id=${encodeURIComponent(caseId)}&case_key=${encodeURIComponent(caseKey)}`)
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Case not found. Please check your Case ID and Case Key.')
  }
  
  return response.json()
}
