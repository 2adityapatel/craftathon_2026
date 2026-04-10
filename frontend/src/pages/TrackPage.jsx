import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import { trackCase } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

const STATUS_CONFIG = {
  RECEIVED:     { label: 'Received',     chipClass: 'chip-warning',   icon: '📥', desc: 'Your report has been received and queued for AI triage.' },
  UNDER_REVIEW: { label: 'Under Review', chipClass: 'chip-warning',   icon: '🔍', desc: 'An authority is actively reviewing your report.' },
  VERIFIED:     { label: 'Verified',     chipClass: 'chip-confirmed', icon: '✅', desc: 'Your report has been verified as legitimate.' },
  ESCALATED:    { label: 'Escalated',    chipClass: 'chip-critical',  icon: '🚨', desc: 'The case has been escalated to the relevant agency.' },
  ACTION_TAKEN: { label: 'Action Taken', chipClass: 'chip-confirmed', icon: '⚡', desc: 'Action has been taken (takedown, ISP notified, etc.).' },
  CLOSED:       { label: 'Closed',       chipClass: 'status-closed',  icon: '🔒', desc: 'This case has been resolved and closed.' },
}
const STATUS_ORDER = ['RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'ESCALATED', 'ACTION_TAKEN', 'CLOSED']

function StatusTimeline({ history }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {history.map((entry, i) => {
        const cfg = STATUS_CONFIG[entry.status] || {}
        const isLast = i === history.length - 1
        return (
          <div key={i} style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '4px',
                border: `1px solid ${isLast ? 'var(--primary)' : 'var(--outline-variant)'}`,
                background: isLast ? 'rgba(255,186,59,0.08)' : 'var(--surface-high)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', flexShrink: 0,
              }}>{cfg.icon || '•'}</div>
              {!isLast && <div style={{ width: 1, flex: 1, background: 'var(--outline-variant)', margin: '4px 0', minHeight: 24 }} />}
            </div>
            <div style={{ paddingBottom: isLast ? 0 : 20, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span className={cfg.chipClass || 'chip-warning'}>{cfg.label || entry.status}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>
                  {new Date(entry.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', timeZoneName: 'short' })}
                </span>
              </div>
              {entry.notes && <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{entry.notes}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function TrackPage() {
  const { t } = useLanguage()
  const savedKey = localStorage.getItem('last_case_key') || ''
  const [caseId, setCaseId] = useState('')
  const [caseKey, setCaseKey] = useState(savedKey)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const handleCaseIdChange = (e) => {
    const val = e.target.value.toUpperCase()
    setCaseId(val); setError('')
    const storedStr = localStorage.getItem(`case_${val}`)
    if (storedStr) {
      try { const stored = JSON.parse(storedStr); if (stored.case_key) setCaseKey(stored.case_key) } catch (err) {}
    }
  }

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!caseId.trim() || !caseKey.trim()) { setError('Please enter both Case ID and Case Key.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await trackCase(caseId.trim().toUpperCase(), caseKey.trim())
      setResult(data)
    } catch (err) {
      setError(err.message || 'Unable to find case. Check your Case ID and Case Key.')
    } finally { setLoading(false) }
  }

  const currentStatusIndex = result ? STATUS_ORDER.indexOf(result.status) : -1
  const currentCfg = result ? (STATUS_CONFIG[result.status] || {}) : {}
  const progressPct = result
    ? result.status === 'RECEIVED' ? 16
    : result.status === 'UNDER_REVIEW' ? 33
    : result.status === 'VERIFIED' ? 50
    : result.status === 'ESCALATED' ? 66
    : 100
    : 0

  const LabelCaps = ({ children }) => (
    <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>{children}</span>
  )

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '6rem 1.5rem 3rem', backgroundImage: 'linear-gradient(rgba(60,73,91,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(60,73,91,0.1) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="chip-confirmed" style={{ display: 'inline-flex', marginBottom: 16 }}>
              <span className="dot-live" />Zero-Knowledge Status Query
            </span>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem,4vw,2.25rem)', color: 'var(--on-surface)', marginBottom: 10, letterSpacing: '-0.02em' }}>
              {t('trackContext.title')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              {t('trackContext.subtitle')}
            </p>
          </motion.div>

          {/* Search card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'rgba(26,38,55,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,186,59,0.1)', borderRadius: '4px', padding: '1.75rem', marginBottom: 8 }}>
            <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="case-id-input"><LabelCaps>{t('trackContext.caseIdLabel')}</LabelCaps></label>
                <input id="case-id-input" type="text" className="input-field"
                  style={{ marginTop: 8, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}
                  placeholder="POCSO-7F4A2X" value={caseId} onChange={handleCaseIdChange} maxLength={20} />
              </div>
              <div>
                <label htmlFor="case-key-input"><LabelCaps>{t('trackContext.caseKeyLabel')}</LabelCaps></label>
                <input id="case-key-input" type="text" className="input-field"
                  style={{ marginTop: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem' }}
                  readOnly placeholder={t('trackContext.caseKeyPlaceholder')} value={caseKey}
                  onChange={(e) => { setCaseKey(e.target.value); setError('') }} />
                {savedKey && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Auto-filled from your browser storage
                  </p>
                )}
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '10px 14px', borderRadius: '4px', background: 'rgba(255,113,98,0.08)', border: '1px solid rgba(255,113,98,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--tertiary)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--tertiary)' }}>{error}</span>
                </motion.div>
              )}

              <button id="track-submit-btn" type="submit" disabled={loading} className="btn-primary"
                style={{ width: '100%', padding: '11px 20px', gap: 8, justifyContent: 'center', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(87,59,0,0.3)', borderTopColor: 'var(--on-primary)', animation: 'spin 1s linear infinite' }} />
                    Querying ledger...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    {t('trackContext.btnTrack')}
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>

                {/* Current status hero — Bento card */}
                <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <LabelCaps>Case ID</LabelCaps>
                      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)', marginTop: 4, letterSpacing: '0.06em' }}>{result.case_id}</p>
                    </div>
                    <div style={{ fontSize: '1.5rem' }}>{currentCfg.icon}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span className={currentCfg.chipClass || 'chip-warning'}>{currentCfg.label || result.status}</span>
                    {result.threat_level && (
                      <span className={
                        result.threat_level === 'CRITICAL' ? 'badge-critical' :
                        result.threat_level === 'HIGH' ? 'badge-high' :
                        result.threat_level === 'MEDIUM' ? 'badge-medium' : 'badge-low'
                      }>{result.threat_level}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{currentCfg.desc}</p>

                  {/* Progress bar */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <LabelCaps>Received</LabelCaps>
                      <LabelCaps>Closed</LabelCaps>
                    </div>
                    <div style={{ height: 3, background: 'var(--surface-highest)', borderRadius: '2px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.9, delay: 0.2 }}
                        style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, var(--primary-container), var(--primary))' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      {STATUS_ORDER.map((s, i) => (
                        <div key={s} title={STATUS_CONFIG[s]?.label}
                          style={{ width: 6, height: 6, borderRadius: '2px', background: i <= currentStatusIndex ? 'var(--primary)' : 'var(--surface-highest)', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {result.history?.length > 0 && (
                  <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.5rem' }}>
                    <LabelCaps>Status History</LabelCaps>
                    <div style={{ marginTop: '1rem' }}><StatusTimeline history={result.history} /></div>
                  </div>
                )}

                {/* Blockchain proof */}
                {result.blockchain_tx && (
                  <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem' }}>
                    <LabelCaps>Blockchain Proof</LabelCaps>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <LabelCaps>Tx Hash</LabelCaps>
                        <div>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: 'var(--secondary)', wordBreak: 'break-all' }}>{result.blockchain_tx}</span>
                          {result.blockchain_tx && result.blockchain_tx !== 'pending' && !result.blockchain_tx.startsWith('chain_error') && (
                            <div style={{ marginTop: 8 }}>
                              <a href={`https://sepolia.etherscan.io/tx/${result.blockchain_tx}`} target="_blank" rel="noopener noreferrer" className="chip-confirmed"
                                style={{ textDecoration: 'none', display: 'inline-flex', gap: 6 }}>
                                View in Explorer
                                <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      {result.ipfs_cid && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <LabelCaps>IPFS CID</LabelCaps>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: 'var(--secondary)', wordBreak: 'break-all' }}>{result.ipfs_cid}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="dot-live" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Sepolia ETH • Immutable record</span>
                      </div>
                    </div>
                  </div>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--outline)', padding: '0.75rem 0' }}>
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
