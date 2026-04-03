import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { getAuditLog } from '../services/adminApi'
import { STATUS_BADGE, STATUS_LABEL, Spinner, EmptyState, formatDate } from '../components/AdminUtils'

const EVENT_CONFIG = {
  ReportSubmitted: { icon: '📥', color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Report Submitted' },
  StatusUpdated:   { icon: '🔄', color: 'bg-teal-100 text-teal-700 border-teal-200',  label: 'Status Updated'   },
}

export default function AdminAudit() {
  const [log, setLog]         = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [copied, setCopied]   = useState(null)

  useEffect(() => {
    getAuditLog().then(data => { setLog(data); setLoading(false) })
  }, [])

  const filtered = log.filter(entry =>
    !search || entry.case_id.toLowerCase().includes(search.toLowerCase())
      || entry.event.toLowerCase().includes(search.toLowerCase())
  )

  const copyTx = async (tx, id) => {
    try {
      await navigator.clipboard.writeText(tx)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }

  return (
    <AdminLayout title="Blockchain Audit Log" breadcrumb="POCSO Authority Portal / Audit Log">

      {/* Info */}
      <div className="mb-5 flex items-start gap-3 bg-teal-50 border border-teal-200 px-4 py-3 rounded-lg">
        <span className="text-lg mt-0.5">⛓️</span>
        <div>
          <p className="text-sm font-semibold text-teal-900">Immutable Blockchain Audit Trail</p>
          <p className="text-xs text-teal-700 mt-0.5">
            All status changes and submissions are permanently anchored on the Sepolia ETH testnet.
            No record can be deleted or altered.
          </p>
        </div>
      </div>

      {/* Search + controls */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
        <input
          id="audit-search"
          type="text"
          placeholder="Filter by Case ID or event type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[240px]"
        />
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500">{filtered.length} events</span>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title="No audit events" desc="No events match your filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Case ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Status Change</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Officer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tx Hash</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((entry, idx) => {
                  const evCfg = EVENT_CONFIG[entry.event] || { icon: '•', color: 'bg-slate-100 text-slate-600 border-slate-200', label: entry.event }
                  return (
                    <tr key={entry.tx} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{String(idx + 1).padStart(4, '0')}</td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${evCfg.color}`}>
                          {evCfg.icon} {evCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-slate-800">{entry.case_id}</span>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {entry.old_status ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={STATUS_BADGE[entry.old_status]}>{STATUS_LABEL[entry.old_status]}</span>
                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                            </svg>
                            <span className={STATUS_BADGE[entry.new_status]}>{STATUS_LABEL[entry.new_status]}</span>
                          </div>
                        ) : (
                          <span className={STATUS_BADGE[entry.new_status]}>{STATUS_LABEL[entry.new_status]}</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-xs text-slate-600">{entry.admin}</span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-teal-700 truncate max-w-[120px]">{entry.tx}</span>
                          <button
                            id={`copy-tx-${entry.id}`}
                            onClick={() => copyTx(entry.tx, entry.id)}
                            title="Copy transaction hash"
                            className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                          >
                            {copied === entry.id ? (
                              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-400 hidden sm:table-cell whitespace-nowrap">
                        {formatDate(entry.timestamp)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">All events are immutably stored on Sepolia ETH</span>
            <button className="text-xs text-blue-700 hover:underline font-medium">Export CSV</button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
