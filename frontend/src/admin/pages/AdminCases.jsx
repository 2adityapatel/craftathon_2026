import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getCases } from '../services/adminApi'
import { THREAT_BADGE, STATUS_BADGE, STATUS_LABEL, RiskBar, Spinner, EmptyState, timeAgo, CATEGORY_LABEL } from '../components/AdminUtils'

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
      console.log('📦 Fetched Case Data from Blockchain:', data)
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
      if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase() }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
    })

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, color: sortField === field ? 'var(--primary)' : 'var(--outline)', fontSize: '0.625rem' }}>
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  )

  const TH = ({ children, onClick }) => (
    <th onClick={onClick} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', background: 'var(--surface-highest)', cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
      {children}
    </th>
  )

  return (
    <AdminLayout
      title={isPriority ? 'High Priority Cases' : 'Case Queue'}
      breadcrumb={`Awaaz Authority Portal / ${isPriority ? 'High Priority' : 'Case Queue'}`}
    >
      {/* Filters */}
      <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '12px 16px', marginBottom: 2, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <input id="case-search" type="text" placeholder="Search Case ID..."
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          className="input-field" style={{ width: 'auto', minWidth: 180, padding: '7px 12px', fontSize: '0.8125rem' }} />

        <select id="filter-status" value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="input-field"
          style={{ width: 'auto', padding: '7px 12px', fontSize: '0.8125rem', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace" }}>
          {filtered.length} / {cases.length} cases
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📭" title="No cases found" desc="Try adjusting your filters." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH onClick={() => handleSort('case_id')}>Case ID <SortIcon field="case_id" /></TH>
                  <TH>Category</TH>
                  <TH onClick={() => handleSort('status')}>Status <SortIcon field="status" /></TH>
                  <TH onClick={() => handleSort('risk_score')}>Risk Score <SortIcon field="risk_score" /></TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={c.case_id}
                    style={{ borderTop: '1px solid var(--outline-variant)', background: c.should_escalate ? 'rgba(255,113,98,0.04)' : idx % 2 === 1 ? 'rgba(26,38,55,0.3)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-high)'}
                    onMouseLeave={e => e.currentTarget.style.background = c.should_escalate ? 'rgba(255,113,98,0.04)' : idx % 2 === 1 ? 'rgba(26,38,55,0.3)' : 'transparent'}
                  >
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.should_escalate && <span className="dot-warn" title="Escalation required" />}
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface)' }}>{c.case_id}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', textTransform: 'capitalize' }}>{c.category?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td style={{ padding: '10px 14px', minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={THREAT_BADGE[c.threat_level]}>{c.threat_level}</span>
                        <RiskBar score={c.risk_score} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <Link to={`/admin/case/${c.case_id}`} id={`case-review-${c.case_id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
                        Review
                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
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
