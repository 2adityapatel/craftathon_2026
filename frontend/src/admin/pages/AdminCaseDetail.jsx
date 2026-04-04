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

function InfoRow({ label, value, mono = false, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-slate-100 last:border-0 ${className}`}>
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-800 break-all ${mono ? 'font-mono text-xs text-slate-600' : ''}`}>{value || '—'}</span>
    </div>
  )
}

const STATUS_HISTORY_ICONS = {
  RECEIVED: '📥', UNDER_REVIEW: '🔍', VERIFIED: '✅',
  ESCALATED: '🚨', ACTION_TAKEN: '⚡', CLOSED: '🔒',
}

export default function AdminCaseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [caseData, setCaseData]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  // Status update form
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
        setCaseData(data);
        setNewStatus(data.status);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!caseData?.ipfs_cid) return;
    setPinataLoading(true);
    fetch(`https://gateway.pinata.cloud/ipfs/${caseData.ipfs_cid}`)
      .then(r => r.json())
      .then(data => {
        console.log('📦 Fetched Pinata IPFS Data:', data);
        setPinataData(data);
        setPinataLoading(false);
      })
      .catch(err => {
        setPinataError('Failed to load data from IPFS Pinata Gateway.');
        setPinataLoading(false);
      });
  }, [caseData?.ipfs_cid])

  const handleStatusUpdate = async (e) => {
    e.preventDefault()
    if (!notes.trim()) { setUpdateError('Notes are required for status update.'); return }
    setUpdating(true)
    setUpdateError('')
    setUpdateSuccess('')
    try {
      const res = await updateCaseStatus(id, newStatus, notes)
      setCaseData(prev => ({ ...prev, status: newStatus }))
      setUpdateSuccess(`Status updated to "${STATUS_LABEL[newStatus]}". Tx: ${res.tx.substring(0, 18)}...`)
      setNotes('')
    } catch (err) {
      setUpdateError(err.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <AdminLayout title="Case Detail" breadcrumb="Awaaz Authority Portal / Case Queue / Loading...">
      <div className="flex justify-center py-24"><Spinner size="lg" /></div>
    </AdminLayout>
  )

  if (error) return (
    <AdminLayout title="Case Not Found" breadcrumb="Awaaz Authority Portal / Case Queue">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-700 font-semibold mb-2">Error loading case</p>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <Link to="/admin/cases" className="text-sm text-blue-700 hover:underline">← Back to Case Queue</Link>
      </div>
    </AdminLayout>
  )

  const c = caseData

  return (
    <AdminLayout
      title={`Case: ${c.case_id}`}
      breadcrumb={`Awaaz Authority Portal / Case Queue / ${c.case_id}`}
    >
      {/* Back */}
      <div className="mb-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-blue-700 hover:underline font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Queue
        </button>
      </div>

      {/* Escalation alert */}
      {c.should_escalate && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">This case requires immediate escalation</p>
            <p className="text-xs text-red-700 mt-0.5">Risk score ≥ 80% or repeat offender detected. Forward to senior authority.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Left: Case detail ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Header card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{EVIDENCE_ICONS[c.evidence_type]}</span>
                  <h2 className="text-lg font-bold text-slate-900 font-mono">{c.case_id}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {c.repeat_offender && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                      Repeat Offender
                    </span>
                  )}
                  {c.is_duplicate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                      Duplicate
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Risk Score</p>
                <p className="text-3xl font-bold text-slate-900">{Math.round(c.risk_score * 100)}<span className="text-lg text-slate-400">%</span></p>
                <div className="mt-1 w-24 ml-auto">
                  <RiskBar score={c.risk_score} />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="border-t border-slate-100 pt-4">
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
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span className="text-base">⛓️</span> Blockchain Proof
            </h3>
            <div className="space-y-3">
              <InfoRow label="Tx Hash" value={
                !c.blockchain_tx || c.blockchain_tx === "pending" || c.blockchain_tx.startsWith("chain_error") 
                  ? c.blockchain_tx || "—"
                  : (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">{c.blockchain_tx}</span>
                      <a href={`https://sepolia.etherscan.io/tx/${c.blockchain_tx}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-semibold tracking-wide">
                        View in Explorer
                        <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </a>
                    </div>
                  )
              } mono />
              <InfoRow label="IPFS CID" value={c.ipfs_cid} mono />
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate-500">Anchored on Sepolia ETH Testnet — tamper-proof</span>
              </div>
            </div>
          </div>

          {/* Pinata IPFS Evidence Viewer */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2">
              <span>🗂️</span> Raw Evidence (Pinned on IPFS via Pinata)
            </h3>
            
            {pinataLoading ? (
              <div className="flex justify-center py-6"><Spinner size="sm" /></div>
            ) : pinataError ? (
              <p className="text-xs text-red-500 py-4 text-center">{pinataError}</p>
            ) : pinataData ? (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reporter's Description</p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{pinataData.description || 'No description provided.'}</p>
                </div>
                
                {pinataData.url && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reported URL</p>
                    <a href={pinataData.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 hover:underline break-all">
                      {pinataData.url}
                    </a>
                  </div>
                )}

                {pinataData.image_cid && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center justify-between">
                      <span>Attached Image Evidence</span>
                      <a href={`https://gateway.pinata.cloud/ipfs/${pinataData.image_cid}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline normal-case flex items-center gap-1">
                        View IPFS Source
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      </a>
                    </p>
                    <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-200 flex justify-center max-h-96">
                      <img 
                        src={`https://gateway.pinata.cloud/ipfs/${pinataData.image_cid}`} 
                        alt="Evidence" 
                        className="object-contain max-w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No IPFS data mapped.</p>
            )}
          </div>
        </div>

        {/* ── Right: Status update panel ── */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden sticky top-4">
            <div className="bg-slate-800 text-white px-5 py-4">
              <h3 className="text-sm font-semibold">Update Case Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Action will be logged on blockchain</p>
            </div>
            <form onSubmit={handleStatusUpdate} className="p-5 space-y-4">
              <div>
                <label htmlFor="new-status-select" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  New Status
                </label>
                <select
                  id="new-status-select"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-notes" className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="status-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Reason for status change, actions taken, referrals made..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                />
              </div>

              {updateError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {updateError}
                </div>
              )}
              {updateSuccess && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800">
                  ✓ {updateSuccess}
                </div>
              )}

              <button
                id="update-status-btn"
                type="submit"
                disabled={updating || newStatus === c.status}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating on blockchain...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Update Status
                  </>
                )}
              </button>
              {newStatus === c.status && (
                <p className="text-xs text-slate-400 text-center">Select a different status to update</p>
              )}
            </form>

            {/* Quick actions */}
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Actions</p>
              <div className="space-y-2">
                <button
                  onClick={() => { setNewStatus('ESCALATED'); setNotes('Escalated to senior authority for immediate review.') }}
                  className="w-full text-left flex items-center gap-2 text-xs text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-200"
                >
                  🚨 <span>Mark as Escalated</span>
                </button>
                <button
                  onClick={() => { setNewStatus('ACTION_TAKEN'); setNotes('Takedown request submitted to ISP. Case actioned.') }}
                  className="w-full text-left flex items-center gap-2 text-xs text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-green-200"
                >
                  ⚡ <span>Mark Action Taken</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
