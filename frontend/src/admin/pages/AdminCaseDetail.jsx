import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getCaseDetail, updateCaseStatus } from '../services/adminApi'
import {
  THREAT_BADGE, STATUS_BADGE, STATUS_LABEL,
  RiskBar, Spinner, formatDate, CATEGORY_LABEL,
} from '../components/AdminUtils'

const STATUSES = ['RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'ESCALATED', 'ACTION_TAKEN', 'CLOSED']
const EVIDENCE_ICONS = { url: '🔗', image: '🖼️', video: '🎥', text: '📝', screenshot: '📸' }

const LabelCaps = ({ children }) => (
  <span style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', flexShrink: 0 }}>{children}</span>
)

function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--outline-variant)' }}>
      <span style={{ width: 110, flexShrink: 0, fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--outline)', paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: '0.8125rem', color: 'var(--on-surface)', wordBreak: 'break-all', ...(mono ? { fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', color: 'var(--on-surface-variant)' } : {}) }}>{value || '—'}</span>
    </div>
  )
}

export default function AdminCaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes]         = useState('')
  const [updating, setUpdating]   = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState('')
  const [updateError, setUpdateError]     = useState('')

  const [pinataData, setPinataData] = useState(null)
  const [pinataLoading, setPinataLoading] = useState(false)
  const [pinataError, setPinataError] = useState('')

  useEffect(() => {
    getCaseDetail(id)
      .then(data => {
        console.log('🔍 Fetched Single Case Detail:', data)
        setCaseData(data)
        setNewStatus(data.status)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!caseData?.ipfs_cid) return
    setPinataLoading(true)
    fetch(`https://gateway.pinata.cloud/ipfs/${caseData.ipfs_cid}`)
      .then(r => r.json())
      .then(data => { console.log('📦 Fetched Pinata IPFS Data:', data); setPinataData(data); setPinataLoading(false) })
      .catch(() => { setPinataError('Failed to load data from IPFS Pinata Gateway.'); setPinataLoading(false) })
  }, [caseData?.ipfs_cid])

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    if (!notes.trim()) { setUpdateError('Notes are required for status update.'); return }
    setUpdating(true); setUpdateError(''); setUpdateSuccess('')
    try {
      const res = await updateCaseStatus(id, newStatus, notes)
      setCaseData(prev => ({ ...prev, status: newStatus }))
      setUpdateSuccess(`Status updated to "${STATUS_LABEL[newStatus]}". Tx: ${res.tx.substring(0, 18)}...`)
      setNotes('')
    } catch (err) { setUpdateError(err.message) }
    finally { setUpdating(false) }
  }

  if (loading) return (
    <AdminLayout title="Case Detail" breadcrumb="Awaaz Authority Portal / Case Queue / Loading...">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Spinner size="lg" /></div>
    </AdminLayout>
  )

  if (error) return (
    <AdminLayout title="Case Not Found" breadcrumb="Awaaz Authority Portal / Case Queue">
      <div style={{ background: 'rgba(255,113,98,0.07)', border: '1px solid rgba(255,113,98,0.2)', borderRadius: '4px', padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 600, color: 'var(--tertiary)', marginBottom: 8 }}>Error loading case</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: 16 }}>{error}</p>
        <Link to="/admin/cases" style={{ fontSize: '0.8125rem', color: 'var(--primary)', textDecoration: 'none' }}>← Back to Case Queue</Link>
      </div>
    </AdminLayout>
  )

  const c = caseData
  const riskPct = Math.round(c.risk_score * 100)

  return (
    <AdminLayout
      title={`Case: ${c.case_id}`}
      breadcrumb={`Awaaz Authority Portal / Case Queue / ${c.case_id}`}
    >
      {/* Back */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to Queue
        </button>
      </div>

      {/* Escalation alert */}
      {c.should_escalate && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,113,98,0.07)', border: '1px solid rgba(255,113,98,0.2)', borderRadius: '4px', padding: '12px 16px', borderLeft: '3px solid var(--tertiary)' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--tertiary)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          <div>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary)' }}>This case requires immediate escalation</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>Risk score ≥ 80% or repeat offender detected. Forward to senior authority.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 2 }} className="admin-detail-grid">

        {/* ── Left: Case detail ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* Header card */}
          <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.5rem' }}>{EVIDENCE_ICONS[c.evidence_type]}</span>
                  <h2 style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '1.125rem', color: 'var(--on-surface)', letterSpacing: '0.04em' }}>{c.case_id}</h2>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  {c.repeat_offender && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '2px', fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(255,186,59,0.1)', border: '1px solid rgba(255,186,59,0.25)', color: 'var(--primary)' }}>Repeat Offender</span>
                  )}
                  {c.is_duplicate && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '2px', fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(255,113,98,0.08)', border: '1px solid rgba(255,113,98,0.2)', color: 'var(--tertiary)' }}>Duplicate</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.6875rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Risk Score</p>
                <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '2rem', color: 'var(--on-surface)', lineHeight: 1 }}>{riskPct}<span style={{ fontSize: '1rem', color: 'var(--outline)' }}>%</span></p>
                <div style={{ marginTop: 6, width: 90, marginLeft: 'auto' }}><RiskBar score={c.risk_score} /></div>
              </div>
            </div>

            {/* Details */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '1rem' }}>
              <InfoRow label="Status" value={<span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>} />
              <InfoRow label="Threat Level" value={<span className={THREAT_BADGE[c.threat_level]}>{c.threat_level}</span>} />
              <InfoRow label="Evidence Type" value={`${EVIDENCE_ICONS[c.evidence_type]} ${c.evidence_type?.charAt(0).toUpperCase() + c.evidence_type?.slice(1)}`} />
              <InfoRow label="Category" value={CATEGORY_LABEL[c.category] || c.category} />
              <InfoRow label="Confidence" value={`${Math.round((c.confidence || 0) * 100)}%`} />
              {c.domain && <InfoRow label="Domain" value={c.domain} mono />}
              {c.repeat_offender && <InfoRow label="Repeat Count" value={`${c.repeat_count} times`} />}
            </div>
          </div>

          {/* Blockchain proof */}
          <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⛓️</span> Blockchain Proof
            </h3>
            <InfoRow label="Tx Hash" value={
              !c.blockchain_tx || c.blockchain_tx === 'pending' || c.blockchain_tx.startsWith('chain_error')
                ? c.blockchain_tx || '—'
                : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', color: 'var(--secondary)', background: 'var(--surface-highest)', border: '1px solid var(--outline-variant)', padding: '4px 10px', borderRadius: '2px' }}>{c.blockchain_tx}</span>
                    <a href={`https://sepolia.etherscan.io/tx/${c.blockchain_tx}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: '2px', background: 'rgba(33,179,117,0.08)', border: '1px solid rgba(33,179,117,0.2)', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.04em' }}>
                      View in Explorer
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                )
            } mono />
            <InfoRow label="IPFS CID" value={c.ipfs_cid} mono />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--outline-variant)' }}>
              <span className="dot-live" />
              <span style={{ fontSize: '0.7rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace" }}>Anchored on Sepolia ETH Testnet — tamper-proof</span>
            </div>
          </div>

          {/* Pinata IPFS Evidence Viewer */}
          <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem' }}>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🗂️</span> Raw Evidence (Pinned on IPFS via Pinata)
            </h3>

            {pinataLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}><Spinner size="sm" /></div>
            ) : pinataError ? (
              <p style={{ fontSize: '0.75rem', color: 'var(--tertiary)', textAlign: 'center', padding: '1rem 0' }}>{pinataError}</p>
            ) : pinataData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ background: 'var(--surface-highest)', borderRadius: '4px', padding: '14px 16px' }}>
                  <LabelCaps>Reporter's Description</LabelCaps>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface)', whiteSpace: 'pre-wrap', marginTop: 8, lineHeight: 1.6 }}>{pinataData.description || 'No description provided.'}</p>
                </div>

                {pinataData.url && (
                  <div style={{ background: 'var(--surface-highest)', borderRadius: '4px', padding: '14px 16px' }}>
                    <LabelCaps>Reported URL</LabelCaps>
                    <a href={pinataData.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '0.8125rem', color: 'var(--secondary)', textDecoration: 'none', wordBreak: 'break-all', display: 'block', marginTop: 8 }}>
                      {pinataData.url}
                    </a>
                  </div>
                )}

                {pinataData.image_cid && (
                  <div style={{ background: 'var(--surface-highest)', borderRadius: '4px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <LabelCaps>Attached Image Evidence</LabelCaps>
                      <a href={`https://gateway.pinata.cloud/ipfs/${pinataData.image_cid}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.675rem', fontWeight: 600, color: 'var(--secondary)', textDecoration: 'none' }}>
                        View IPFS Source
                        <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </div>
                    <div style={{ borderRadius: '4px', border: '1px solid var(--outline-variant)', overflow: 'hidden', background: 'var(--surface)', display: 'flex', justifyContent: 'center', maxHeight: 380 }}>
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${pinataData.image_cid}`}
                        alt="Evidence"
                        style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--outline)', textAlign: 'center', padding: '1rem 0' }}>No IPFS data mapped.</p>
            )}
          </div>
        </div>

        {/* ── Right: Status update panel ── */}
        <div>
          <div style={{ background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden', position: 'sticky', top: 16 }}>
            {/* Panel header */}
            <div style={{ background: 'var(--surface-highest)', padding: '14px 16px', borderBottom: '1px solid var(--outline-variant)' }}>
              <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.8125rem', color: 'var(--on-surface)' }}>Update Case Status</h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: 2 }}>Action will be logged on blockchain</p>
            </div>

            {/* Form */}
            <form onSubmit={handleStatusUpdate} style={{ padding: '1rem 1rem 1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label htmlFor="new-status-select" style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>New Status</label>
                  <select id="new-status-select" value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="status-notes" style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
                    Notes <span style={{ color: 'var(--tertiary)' }}>*</span>
                  </label>
                  <textarea id="status-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                    placeholder="Reason for status change, actions taken, referrals made..."
                    className="textarea-field" style={{ minHeight: 90, resize: 'none' }} />
                </div>

                {updateError && (
                  <div style={{ padding: '10px 12px', borderRadius: '4px', background: 'rgba(255,113,98,0.08)', border: '1px solid rgba(255,113,98,0.2)', fontSize: '0.75rem', color: 'var(--tertiary)' }}>{updateError}</div>
                )}
                {updateSuccess && (
                  <div style={{ padding: '10px 12px', borderRadius: '4px', background: 'rgba(33,179,117,0.08)', border: '1px solid rgba(33,179,117,0.2)', fontSize: '0.75rem', color: 'var(--secondary)' }}>✓ {updateSuccess}</div>
                )}

                <button id="update-status-btn" type="submit" disabled={updating || newStatus === c.status}
                  className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', gap: 8, opacity: (updating || newStatus === c.status) ? 0.5 : 1, cursor: (updating || newStatus === c.status) ? 'not-allowed' : 'pointer' }}>
                  {updating ? (
                    <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(87,59,0,0.3)', borderTopColor: 'var(--on-primary)', animation: 'spin 1s linear infinite' }} />Updating on blockchain...</>
                  ) : (
                    <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Update Status</>
                  )}
                </button>
                {newStatus === c.status && (
                  <p style={{ fontSize: '0.7rem', color: 'var(--outline)', textAlign: 'center' }}>Select a different status to update</p>
                )}
              </div>
            </form>

            {/* Quick actions */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', padding: '14px 16px' }}>
              <LabelCaps>Quick Actions</LabelCaps>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                <button
                  onClick={() => { setNewStatus('ESCALATED'); setNotes('Escalated to senior authority for immediate review.') }}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--tertiary)', padding: '8px 10px', borderRadius: '2px', border: '1px solid rgba(255,113,98,0.2)', background: 'rgba(255,113,98,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,113,98,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,113,98,0.04)'}>
                  🚨 Mark as Escalated
                </button>
                <button
                  onClick={() => { setNewStatus('ACTION_TAKEN'); setNotes('Takedown request submitted to ISP. Case actioned.') }}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--secondary)', padding: '8px 10px', borderRadius: '2px', border: '1px solid rgba(33,179,117,0.2)', background: 'rgba(33,179,117,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(33,179,117,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(33,179,117,0.04)'}>
                  ⚡ Mark Action Taken
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
