// Shared helpers used across admin components

export const THREAT_BADGE = {
  CRITICAL: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200',
  HIGH:     'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200',
  MEDIUM:   'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200',
  LOW:      'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200',
}

export const STATUS_BADGE = {
  RECEIVED:     'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200',
  UNDER_REVIEW: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200',
  VERIFIED:     'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200',
  ESCALATED:    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200',
  ACTION_TAKEN: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200',
  CLOSED:       'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200',
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

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RiskBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? 'bg-red-500' : score >= 0.6 ? 'bg-orange-500' : score >= 0.4 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden min-w-[60px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-600 w-8 text-right">{pct}%</span>
    </div>
  )
}

export function Spinner({ size = 'md' }) {
  const sz = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'
  return (
    <div className={`${sz} border-2 border-slate-300 border-t-blue-700 rounded-full animate-spin`} />
  )
}

export function EmptyState({ icon = '📭', title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-slate-700 font-medium mb-1">{title}</p>
      {desc && <p className="text-sm text-slate-500">{desc}</p>}
    </div>
  )
}
