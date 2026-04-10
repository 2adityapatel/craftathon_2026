import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { getRepeatOffenders } from '../services/adminApi'
import { STATUS_BADGE, STATUS_LABEL, Spinner, EmptyState, formatDate } from '../components/AdminUtils'

export default function AdminDomains() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRepeatOffenders().then(d => { setDomains(d); setLoading(false) })
  }, [])

  const getSeverityColor = (count) =>
    count >= 6 ? 'var(--tertiary)' : count >= 4 ? 'var(--primary)' : 'var(--primary-dim)'

  return (
    <AdminLayout title="Repeat Offenders" breadcrumb="Awaaz Authority Portal / Repeat Offenders">

      {/* Info banner */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,186,59,0.05)', border: '1px solid rgba(255,186,59,0.15)', borderRadius: '4px', padding: '12px 16px', borderLeft: '3px solid var(--primary)' }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary)', marginBottom: 4 }}>Repeat Offender Domains</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.55 }}>
            Domains reported 3 or more times. These indicate persistent abusers and should be prioritised for ISP notification and legal action.
          </p>
        </div>
      </div>

      {/* Phase 2 overlay wrapper */}
      <div style={{ position: 'relative' }}>

        {/* Coming soon overlay */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5rem', background: 'rgba(10,14,20,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', borderRadius: '4px' }}>
          <div style={{ background: 'rgba(26,38,55,0.95)', border: '1px solid rgba(255,186,59,0.2)', borderRadius: '4px', padding: '2rem 2.5rem', textAlign: 'center', maxWidth: 360, backdropFilter: 'blur(16px)' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,186,59,0.08)', border: '1px solid rgba(255,186,59,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem', color: 'var(--on-surface)', marginBottom: 8, letterSpacing: '-0.01em' }}>Syndication Dashboard</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Automated ISP notification streams and centralized domain-blocking syndication are currently under development.
            </p>
            <span className="chip-warning" style={{ letterSpacing: '0.08em' }}>Coming in Phase 2</span>
          </div>
        </div>

        {/* Blurred underlying content */}
        <div style={{ opacity: 0.25, pointerEvents: 'none', userSelect: 'none', filter: 'blur(2px)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Spinner size="lg" /></div>
          ) : domains.length === 0 ? (
            <EmptyState icon="✅" title="No repeat offenders" desc="No domains have been reported 3 or more times." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {domains.map((d, idx) => (
                <div key={d.domain} style={{ background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--outline-variant)' }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'var(--surface-high)', borderBottom: '1px solid var(--outline-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '2px', background: getSeverityColor(d.count), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '0.75rem', color: '#000' }}>#{idx + 1}</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '0.875rem', color: 'var(--on-surface)' }}>{d.domain}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: 2 }}>Last reported: {formatDate(d.last_seen)}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.5rem', color: getSeverityColor(d.count), lineHeight: 1 }}>{d.count}</p>
                        <p style={{ fontSize: '0.6rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>reports</p>
                      </div>
                      <span className={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Categories:</span>
                      {d.categories.map(cat => (
                        <span key={cat} className="chip-warning" style={{ textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 180 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--outline)', whiteSpace: 'nowrap' }}>Severity</span>
                      <div style={{ flex: 1, height: 3, background: 'var(--surface-highest)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '2px', background: getSeverityColor(d.count), width: `${Math.min((d.count / 10) * 100, 100)}%` }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button tabIndex={-1} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 5 }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Notify ISP
                      </button>
                      <button tabIndex={-1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', gap: 5, borderColor: 'rgba(255,113,98,0.3)', color: 'var(--tertiary)' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Request Block
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary footer */}
              {domains.length > 0 && (
                <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 20, fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
                    <span><strong style={{ color: 'var(--on-surface)' }}>{domains.length}</strong> repeat offender domains</span>
                    <span><strong style={{ color: 'var(--on-surface)' }}>{domains.reduce((s, d) => s + d.count, 0)}</strong> total reports</span>
                  </div>
                  <button tabIndex={-1} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.75rem', gap: 6 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
