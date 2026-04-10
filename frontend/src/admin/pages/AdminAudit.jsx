import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { getAuditLog } from '../services/adminApi'
import { STATUS_BADGE, STATUS_LABEL, Spinner, EmptyState, formatDate } from '../components/AdminUtils'

const EVENT_CONFIG = {
  ReportSubmitted: { label: 'Report Submitted', chipClass: 'chip-confirmed' },
  StatusUpdated:   { label: 'Status Updated',   chipClass: 'chip-warning' },
}

const TH = ({ children }) => (
  <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', background: 'var(--surface-highest)', whiteSpace: 'nowrap' }}>
    {children}
  </th>
)

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
    try { await navigator.clipboard.writeText(tx); setCopied(id); setTimeout(() => setCopied(null), 2000) }
    catch { /* ignore */ }
  }

  return (
    <AdminLayout title="Blockchain Audit Log" breadcrumb="Awaaz Authority Portal / Audit Log">

      {/* Info banner */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(33,179,117,0.06)', border: '1px solid rgba(33,179,117,0.18)', borderRadius: '4px', padding: '12px 16px', borderLeft: '3px solid var(--secondary)' }}>
        <span style={{ fontSize: '1.125rem', marginTop: 1 }}>⛓️</span>
        <div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.8125rem', color: 'var(--secondary)', marginBottom: 4 }}>Immutable Blockchain Audit Trail</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.55 }}>
            All status changes and submissions are permanently anchored on the Sepolia ETH testnet. No record can be deleted or altered.
          </p>
        </div>
      </div>

      {/* Search + count */}
      <div style={{ background: 'var(--surface)', borderRadius: '4px', padding: '12px 14px', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input id="audit-search" type="text" placeholder="Filter by Case ID or event type..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field" style={{ width: 'auto', minWidth: 240, padding: '7px 12px', fontSize: '0.8125rem' }} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot-live" />
          <span style={{ fontSize: '0.7rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace" }}>{filtered.length} events</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', borderRadius: '4px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📋" title="No audit events" desc="No events match your filter." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH>#</TH>
                  <TH>Event</TH>
                  <TH>Case ID</TH>
                  <TH>Status Change</TH>
                  <TH>Officer</TH>
                  <TH>Tx Hash</TH>
                  <TH>Timestamp</TH>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => {
                  const evCfg = EVENT_CONFIG[entry.event] || { label: entry.event, chipClass: 'chip-warning' }
                  return (
                    <tr key={entry.id}
                      style={{ borderTop: '1px solid var(--outline-variant)', background: idx % 2 === 1 ? 'rgba(26,38,55,0.3)' : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-high)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(26,38,55,0.3)' : 'transparent'}
                    >
                      {/* Index */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.6875rem', color: 'var(--outline)' }}>{String(entry.id).padStart(4, '0')}</span>
                      </td>

                      {/* Event */}
                      <td style={{ padding: '10px 14px' }}>
                        <span className={evCfg.chipClass}>{evCfg.label}</span>
                      </td>

                      {/* Case ID */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.75rem', fontWeight: 700, color: 'var(--on-surface)' }}>{entry.case_id}</span>
                      </td>

                      {/* Status change */}
                      <td style={{ padding: '10px 14px' }}>
                        {entry.old_status ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className={STATUS_BADGE[entry.old_status]}>{STATUS_LABEL[entry.old_status]}</span>
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="var(--outline)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            <span className={STATUS_BADGE[entry.new_status]}>{STATUS_LABEL[entry.new_status]}</span>
                          </div>
                        ) : (
                          <span className={STATUS_BADGE[entry.new_status]}>{STATUS_LABEL[entry.new_status]}</span>
                        )}
                      </td>

                      {/* Officer */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{entry.admin}</span>
                      </td>

                      {/* Tx hash */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {(!entry.tx || entry.tx === 'pending' || entry.tx.startsWith('chain_error') || entry.tx === '—') ? (
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', color: 'var(--outline)' }}>{entry.tx || '—'}</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.7rem', color: 'var(--secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{entry.tx}</span>
                              <a href={`https://sepolia.etherscan.io/tx/${entry.tx}`} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.6rem', fontWeight: 700, color: 'var(--secondary)', textDecoration: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Explorer
                                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              </a>
                            </div>
                          )}
                          <button id={`copy-tx-${entry.id}`} onClick={() => copyTx(entry.tx, entry.id)} title="Copy Tx Hash"
                            style={{ background: 'none', border: 'none', color: copied === entry.id ? 'var(--secondary)' : 'var(--outline)', cursor: 'pointer', flexShrink: 0, padding: 2 }}>
                            {copied === entry.id
                              ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              : <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            }
                          </button>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '10px 14px', fontSize: '0.7rem', color: 'var(--outline)', whiteSpace: 'nowrap' }}>
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
          <div style={{ borderTop: '1px solid var(--outline-variant)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace" }}>All events immutably stored on Sepolia ETH</span>
            <button style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Export CSV</button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
