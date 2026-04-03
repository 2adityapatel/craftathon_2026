import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import { trackCase } from '../services/api'

const STATUS_CONFIG = {
  RECEIVED:     { label: 'Received',     color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: '📥', desc: 'Your report has been received and queued for AI triage.' },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: '🔍', desc: 'An authority is actively reviewing your report.' },
  VERIFIED:     { label: 'Verified',     color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',       icon: '✅', desc: 'Your report has been verified as legitimate.' },
  ESCALATED:    { label: 'Escalated',    color: 'text-red-400 bg-red-500/10 border-red-500/20',           icon: '🚨', desc: 'The case has been escalated to the relevant agency.' },
  ACTION_TAKEN: { label: 'Action Taken', color: 'text-green-400 bg-green-500/10 border-green-500/20',     icon: '⚡', desc: 'Action has been taken (takedown, ISP notified, etc.).' },
  CLOSED:       { label: 'Closed',       color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',     icon: '🔒', desc: 'This case has been resolved and closed.' },
}

const STATUS_ORDER = ['RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'ESCALATED', 'ACTION_TAKEN', 'CLOSED']

function StatusTimeline({ history }) {
  return (
    <div className="space-y-0">
      {history.map((entry, i) => {
        const cfg = STATUS_CONFIG[entry.status] || {}
        const isLast = i === history.length - 1
        return (
          <div key={i} className="flex gap-4">
            {/* Line + dot */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-base flex-shrink-0 ${
                isLast ? 'border-amber-500 bg-amber-500/10' : 'border-navy-600 bg-navy-800'
              }`}>
                {cfg.icon || '•'}
              </div>
              {!isLast && <div className="w-px flex-1 bg-navy-700 my-1 min-h-[24px]" />}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''} flex-1`}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  {cfg.label || entry.status}
                </span>
                <span className="text-xs text-slate-600">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              {entry.notes && (
                <p className="text-xs text-slate-400">{entry.notes}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function TrackPage() {
  const savedKey = localStorage.getItem('last_case_key') || ''

  const [caseId, setCaseId] = useState('')
  const [caseKey, setCaseKey] = useState(savedKey)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!caseId.trim() || !caseKey.trim()) {
      setError('Please enter both Case ID and Case Key.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await trackCase(caseId.trim().toUpperCase(), caseKey.trim())
      setResult(data)
    } catch (err) {
      setError(err.message || 'Unable to find case. Check your Case ID and Case Key.')
    } finally {
      setLoading(false)
    }
  }

  const currentStatusIndex = result ? STATUS_ORDER.indexOf(result.status) : -1
  const currentCfg = result ? (STATUS_CONFIG[result.status] || {}) : {}

  return (
    <Layout>
      <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-full px-4 py-1.5 mb-4">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              <span className="text-xs text-slate-400">Anonymous Case Tracking</span>
            </div>
            <h1 className="text-3xl font-black font-display mb-2">
              Track Your <span className="text-gradient-amber">Case</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Enter your Case ID and Case Key to check the status of your report — completely anonymously.
            </p>
          </motion.div>

          {/* Search form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 sm:p-8 mb-6"
          >
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label htmlFor="case-id-input" className="block text-sm font-medium text-slate-300 mb-2">
                  Case ID
                </label>
                <input
                  id="case-id-input"
                  type="text"
                  className="input-field font-mono tracking-widest uppercase"
                  placeholder="POCSO-7F4A2X"
                  value={caseId}
                  onChange={(e) => { setCaseId(e.target.value); setError('') }}
                  maxLength={12}
                />
              </div>

              <div>
                <label htmlFor="case-key-input" className="block text-sm font-medium text-slate-300 mb-2">
                  Case Key <span className="text-slate-600 font-normal">(32-char secret)</span>
                </label>
                <input
                  id="case-key-input"
                  type="text"
                  className="input-field font-mono text-sm"
                  placeholder="a3f8c2d1e9b7f4a6c8e0d2b5a7f9c1e3"
                  value={caseKey}
                  onChange={(e) => { setCaseKey(e.target.value); setError('') }}
                />
                {savedKey && (
                  <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                    </svg>
                    Auto-filled from your browser storage
                  </p>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="text-sm text-red-400">{error}</span>
                </motion.div>
              )}

              <button
                id="track-submit-btn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-navy-900/40 border-t-navy-900 animate-spin" />
                    Fetching status...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                    Track Case
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Demo hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="card p-4 mb-6 border-navy-600/50"
          >
            <p className="text-xs text-slate-500 font-semibold mb-2">🧪 Demo: Try these sample cases</p>
            <div className="space-y-1.5">
              {[
                { id: 'POCSO-7F4A2X', key: 'demo', status: 'UNDER_REVIEW' },
                { id: 'POCSO-3C9K8M', key: 'demo', status: 'VERIFIED' },
              ].map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => { setCaseId(demo.id); setCaseKey(demo.key) }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-navy-700 transition-colors group"
                >
                  <span className="font-mono text-xs text-amber-400">{demo.id}</span>
                  <span className="text-xs text-slate-600">→ {demo.status}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-5"
              >
                {/* Current status hero */}
                <div className="card p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Case ID</p>
                      <p className="font-mono font-bold text-lg text-amber-400">{result.case_id}</p>
                    </div>
                    <div className={`text-3xl`}>{currentCfg.icon}</div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${currentCfg.color}`}>
                      {currentCfg.label || result.status}
                    </span>
                    {result.threat_level && (
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        result.threat_level === 'CRITICAL' ? 'badge-critical' :
                        result.threat_level === 'HIGH'     ? 'badge-high'     :
                        result.threat_level === 'MEDIUM'   ? 'badge-medium'   : 'badge-low'
                      }`}>
                        {result.threat_level}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-3">{currentCfg.desc}</p>

                  {/* Progress bar */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span>Received</span>
                      <span>Closed</span>
                    </div>
                    <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStatusIndex + 1) / STATUS_ORDER.length) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      {STATUS_ORDER.map((s, i) => (
                        <div
                          key={s}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i <= currentStatusIndex ? 'bg-amber-400' : 'bg-navy-600'
                          }`}
                          title={STATUS_CONFIG[s]?.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {result.history?.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Status History</h3>
                    <StatusTimeline history={result.history} />
                  </div>
                )}

                {/* Blockchain info */}
                {result.blockchain_tx && (
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Blockchain Proof</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-slate-600 w-16 flex-shrink-0 mt-0.5">Tx Hash</span>
                        <span className="font-mono text-xs text-teal-400 break-all">{result.blockchain_tx}</span>
                      </div>
                      {result.ipfs_cid && (
                        <div className="flex items-start gap-3">
                          <span className="text-xs text-slate-600 w-16 flex-shrink-0 mt-0.5">IPFS CID</span>
                          <span className="font-mono text-xs text-teal-400 break-all">{result.ipfs_cid}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-slate-600">Sepolia ETH • Immutable record</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-slate-600 pb-4">
                  Last updated: {new Date(result.last_updated || result.submitted_at).toLocaleString()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  )
}
