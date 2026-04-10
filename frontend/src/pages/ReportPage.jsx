import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { submitReportPlain } from '../services/api'
import { useLanguage } from '../context/LanguageContext'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function SubmittingOverlay() {
  const steps = [
    'Uploading evidence to IPFS...',
    'Running AI triage analysis...',
    'Saving to secure database...',
    'Anchoring hash on Sepolia blockchain...',
    'Finalizing your case ID...',
  ]
  const [current, setCurrent] = useState(0)
  useState(() => {
    const interval = setInterval(() => setCurrent(prev => (prev < steps.length - 1 ? prev + 1 : prev)), 900)
    return () => clearInterval(interval)
  })
  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <div style={{ width: 64, height: 64, margin: '0 auto 1.25rem', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1.1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'rgba(255,186,59,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
          </svg>
        </div>
      </div>
      <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.0625rem', color: 'var(--primary)', marginBottom: 6 }}>Processing your report</h3>
      <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.8125rem', marginBottom: '1.75rem' }}>Do not close this tab.</p>
      <div style={{ maxWidth: 280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i <= current ? 1 : 0.25, transition: 'opacity 0.3s' }}>
            <div style={{ width: 14, height: 14, borderRadius: '2px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < current ? 'var(--secondary)' : i === current ? 'var(--primary)' : 'var(--surface-high)', transition: 'background 0.3s' }}>
              {i < current && <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="#000" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span style={{ fontSize: '0.75rem', color: i <= current ? 'var(--on-surface)' : 'var(--outline)' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ReportPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState({ description: '', url: '', file: null, fileName: '', filePreview: null })

  const updateField = (key, value) => { setForm(prev => ({ ...prev, [key]: value })); setError('') }

  const handleFile = (file) => {
    if (!file) return
    updateField('file', file)
    updateField('fileName', file.name)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => updateField('filePreview', e.target.result)
      reader.readAsDataURL(file)
    } else updateField('filePreview', null)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim() && !form.url.trim() && !form.file) {
      setError('Please provide at least one piece of evidence: a description, URL, or image.')
      return
    }
    setSubmitting(true); setError('')
    try {
      let imageBase64 = null
      if (form.file) imageBase64 = await fileToBase64(form.file)
      const result = await submitReportPlain({ description: form.description.trim() || null, url: form.url.trim() || null, image: imageBase64 })
      localStorage.setItem(`case_${result.case_id}`, JSON.stringify({ ...result, status: 'RECEIVED', submitted_at: new Date().toISOString() }))
      localStorage.setItem('last_case_key', result.case_key)
      navigate('/success', { state: result })
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  const S = { // inline style helpers
    label: { display: 'block', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 8 },
    sectionDivider: { marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--outline-variant)' },
  }

  return (
    <Layout>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '6rem 1.5rem 3rem', backgroundImage: 'linear-gradient(rgba(60,73,91,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(60,73,91,0.1) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="chip-confirmed" style={{ display: 'inline-flex', marginBottom: 16 }}>
              <span className="dot-live" />Secure Gateway Active
            </span>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 'clamp(1.75rem,4vw,2.25rem)', color: 'var(--on-surface)', marginBottom: 10, letterSpacing: '-0.02em' }}>
              {t('reportContext.pageTitle')}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{t('reportContext.privacyDisclaimer')}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'rgba(26,38,55,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,186,59,0.1)', borderRadius: '4px', padding: '2rem', boxShadow: '0px 24px 48px rgba(0,0,0,0.5)' }}>
            {submitting ? <SubmittingOverlay /> : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '1rem', color: 'var(--on-surface)', marginBottom: 6 }}>Report Details</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem' }}>Fill in what you know. All fields are optional — provide as much evidence as possible.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Description */}
                  <div>
                    <label htmlFor="description-input" style={S.label}>{t('reportContext.descTitle')}</label>
                    <textarea id="description-input" className="textarea-field" style={{ minHeight: 110 }}
                      placeholder={t('reportContext.descPlaceholder')} value={form.description}
                      onChange={(e) => updateField('description', e.target.value)} rows={4} />
                  </div>

                  {/* URL */}
                  <div>
                    <label htmlFor="url-input" style={S.label}>{t('reportContext.urlTitle')}</label>
                    <input id="url-input" type="url" className="input-field"
                      placeholder={t('reportContext.urlPlaceholder')} value={form.url}
                      onChange={(e) => updateField('url', e.target.value)} />
                    <p style={{ fontSize: '0.7rem', color: 'var(--outline)', marginTop: 6 }}>Domain used to detect repeat offenders.</p>
                  </div>

                  {/* File */}
                  <div>
                    <label style={S.label}>{t('reportContext.fileTitle')}</label>
                    {!form.file ? (
                      <div id="file-drop-zone"
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current.click()}
                        style={{ border: `1px dashed ${dragOver ? 'var(--primary)' : 'var(--outline-variant)'}`, borderRadius: '4px', padding: '2.25rem 1.5rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(255,186,59,0.05)' : 'rgba(0,0,0,0.25)', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '1.75rem', marginBottom: 10 }}>🖼️</div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--on-surface)', fontWeight: 500, marginBottom: 4 }}>{t('reportContext.fileLabel')}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>{t('reportContext.fileMimes')}</p>
                        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
                      </div>
                    ) : (
                      <div style={{ background: 'var(--surface-high)', borderRadius: '4px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--outline-variant)' }}>
                        {form.filePreview
                          ? <img src={form.filePreview} alt="Preview" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                          : <div style={{ width: 48, height: 48, background: 'var(--surface)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>📎</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.fileName}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>{t('reportContext.selected')}</p>
                        </div>
                        <button type="button"
                          onClick={() => { updateField('file', null); updateField('fileName', ''); updateField('filePreview', null) }}
                          style={{ padding: 6, background: 'transparent', border: 'none', color: 'var(--outline)', cursor: 'pointer' }}>
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Privacy reminder */}
                  <div style={{ background: 'var(--surface-highest)', borderRadius: '4px', padding: '14px 16px', border: '1px solid rgba(255,186,59,0.08)' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Privacy Reminder
                    </h4>
                    {['Do NOT include your name, contact details, or location', 'Do NOT include victim personal information', 'Focus on the harmful content, not on yourself'].map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.5, marginTop: 6 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 7 }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ marginTop: '1rem', padding: '10px 14px', borderRadius: '4px', background: 'rgba(255,113,98,0.08)', border: '1px solid rgba(255,113,98,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--tertiary)" strokeWidth={2} style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--tertiary)' }}>{error}</span>
                  </motion.div>
                )}

                <div style={S.sectionDivider}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button id="submit-btn" type="submit" className="btn-primary" style={{ gap: 8, padding: '10px 28px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" /></svg>
                      {submitting ? t('reportContext.submitting') : t('reportContext.submitBtn')}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--outline)', marginTop: '1.5rem' }}>
            By submitting, you confirm this report is submitted in good faith. False reports may be subject to applicable laws.
          </motion.p>
        </div>
      </div>
    </Layout>
  )
}
