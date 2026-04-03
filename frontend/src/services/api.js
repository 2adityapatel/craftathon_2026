/**
 * Real API service — connects to the FastAPI backend.
 */

const API_BASE_URL = 'http://localhost:8000/api/v1'

/**
 * GET /api/v1/public-key
 */
export async function fetchPublicKey() {
  const response = await fetch(`${API_BASE_URL}/public-key`)
  if (!response.ok) {
    throw new Error('Failed to fetch encryption key from server.')
  }
  return await response.json()
}

/**
 * POST /api/v1/submit
 */
export async function submitReport(payload) {
  const response = await fetch(`${API_BASE_URL}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Failed to submit report. Please try again.')
  }

  return await response.json()
}

/**
 * GET /api/v1/track?case_id=...&case_key=...
 */
export async function trackCase(caseId, caseKey) {
  const params = new URLSearchParams({ case_id: caseId, case_key: caseKey })
  const response = await fetch(`${API_BASE_URL}/track?${params.toString()}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || 'Case not found or invalid key.')
  }

  return await response.json()
}
