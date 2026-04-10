import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }
  return (
    <button onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: '2px', border: '1px solid var(--outline-variant)',
      background: copied ? 'rgba(33,179,117,0.08)' : 'var(--surface-high)',
      color: copied ? 'var(--secondary)' : 'var(--on-surface-variant)',
      fontSize: '0.7rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
      flexShrink: 0,
    }}>
      {copied ? (
        <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
      ) : (
        <><svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy {label}</>
      )}
    </button>
  )
}

const threatBadge = {
  CRITICAL: 'badge-critical',
  HIGH:     'badge-high',
  MEDIUM:   'badge-medium',
  LOW:      'badge-low',
}

export default function SuccessPage() {
  const { t } = useLanguage()
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => { if (!state?.case_id) navigate('/', { replace: true }) }, [state, navigate])
  if (!state?.case_id) return null

  const { case_id, case_key, blockchain_tx, ipfs_cid, risk_score, threat_level, category, message } = state
  const riskPct = Math.round((risk_score || 0) * 100)

  const LabelCaps = ({ children }) => (
    <span style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 8 }}>{children}</span>
  )

  const HashRow = ({ label, value, copyLabel }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--outline)', flexShrink: 0, marginTop: 2 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: 'var(--secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <CopyButton text={value} label={copyLabel} />
      </div>
    </div>
  )

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '6rem 1.5rem 3rem', backgroundImage: 'linear-gradient(rgba(60,73,91,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(60,73,91,0.1) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>

          {/* Success icon */}
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 1.25rem' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '4px', background: 'rgba(33,179,117,0.12)', animation: 'pulseLive 2s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '4px', border: '1px solid rgba(33,179,117,0.3)', background: 'rgba(33,179,117,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--secondary)" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem,4vw,2rem)', color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                {t('successContext.title1')} <span style={{ color: 'var(--primary)' }}>{t('successContext.title2')}</span>
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>{message}</p>
            </motion.div>
          </motion.div>

          {/* Main card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'rgba(26,38,55,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,186,59,0.1)', borderRadius: '4px', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Save warning */}
            <div style={{ background: 'rgba(255,186,59,0.06)', border: '1px solid rgba(255,186,59,0.2)', borderRadius: '4px', padding: '14px 16px', display: 'flex', gap: 12 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>{t('successContext.saveWarning')}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{t('successContext.saveDesc')}</p>
              </div>
            </div>

            {/* Case ID */}
            <div>
              <LabelCaps>Case ID</LabelCaps>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, background: 'var(--surface-highest)', border: '1px solid var(--outline-variant)', borderRadius: '4px', padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--primary)', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {case_id}
                </div>
                <CopyButton text={case_id} label="ID" />
              </div>
            </div>

            {/* Case Key */}
            <div>
              <LabelCaps>{t('successContext.caseKey')}</LabelCaps>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, background: 'var(--surface-highest)', border: '1px solid rgba(255,113,98,0.15)', borderRadius: '4px', padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'var(--on-surface)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {case_key}
                </div>
                <CopyButton text={case_key} label="Key" />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: 6 }}>{t('successContext.autoSaved')}</p>
            </div>

            {/* AI Analysis — nested bento sub-block */}
            <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--outline-variant)' }}>
              <LabelCaps>AI Analysis Result</LabelCaps>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {/* Risk Score */}
                <div style={{ background: 'var(--surface-highest)', borderRadius: '4px', padding: '16px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--outline)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risk Score</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.75rem', color: 'var(--primary)', lineHeight: 1 }}>{riskPct}%</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--outline)', marginBottom: 3 }}>confidence</span>
                  </div>
                  <div style={{ marginTop: 10, height: 3, borderRadius: '2px', background: 'var(--surface-variant)', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${riskPct}%` }} transition={{ delay: 0.5, duration: 0.8 }}
                      style={{ height: '100%', borderRadius: '2px', background: riskPct >= 80 ? 'var(--tertiary)' : riskPct >= 60 ? 'var(--primary)' : riskPct >= 40 ? 'var(--primary-dim)' : 'var(--secondary)' }} />
                  </div>
                </div>
                {/* Threat level */}
                <div style={{ background: 'var(--surface-highest)', borderRadius: '4px', padding: '16px' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--outline)', marginBottom: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Threat Level</p>
                  <span className={threatBadge[threat_level] || 'chip-warning'} style={{ marginTop: 4, display: 'inline-flex' }}>{threat_level}</span>
                  {category && <p style={{ fontSize: '0.75rem', color: 'var(--outline)', marginTop: 8, textTransform: 'capitalize' }}>{category?.replace('_', ' ')}</p>}
                </div>
              </div>
            </div>

            {/* Blockchain proof */}
            <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--outline-variant)' }}>
              <LabelCaps>Blockchain Proof</LabelCaps>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {blockchain_tx && <HashRow label="Tx Hash" value={blockchain_tx} copyLabel="" />}
                {ipfs_cid && <HashRow label="IPFS CID" value={ipfs_cid} copyLabel="" />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span className="dot-live" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--outline)' }}>Anchored on Sepolia ETH Testnet</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action buttons */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Link to="/track" id="success-track-btn" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px 20px', gap: 8 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Track This Case
            </Link>
            <Link to="/" id="success-home-btn" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '11px 20px' }}>
              Back to Home
            </Link>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--outline)', marginTop: '1rem' }}>
            {t('successContext.thanks')}
          </motion.p>
        </div>
      </div>
    </Layout>
  )
}
