// Shared helpers used across admin components — Sovereign Sentinel tokens

// ── Inline-style chip builders (matching global CSS chip classes via style objects) ──
const chipBase = {
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', borderRadius: '2px',
  fontSize: '0.6875rem', fontWeight: 500,
  fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
}

export const THREAT_BADGE = {
  CRITICAL: 'badge-critical',
  HIGH:     'badge-high',
  MEDIUM:   'badge-medium',
  LOW:      'badge-low',
}

export const STATUS_BADGE = {
  RECEIVED:     'status-received',
  UNDER_REVIEW: 'chip-warning',
  VERIFIED:     'chip-confirmed',
  ESCALATED:    'chip-critical',
  ACTION_TAKEN: 'chip-confirmed',
  CLOSED:       'status-closed',
}

export const STATUS_LABEL = {
  RECEIVED:     'Received',
  UNDER_REVIEW: 'Under Review',
  VERIFIED:     'Verified',
  ESCALATED:    'Escalated',
  ACTION_TAKEN: 'Action Taken',
  CLOSED:       'Closed',
}

export const CATEGORY_LABEL = {
  CSAM:        'CSAM',
  harassment:  'Harassment',
  trafficking: 'Trafficking',
  hate_speech: 'Hate Speech',
  other:       'Other',
}

export function formatDate(val) {
  if (!val) return '—'
  let d
  if (typeof val === 'number') d = new Date(val * 1000)
  else if (typeof val === 'string' && !val.endsWith('Z') && !val.includes('+')) d = new Date(val.replace(' ', 'T') + 'Z')
  else d = new Date(val)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata', timeZoneName: 'short' })
}

export function timeAgo(val) {
  if (!val) return '—'
  let d
  if (typeof val === 'number') d = new Date(val * 1000)
  else if (typeof val === 'string' && !val.endsWith('Z') && !val.includes('+')) d = new Date(val.replace(' ', 'T') + 'Z')
  else d = new Date(val)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RiskBar({ score }) {
  const pct = Math.round(score * 100)
  const barColor = score >= 0.8 ? 'var(--tertiary)' : score >= 0.6 ? 'var(--primary)' : score >= 0.4 ? 'var(--primary-dim)' : 'var(--secondary)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, borderRadius: '2px', background: 'var(--surface-highest)', overflow: 'hidden', minWidth: 60 }}>
        <div style={{ height: '100%', borderRadius: '2px', background: barColor, width: `${pct}%` }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6875rem', color: 'var(--on-surface-variant)', width: 30, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 14 : size === 'lg' ? 28 : 20
  return (
    <div style={{ width: sz, height: sz, borderRadius: '50%', border: '2px solid var(--outline-variant)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
  )
}

export function EmptyState({ icon = '📭', title, desc }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{icon}</div>
      <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 6 }}>{title}</p>
      {desc && <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>{desc}</p>}
    </div>
  )
}
