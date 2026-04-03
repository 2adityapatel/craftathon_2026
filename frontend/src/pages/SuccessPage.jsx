import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback: select text */
    }
  }
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200 font-medium ${
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/20'
          : 'bg-navy-700 hover:bg-navy-600 text-slate-400 hover:text-slate-200 border border-navy-600'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Copy {label}
        </>
      )}
    </button>
  )
}

const threatColors = {
  CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
  HIGH:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MEDIUM:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  LOW:      'text-green-400 bg-green-500/10 border-green-500/20',
}

export default function SuccessPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  // If navigated directly without data, redirect
  useEffect(() => {
    if (!state?.case_id) navigate('/', { replace: true })
  }, [state, navigate])

  if (!state?.case_id) return null

  const {
    case_id, case_key, blockchain_tx, ipfs_cid,
    risk_score, threat_level, category, message,
  } = state

  const riskPct = Math.round((risk_score || 0) * 100)

  return (
    <Layout>
      <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Success animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center mb-10"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full bg-green-500/10 border-2 border-green-500/30" />
              <div className="absolute inset-3 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 className="text-3xl font-black font-display mb-2">
                Report <span className="text-gradient-amber">Submitted</span>
              </h1>
              <p className="text-slate-400 text-sm max-w-md mx-auto">{message}</p>
            </motion.div>
          </motion.div>

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6 sm:p-8 space-y-6"
          >
            {/* ⚠️ Save your keys */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex gap-3">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-400 mb-0.5">Save these details now!</p>
                <p className="text-xs text-slate-400">This is the only time your Case Key is shown. We do not store it. Without it, you cannot track your case.</p>
              </div>
            </div>

            {/* Case ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Case ID</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-navy-900 border border-navy-600 rounded-xl px-4 py-3 font-mono text-amber-400 text-lg font-bold tracking-widest">
                  {case_id}
                </div>
                <CopyButton text={case_id} label="ID" />
              </div>
            </div>

            {/* Case Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Case Key (Secret)</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-navy-900 border border-red-500/20 rounded-xl px-4 py-3 font-mono text-slate-300 text-xs break-all">
                  {case_key}
                </div>
                <CopyButton text={case_key} label="Key" />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                ✅ Also auto-saved to your browser. Clear if on a shared device.
              </p>
            </div>

            {/* AI Analysis */}
            <div className="divider pt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">AI Analysis Result</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4 bg-navy-900">
                  <div className="text-xs text-slate-500 mb-1">Risk Score</div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold font-display text-amber-400">{riskPct}%</span>
                    <span className="text-xs text-slate-600 mb-1">confidence</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-navy-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${riskPct}%` }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className={`h-full rounded-full ${
                        riskPct >= 80 ? 'bg-red-500' : riskPct >= 60 ? 'bg-orange-500' : riskPct >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>
                <div className="card p-4 bg-navy-900">
                  <div className="text-xs text-slate-500 mb-1">Threat Level</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border mt-1 ${threatColors[threat_level] || ''}`}>
                    {threat_level}
                  </div>
                  <div className="text-xs text-slate-500 mt-2 capitalize">{category?.replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            {/* Blockchain proof */}
            <div className="divider pt-4">
              <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Blockchain Proof</h3>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs text-slate-500 flex-shrink-0 mt-1">Tx Hash</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-teal-400 truncate">{blockchain_tx}</span>
                    <CopyButton text={blockchain_tx} label="" />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs text-slate-500 flex-shrink-0 mt-1">IPFS CID</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs text-teal-400 truncate">{ipfs_cid}</span>
                    <CopyButton text={ipfs_cid} label="" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-slate-500">Anchored on Sepolia ETH Testnet</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 mt-6"
          >
            <Link to="/track" id="success-track-btn" className="btn-primary flex-1 text-center text-sm py-3 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              Track This Case
            </Link>
            <Link to="/" id="success-home-btn" className="btn-secondary flex-1 text-center text-sm py-3">
              Back to Home
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-slate-600 mt-4"
          >
            Thank you for helping protect children. Your report is in safe hands.
          </motion.p>
        </div>
      </div>
    </Layout>
  )
}
