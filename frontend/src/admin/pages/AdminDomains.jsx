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

  return (
    <AdminLayout title="Repeat Offenders" breadcrumb="Awaaz Authority Portal / Repeat Offenders">

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-3 bg-purple-50 border border-purple-200 px-4 py-3 rounded-lg">
        <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        <div>
          <p className="text-sm font-semibold text-purple-900">Repeat Offender Domains</p>
          <p className="text-xs text-purple-700 mt-0.5">
            Domains reported 3 or more times. These indicate persistent abusers and should be prioritised for ISP notification and legal action.
          </p>
        </div>
      </div>

      <div className="relative mt-2">
        {/* Overlay Block */}
        <div className="absolute inset-x-0 inset-y-0 z-10 flex flex-col items-start justify-start pt-20 sm:items-center sm:pt-32 bg-white/40 backdrop-blur-[2px] rounded-xl">
          <div className="bg-white/90 px-6 py-5 rounded-2xl shadow-xl border border-slate-200/60 flex flex-col items-center text-center max-w-sm backdrop-blur-md">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3 shadow-sm border border-purple-200/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1.5 tracking-tight">Syndication Dashboard</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Automated ISP notification streams and centralized domain-blocking syndication are currently under development.
            </p>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/50 uppercase tracking-widest shadow-sm">
              Coming in Phase 2
            </span>
          </div>
        </div>

        {/* Blurred underlying mock content */}
        <div className="opacity-30 pointer-events-none select-none filter blur-[1.5px] transition-all duration-1000 grayscale">
          {loading ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : domains.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl">
              <EmptyState icon="✅" title="No repeat offenders" desc="No domains have been reported 3 or more times." />
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((d, idx) => (
                <div
                  key={d.domain}
                  className={`bg-white border rounded-xl overflow-hidden ${
                    d.count >= 6 ? 'border-red-200' : d.count >= 4 ? 'border-orange-200' : 'border-slate-200'
                  }`}
                >
                  {/* Header */}
                  <div className={`px-5 py-4 flex items-center justify-between gap-4 flex-wrap ${
                    d.count >= 6 ? 'bg-red-50' : d.count >= 4 ? 'bg-orange-50' : 'bg-slate-50'
                  } border-b ${d.count >= 6 ? 'border-red-100' : d.count >= 4 ? 'border-orange-100' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      {/* Rank bubble */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                        idx === 0 ? 'bg-red-600' : idx === 1 ? 'bg-orange-500' : 'bg-amber-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-mono font-bold text-slate-900 text-sm">{d.domain}</p>
                        <p className="text-xs text-slate-500">Last reported: {formatDate(d.last_seen)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${d.count >= 6 ? 'text-red-700' : d.count >= 4 ? 'text-orange-700' : 'text-amber-700'}`}>
                          {d.count}
                        </p>
                        <p className="text-xs text-slate-500">reports</p>
                      </div>
                      <span className={STATUS_BADGE[d.status]}>{STATUS_LABEL[d.status]}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categories:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {d.categories.map(cat => (
                          <span key={cat}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                            {cat.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Report count bar */}
                    <div className="flex items-center gap-3 min-w-[180px]">
                      <span className="text-xs text-slate-500 whitespace-nowrap">Severity</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${d.count >= 6 ? 'bg-red-500' : d.count >= 4 ? 'bg-orange-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min((d.count / 10) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex gap-2">
                      <button
                        tabIndex={-1}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        Notify ISP
                      </button>
                      <button
                        tabIndex={-1}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                        </svg>
                        Request Block
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary footer */}
          {!loading && domains.length > 0 && (
            <div className="mt-5 bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span><strong className="text-slate-900">{domains.length}</strong> repeat offender domains</span>
                <span><strong className="text-slate-900">{domains.reduce((s, d) => s + d.count, 0)}</strong> total reports</span>
              </div>
              <button tabIndex={-1} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Export Report
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
