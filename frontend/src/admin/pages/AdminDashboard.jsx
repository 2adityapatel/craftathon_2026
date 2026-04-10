import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getDashboardStats, getRecentCases } from '../services/adminApi'
import { THREAT_BADGE, STATUS_BADGE, STATUS_LABEL, RiskBar, Spinner, timeAgo } from '../components/AdminUtils'

const STATUS_STEPS = ['RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'ESCALATED', 'ACTION_TAKEN', 'CLOSED']
const STATUS_BAR_COLOR = {
  RECEIVED: 'var(--outline)', UNDER_REVIEW: 'var(--primary)', VERIFIED: 'var(--secondary)',
  ESCALATED: 'var(--tertiary)', ACTION_TAKEN: 'var(--secondary)', CLOSED: 'var(--outline-variant)',
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{ width: 38, height: 38, background: `rgba(${accent},0.1)`, border: `1px solid rgba(${accent},0.2)`, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.5rem', color: 'var(--on-surface)', lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>{label}</p>
        {sub && <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  )
}

const TH = ({ children, onClick }) => (
  <th onClick={onClick} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', background: 'var(--surface-highest)', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
    {children}
  </th>
)

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    Promise.all([getDashboardStats(), getRecentCases(5)])
      .then(([s, cases]) => { setStats(s); setRecent(cases); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return (
    <AdminLayout title="Dashboard" breadcrumb="Awaaz Authority Portal / Dashboard">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Spinner size="lg" /></div>
    </AdminLayout>
  )

  const categoryData = stats?.byCategory ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]) : []
  const maxCat = categoryData[0]?.[1] || 1

  return (
    <AdminLayout title="Dashboard Overview" breadcrumb="Awaaz Authority Portal / Dashboard">
      {/* Critical alert */}
      {stats.critical > 0 && (
        <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,113,98,0.07)', border: '1px solid rgba(255,113,98,0.2)', borderRadius: '4px', padding: '12px 16px', borderLeft: '3px solid var(--tertiary)' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--tertiary)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--tertiary)' }}>{stats.critical} critical case{stats.critical > 1 ? 's' : ''} require immediate attention</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>Risk score ≥ 80% — review and escalate if required.</p>
          </div>
          <Link to="/admin/cases?priority=critical"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--tertiary)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            View Critical →
          </Link>
        </div>
      )}

      {/* Stats — Bento row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, marginBottom: 2 }}>
        <StatCard label="Total Reports" value={stats.total} sub="All time" accent="159,172,193"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--on-surface-variant)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
        <StatCard label="Pending Review" value={stats.pending} sub="Needs attention" accent="255,186,59"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Critical Cases" value={stats.critical} sub="Risk ≥ 80%" accent="255,113,98"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--tertiary)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>} />
        <StatCard label="Resolved" value={stats.resolved} sub="Action taken / closed" accent="33,179,117"
          icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--secondary)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Bottom: table + charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 2, marginTop: 2 }}>

        {/* Recent cases table */}
        <div style={{ background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--outline-variant)' }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)' }}>Recent Cases</h2>
            <Link to="/admin/cases" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>Case ID</TH>
                  <TH>Status</TH>
                  <TH>Risk</TH>
                  <TH>Submitted</TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {recent.map((c, i) => (
                  <tr key={c.case_id} style={{ borderTop: '1px solid var(--outline-variant)', background: c.should_escalate ? 'rgba(255,113,98,0.04)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.should_escalate && <span className="dot-warn" />}
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface)' }}>{c.case_id}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--outline)', textTransform: 'capitalize' }}>{c.category?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}><span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span></td>
                    <td style={{ padding: '10px 14px', minWidth: 120 }}><RiskBar score={c.risk_score} /></td>
                    <td style={{ padding: '10px 14px', fontSize: '0.7rem', color: 'var(--outline)', whiteSpace: 'nowrap' }}>{timeAgo(c.submitted_at)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <Link to={`/admin/case/${c.case_id}`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>Review →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: breakdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Status breakdown */}
          <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem' }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.8125rem', color: 'var(--on-surface)', marginBottom: '1rem' }}>Status Breakdown</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STATUS_STEPS.map(s => {
                const count = stats.byStatus?.[s] || 0
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={s}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>{STATUS_LABEL[s]}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', fontWeight: 600, color: 'var(--on-surface)' }}>{count}</span>
                    </div>
                    <div style={{ height: 3, background: 'var(--surface-highest)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '2px', background: STATUS_BAR_COLOR[s], width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '1.25rem' }}>
            <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.8125rem', color: 'var(--on-surface)', marginBottom: '1rem' }}>By Category</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {categoryData.map(([cat, count]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', fontWeight: 600, color: 'var(--on-surface)' }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--surface-highest)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: 'var(--primary)', width: `${Math.round((count / maxCat) * 100)}%`, transition: 'width 0.6s ease' }} />
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
