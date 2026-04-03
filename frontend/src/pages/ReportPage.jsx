import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { submitReportPlain } from '../services/api'

// ── Helper: file → base64 ─────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Strip the "data:image/jpeg;base64," prefix — backend only wants raw base64
      const result = reader.result.split(',')[1]
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Submitting Overlay ────────────────────────────────────────────────────────
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
    const interval = setInterval(() => {
      setCurrent(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 900)
    return () => clearInterval(interval)
  })

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 mx-auto mb-6 relative">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full bg-amber-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-bold font-display mb-2 text-amber-400">Processing your report</h3>
      <p className="text-slate-400 text-sm mb-8">Please wait. Do not close this tab.</p>
      <div className="space-y-2 max-w-xs mx-auto">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-3 text-left transition-all duration-300 ${i <= current ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
              i < current ? 'bg-green-500' : i === current ? 'bg-amber-500 animate-pulse' : 'bg-navy-700'
            }`}>
              {i < current && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </div>
            <span className={`text-xs ${i <= current ? 'text-slate-300' : 'text-slate-600'}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const [form, setForm] = useState({
    description: '',
    url: '',
    file: null,
    fileName: '',
    filePreview: null,
  })

  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setError('')
  }

  const handleFile = (file) => {
    if (!file) return
    updateField('file', file)
    updateField('fileName', file.name)
    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => updateField('filePreview', e.target.result)
      reader.readAsDataURL(file)
    } else {
      updateField('filePreview', null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Need at least one piece of evidence
    if (!form.description.trim() && !form.url.trim() && !form.file) {
      setError('Please provide at least one piece of evidence: a description, URL, or image.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Convert image to base64 if provided
      let imageBase64 = null
      if (form.file) {
        imageBase64 = await fileToBase64(form.file)
      }

      const result = await submitReportPlain({
        description: form.description.trim() || null,
        url: form.url.trim() || null,
        image: imageBase64,
      })

      // Save for tracking page
      localStorage.setItem(`case_${result.case_id}`, JSON.stringify({
        ...result,
        status: 'RECEIVED',
        submitted_at: new Date().toISOString(),
      }))
      localStorage.setItem('last_case_key', result.case_key)

      navigate('/success', { state: result })
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-mesh py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-slate-300">Secure · Anonymous · Blockchain-Anchored</span>
            </div>
            <h1 className="text-3xl font-black font-display mb-2">
              Submit a <span className="text-gradient-amber">Report</span>
            </h1>
            <p className="text-slate-400 text-sm">Your identity is never collected or stored.</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6 sm:p-8"
          >
            {submitting ? (
              <SubmittingOverlay />
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-xl font-bold font-display mb-1">Report Details</h2>
                <p className="text-slate-400 text-sm mb-8">
                  Fill in what you know. All fields are optional, but provide as much evidence as possible.
                </p>

                <div className="space-y-6">

                  {/* Description */}
                  <div>
                    <label htmlFor="description-input" className="block text-sm font-medium text-slate-300 mb-2">
                      Description <span className="text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      id="description-input"
                      className="textarea-field min-h-[120px] text-sm"
                      placeholder="Describe what you observed, when it happened, and any other relevant context..."
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label htmlFor="url-input" className="block text-sm font-medium text-slate-300 mb-2">
                      Target URL <span className="text-slate-500">(optional)</span>
                    </label>
                    <input
                      id="url-input"
                      type="url"
                      className="input-field text-sm"
                      placeholder="https://example.com/harmful-content"
                      value={form.url}
                      onChange={(e) => updateField('url', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      The domain will be used to detect repeat offenders.
                    </p>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Evidence Image / Screenshot <span className="text-slate-500">(optional)</span>
                    </label>

                    {!form.file ? (
                      <div
                        id="file-drop-zone"
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current.click()}
                        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                          dragOver
                            ? 'border-amber-400 bg-amber-500/10'
                            : 'border-navy-600 hover:border-navy-500 hover:bg-navy-800/50'
                        }`}
                      >
                        <div className="text-4xl mb-3">🖼️</div>
                        <p className="text-slate-300 font-medium text-sm mb-1">Drop image here, or click to browse</p>
                        <p className="text-xs text-slate-600">PNG, JPG, WEBP, GIF supported</p>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => handleFile(e.target.files[0])}
                        />
                      </div>
                    ) : (
                      <div className="card p-4 flex items-center gap-4">
                        {form.filePreview ? (
                          <img
                            src={form.filePreview}
                            alt="Preview"
                            className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-navy-600"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-navy-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                            📎
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 truncate text-sm">{form.fileName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Ready to upload</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { updateField('file', null); updateField('fileName', ''); updateField('filePreview', null) }}
                          className="p-2 rounded-lg hover:bg-navy-700 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Privacy Reminder */}
                  <div className="card p-4 border-amber-500/10 bg-amber-500/5">
                    <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                      </svg>
                      Privacy Reminder
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-400">
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />Do NOT include your name, contact details, or location</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />Do NOT include victim personal information</li>
                      <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />Focus on the harmful content, not on yourself</li>
                    </ul>
                  </div>

                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-sm text-red-400">{error}</span>
                  </motion.div>
                )}

                {/* Submit */}
                <div className="mt-8 pt-6 border-t border-navy-700 flex justify-end">
                  <button
                    id="submit-btn"
                    type="submit"
                    className="btn-primary text-sm px-8 py-3 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                    </svg>
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-slate-600 mt-6 px-4"
          >
            By submitting, you confirm this report is submitted in good faith.
            False reports may be subject to applicable laws.
          </motion.p>

        </div>
      </div>
    </Layout>
  )
}
