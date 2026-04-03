import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import { submitReport } from '../services/api'
import { encryptReport } from '../utils/crypto'

// ── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total, labels }) {
  return (
    <div className="flex items-center justify-between mb-10 relative">
      {/* Track line */}
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-navy-700 -z-10" />
      <div
        className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 -z-10 transition-all duration-500"
        style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
      />

      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const done = stepNum < current
        const active = stepNum === current
        return (
          <div key={stepNum} className="flex flex-col items-center gap-2 flex-1 first:items-start last:items-end">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
              done    ? 'bg-amber-500 border-amber-500 text-navy-900'
              : active ? 'bg-navy-900 border-amber-500 text-amber-400 shadow-amber-glow'
              :          'bg-navy-800 border-navy-600 text-slate-600'
            }`}>
              {done ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                </svg>
              ) : stepNum}
            </div>
            <span className={`text-xs hidden sm:block transition-colors ${
              active ? 'text-amber-400 font-medium' : done ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {labels[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Evidence Type Cards ───────────────────────────────────────────────────────
const evidenceTypes = [
  { id: 'url',        icon: '🔗', label: 'URL / Link',   desc: 'Report a website or social media link' },
  { id: 'image',      icon: '🖼️', label: 'Image',        desc: 'Upload a photo or screenshot' },
  { id: 'video',      icon: '🎥', label: 'Video',        desc: 'Upload a video clip' },
  { id: 'text',       icon: '📝', label: 'Text Message', desc: 'Paste messages or chat content' },
  { id: 'screenshot', icon: '📸', label: 'Screenshot',   desc: 'Upload a screen capture' },
]

// ── Step 1: Select Type ───────────────────────────────────────────────────────
function Step1({ data, onChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-display mb-2">What are you reporting?</h2>
      <p className="text-slate-400 text-sm mb-8">Select the type of evidence you have.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidenceTypes.map((ev) => (
          <button
            key={ev.id}
            id={`type-${ev.id}`}
            onClick={() => onChange('evidenceType', ev.id)}
            className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
              data.evidenceType === ev.id
                ? 'border-amber-500 bg-amber-500/10 shadow-amber-glow'
                : 'border-navy-600 bg-navy-800 hover:border-navy-500 hover:bg-navy-700'
            }`}
          >
            <div className="text-3xl mb-3">{ev.icon}</div>
            <div className={`font-semibold mb-1 transition-colors ${data.evidenceType === ev.id ? 'text-amber-400' : 'text-slate-200'}`}>
              {ev.label}
            </div>
            <div className="text-xs text-slate-500">{ev.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2: Upload Evidence ───────────────────────────────────────────────────
function Step2({ data, onChange }) {
  const fileRef = useRef()
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    onChange('file', file)
    onChange('fileName', file.name)
    onChange('fileSize', (file.size / 1024).toFixed(1) + ' KB')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  if (data.evidenceType === 'url') {
    return (
      <div>
        <h2 className="text-2xl font-bold font-display mb-2">Enter the URL</h2>
        <p className="text-slate-400 text-sm mb-8">Paste the link to the harmful content.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">URL / Link</label>
            <input
              id="url-input"
              type="url"
              className="input-field text-base"
              placeholder="https://example.com/harmful-content"
              value={data.url || ''}
              onChange={(e) => onChange('url', e.target.value)}
            />
          </div>
          <div className="card p-4 flex items-start gap-3 border-blue-500/20 bg-blue-500/5">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-blue-300">
              We will analyze the URL's content and check if it has been reported before. The URL itself is encrypted before being sent.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (data.evidenceType === 'text') {
    return (
      <div>
        <h2 className="text-2xl font-bold font-display mb-2">Paste the text</h2>
        <p className="text-slate-400 text-sm mb-8">Copy and paste the harmful messages or content.</p>
        <textarea
          id="text-input"
          className="textarea-field min-h-[200px] text-sm"
          placeholder="Paste the content here..."
          value={data.textContent || ''}
          onChange={(e) => onChange('textContent', e.target.value)}
          rows={8}
        />
      </div>
    )
  }

  // File upload (image, video, screenshot)
  const accepts = data.evidenceType === 'video' ? 'video/*' : 'image/*'
  const label = data.evidenceType === 'video' ? 'video' : 'image'

  return (
    <div>
      <h2 className="text-2xl font-bold font-display mb-2">Upload {label}</h2>
      <p className="text-slate-400 text-sm mb-6">
        We automatically strip GPS and device metadata from your file before encryption.
      </p>

      {!data.file ? (
        <div
          id="file-drop-zone"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-amber-400 bg-amber-500/10'
              : 'border-navy-600 hover:border-navy-500 hover:bg-navy-800/50'
          }`}
        >
          <div className="text-5xl mb-4">{data.evidenceType === 'video' ? '🎥' : '🖼️'}</div>
          <p className="text-slate-300 font-medium mb-2">Drop your file here, or click to browse</p>
          <p className="text-xs text-slate-600">EXIF metadata will be automatically stripped</p>
          <input
            ref={fileRef}
            type="file"
            accept={accepts}
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            ✅
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 truncate">{data.fileName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{data.fileSize} • Metadata will be stripped</p>
          </div>
          <button
            onClick={() => { onChange('file', null); onChange('fileName', ''); onChange('fileSize', '') }}
            className="p-2 rounded-lg hover:bg-navy-700 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 3: Description ─────────────────────────────────────────────────────────
function Step3({ data, onChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold font-display mb-2">Add context</h2>
      <p className="text-slate-400 text-sm mb-8">
        Provide any additional context that helps our AI and the reviewing authority understand the report. This is optional.
      </p>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            id="description-input"
            className="textarea-field min-h-[140px] text-sm"
            placeholder="Describe what you observed, when (approximate date/time), and any other relevant details..."
            value={data.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={5}
          />
        </div>

        <div className="card p-5 border-amber-500/10 bg-amber-500/5">
          <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            Privacy Reminder
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
              Do NOT include your name, contact details, or location
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
              Do NOT include victim personal information
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
              Focus on the harmful content, not on yourself
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Encrypt & Review ─────────────────────────────────────────────────
function Step4({ data }) {
  const evidenceLabel = evidenceTypes.find(e => e.id === data.evidenceType)?.label || data.evidenceType

  return (
    <div>
      <h2 className="text-2xl font-bold font-display mb-2">Review & Encrypt</h2>
      <p className="text-slate-400 text-sm mb-8">
        Your evidence will be encrypted in your browser before submission. Review the details below.
      </p>

      <div className="space-y-4 mb-8">
        {/* Report summary card */}
        <div className="card p-5 divide-y divide-navy-700">
          <div className="flex justify-between py-3 first:pt-0">
            <span className="text-sm text-slate-500">Evidence Type</span>
            <span className="text-sm font-medium text-slate-200">{evidenceLabel}</span>
          </div>
          {data.url && (
            <div className="flex justify-between py-3 gap-4">
              <span className="text-sm text-slate-500 flex-shrink-0">URL</span>
              <span className="text-sm font-mono text-slate-300 truncate">{data.url}</span>
            </div>
          )}
          {data.fileName && (
            <div className="flex justify-between py-3">
              <span className="text-sm text-slate-500">File</span>
              <span className="text-sm text-slate-300 truncate max-w-[60%]">{data.fileName}</span>
            </div>
          )}
          {data.textContent && (
            <div className="flex justify-between py-3 gap-4">
              <span className="text-sm text-slate-500 flex-shrink-0">Text</span>
              <span className="text-sm text-slate-300 truncate">{data.textContent.substring(0, 60)}...</span>
            </div>
          )}
          {data.description && (
            <div className="flex justify-between py-3">
              <span className="text-sm text-slate-500">Description</span>
              <span className="text-sm text-slate-300 truncate max-w-[60%]">{data.description.substring(0, 60)}</span>
            </div>
          )}
        </div>

        {/* Encryption steps */}
        <div className="card p-5">
          <h4 className="text-sm font-semibold text-slate-300 mb-4">What happens when you submit:</h4>
          <div className="space-y-3">
            {[
              { icon: '🔐', text: 'EXIF metadata stripped from your file' },
              { icon: '🔑', text: 'AES-256 encryption key generated in your browser' },
              { icon: '📦', text: 'Evidence encrypted before leaving your device' },
              { icon: '🔗', text: 'SHA-256 hash computed for tamper detection' },
              { icon: '⛓️', text: 'Hash anchored on Polygon blockchain' },
              { icon: '🤖', text: 'AI triage assigns urgency score' },
            ].map((s) => (
              <div key={s.text} className="flex items-center gap-3">
                <span className="text-base">{s.icon}</span>
                <span className="text-xs text-slate-400">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Submitting ───────────────────────────────────────────────────────
function SubmittingOverlay() {
  const steps = [
    'Stripping metadata...',
    'Encrypting evidence...',
    'Running AI triage...',
    'Anchoring to blockchain...',
    'Finalizing submission...',
  ]
  const [current, setCurrent] = useState(0)

  useState(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 700)
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
      <h3 className="text-xl font-bold font-display mb-2 text-amber-400">Securing your report</h3>
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

// ── Main Report Page ─────────────────────────────────────────────────────────
const STEPS = ['Type', 'Evidence', 'Context', 'Review']

export default function ReportPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    evidenceType: '',
    url: '',
    file: null,
    fileName: '',
    fileSize: '',
    textContent: '',
    description: '',
  })

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    setError('')
  }

  const canProceed = () => {
    if (step === 1) return !!formData.evidenceType
    if (step === 2) {
      if (formData.evidenceType === 'url') return !!formData.url.trim()
      if (formData.evidenceType === 'text') return !!formData.textContent.trim()
      return !!formData.file
    }
    return true
  }

  const handleNext = () => {
    if (!canProceed()) {
      setError(step === 1 ? 'Please select an evidence type.' : 'Please provide the required evidence.')
      return
    }
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // Step 1: Encrypt the evidence in-browser (Layer 1 Privacy)
      const encryptedData = await encryptReport(formData)
      
      // Step 2: Submit to backend
      const result = await submitReport(encryptedData)
      
      // Save to localStorage for tracking
      localStorage.setItem(`case_${result.case_id}`, JSON.stringify({
        ...result,
        status: 'RECEIVED',
        evidence_type: formData.evidenceType,
        submitted_at: new Date().toISOString(),
      }))
      localStorage.setItem('last_case_key', result.case_key)
      navigate('/success', { state: result })
    } catch (err) {
      console.error('Submission Error:', err)
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
              <span className="text-xs text-slate-300">Secure — Anonymous — Encrypted</span>
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
              <>
                <StepIndicator current={step} total={4} labels={STEPS} />

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {step === 1 && <Step1 data={formData} onChange={updateField} />}
                    {step === 2 && <Step2 data={formData} onChange={updateField} />}
                    {step === 3 && <Step3 data={formData} onChange={updateField} />}
                    {step === 4 && <Step4 data={formData} />}
                  </motion.div>
                </AnimatePresence>

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

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-navy-700">
                  <button
                    id="back-btn"
                    onClick={() => step > 1 ? setStep(s => s - 1) : null}
                    disabled={step === 1}
                    className={`btn-secondary text-sm px-5 py-2.5 ${step === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    ← Back
                  </button>

                  {step < 4 ? (
                    <button id="next-btn" onClick={handleNext} className="btn-primary text-sm px-6 py-2.5">
                      Continue →
                    </button>
                  ) : (
                    <button id="submit-btn" onClick={handleSubmit} className="btn-primary text-sm px-8 py-2.5 flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                      </svg>
                      Submit Securely
                    </button>
                  )}
                </div>
              </>
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
