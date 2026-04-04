import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getDashboardStats, getRecentCases } from '../services/adminApi'
import { THREAT_BADGE, STATUS_BADGE, STATUS_LABEL, RiskBar, Spinner, timeAgo } from '../components/AdminUtils'

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const STATUS_STEPS = ['RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'ESCALATED', 'ACTION_TAKEN', 'CLOSED']
const STATUS_COLORS = {
  RECEIVED: 'bg-slate-500', UNDER_REVIEW: 'bg-blue-600', VERIFIED: 'bg-teal-600',
  ESCALATED: 'bg-red-600', ACTION_TAKEN: 'bg-green-600', CLOSED: 'bg-gray-400',
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentCases(5)])
      .then(([s, cases]) => {
        setStats(s)
        setRecent(cases)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])


  if (loading) return (
    <AdminLayout title="Dashboard" breadcrumb="Awaaz Authority Portal / Dashboard">
      <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
    </AdminLayout>
  )

  const categoryData = stats?.byCategory ? Object.entries(stats.byCategory).sort((a,b) => b[1]-a[1]) : []
  const maxCat = categoryData[0]?.[1] || 1

  return (
    <AdminLayout title="Dashboard Overview" breadcrumb="Awaaz Authority Portal / Dashboard">
      {/* Alert banner for critical pending */}
      {stats.critical > 0 && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <div>
            <p className="text-sm font-semibold">{stats.critical} critical case{stats.critical > 1 ? 's' : ''} require immediate attention</p>
            <p className="text-xs mt-0.5">Risk score ≥ 80% — review and escalate if required.</p>
          </div>
          <Link to="/admin/cases?priority=critical" className="ml-auto text-xs font-semibold text-red-700 hover:underline whitespace-nowrap">
            View Critical →
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Reports"
          value={stats.total}
          sub="All time"
          color="bg-slate-100"
          icon={<svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
        />
        <StatCard
          label="Pending Review"
          value={stats.pending}
          sub="Needs attention"
          color="bg-blue-50"
          icon={<svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
        <StatCard
          label="Critical Cases"
          value={stats.critical}
          sub="Risk score ≥ 80%"
          color="bg-red-50"
          icon={<svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          sub="Action taken / closed"
          color="bg-green-50"
          icon={<svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent cases table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Recent Cases (Top Priority)</h2>
            <Link to="/admin/cases" className="text-xs text-blue-700 hover:underline font-medium">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Case ID</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                  <th className="px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map(c => (
                  <tr key={c.case_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {c.should_escalate && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" title="Needs escalation" />
                        )}
                        <span className="font-mono text-xs font-semibold text-slate-800">{c.case_id}</span>
                      </div>
                      <span className="text-xs text-slate-400 capitalize">{c.category?.replace('_',' ')}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td className="px-3 py-3 min-w-[100px]">
                      <RiskBar score={c.risk_score} />
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-400 hidden sm:table-cell whitespace-nowrap">{timeAgo(c.submitted_at)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/case/${c.case_id}`}
                        className="text-xs text-blue-700 hover:underline font-medium whitespace-nowrap">
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: status breakdown + category */}
        <div className="space-y-5">
          {/* Status breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Status Breakdown</h2>
            <div className="space-y-2.5">
              {STATUS_STEPS.map(s => {
                const count = stats.byStatus?.[s] || 0
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={s}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">{STATUS_LABEL[s]}</span>
                      <span className="font-semibold text-slate-800">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${STATUS_COLORS[s]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">By Category</h2>
            <div className="space-y-2.5">
              {categoryData.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 capitalize">{cat.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-800">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.round((count / maxCat) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
