import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getCases } from '../services/adminApi'
import {
  THREAT_BADGE, STATUS_BADGE, STATUS_LABEL,
  RiskBar, Spinner, EmptyState, timeAgo, CATEGORY_LABEL,
} from '../components/AdminUtils'

const EVIDENCE_ICONS = { url: '🔗', image: '🖼️', video: '🎥', text: '📝', screenshot: '📸' }

export default function AdminCases() {
  const [searchParams] = useSearchParams()
  const isPriority = searchParams.get('priority') === 'critical'

  const [cases, setCases]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState({ status: '', search: '' })
  const [sortField, setSortField] = useState('risk_score')
  const [sortDir, setSortDir]   = useState('desc')

  useEffect(() => {
    setLoading(true)
    getCases(isPriority ? { priority: 'critical' } : {}).then(data => {
      console.log('📦 Fetched Case Data from Blockchain:', data) // <-- Added for logging
      setCases(data)
      setLoading(false)
    })
  }, [isPriority])

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const filtered = cases
    .filter(c => {
      if (filter.status && c.status !== filter.status) return false
      if (filter.search && !c.case_id.toLowerCase().includes(filter.search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase()
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const SortIcon = ({ field }) => (
    <span className="ml-1 inline-block text-slate-400">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <AdminLayout
      title={isPriority ? 'High Priority Cases' : 'Case Queue'}
      breadcrumb={`Awaaz Authority Portal / ${isPriority ? 'High Priority' : 'Case Queue'}`}
    >
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          id="case-search"
          type="text"
          placeholder="Search Case ID..."
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 min-w-[180px]"
        />
        <select
          id="filter-status"
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-slate-500">
          {filtered.length} of {cases.length} cases
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📭" title="No cases found" desc="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <button onClick={() => handleSort('case_id')} className="flex items-center hover:text-slate-800">
                      Case ID <SortIcon field="case_id" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <button onClick={() => handleSort('status')} className="flex items-center hover:text-slate-800">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <button onClick={() => handleSort('risk_score')} className="flex items-center hover:text-slate-800">
                      Risk Score <SortIcon field="risk_score" />
                    </button>
                  </th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c, idx) => (
                  <tr
                    key={c.case_id}
                    className={`hover:bg-slate-50 transition-colors ${c.should_escalate ? 'bg-red-50/40' : idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {c.should_escalate && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" title="Escalation required" />
                        )}
                        <span className="font-mono text-xs font-bold text-slate-800">{c.case_id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-700 capitalize">{c.category?.replace('_',' ')}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td className="px-4 py-3.5 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className={THREAT_BADGE[c.threat_level]}>{c.threat_level}</span>
                        <RiskBar score={c.risk_score} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/admin/case/${c.case_id}`}
                        id={`case-review-${c.case_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                      >
                        Review
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
