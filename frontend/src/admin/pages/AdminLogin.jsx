import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) navigate('/admin', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', backgroundImage: 'linear-gradient(rgba(60,73,91,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(60,73,91,0.1) 1px,transparent 1px)', backgroundSize: '32px 32px', display: 'flex', flexDirection: 'column' }}>

      {/* Gov header scan bar */}
      <div style={{ background: 'var(--surface-low)', borderBottom: '1px solid var(--outline-variant)', padding: '10px 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, background: 'rgba(255,186,59,0.1)', border: '1px solid rgba(255,186,59,0.25)', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="url(#lg)" />
              <defs><linearGradient id="lg" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ffba3b" /><stop offset="100%" stopColor="#f4ab04" /></linearGradient></defs>
            </svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.7rem', color: 'var(--on-surface-variant)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Government of India — Cyber Crime Cell
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot-live" />
          <span style={{ fontSize: '0.675rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace" }}>TLS-1.3 Secured</span>
        </div>
      </div>

      {/* Login panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Icon + title */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,186,59,0.08)', border: '1px solid rgba(255,186,59,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }} className="animate-float">
              <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="url(#lsh)" />
                <path d="M9 12l2 2 4-4" stroke="#573b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs><linearGradient id="lsh" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ffba3b" /><stop offset="100%" stopColor="#f4ab04" /></linearGradient></defs>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.25rem', color: 'var(--on-surface)', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Awaaz Authority Portal
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Restricted access — Authorized personnel only</p>
          </div>

          {/* Card */}
          <div style={{ background: 'rgba(26,38,55,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,186,59,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            {/* Card header */}
            <div style={{ padding: '14px 20px', background: 'var(--surface-highest)', borderBottom: '1px solid var(--outline-variant)' }}>
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.8125rem', color: 'var(--on-surface)' }}>Officer Sign In</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--on-surface-variant)', marginTop: 2 }}>Enter your credentials to access the dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label htmlFor="admin-username" style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
                    Username / Officer ID
                  </label>
                  <input id="admin-username" type="text" autoComplete="username" required value={username}
                    onChange={e => setUsername(e.target.value)} className="input-field"
                    placeholder="Enter your username" />
                </div>

                <div>
                  <label htmlFor="admin-password" style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input id="admin-password" type={showPass ? 'text' : 'password'} autoComplete="current-password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="input-field" style={{ paddingRight: '2.5rem' }}
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--outline)', cursor: 'pointer', padding: 2 }}>
                      {showPass
                        ? <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: '10px 12px', borderRadius: '4px', background: 'rgba(255,113,98,0.08)', border: '1px solid rgba(255,113,98,0.2)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--tertiary)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p style={{ fontSize: '0.8rem', color: 'var(--tertiary)' }}>{error}</p>
                  </div>
                )}

                <button id="admin-login-btn" type="submit" disabled={loading} className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', gap: 8, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
                  {loading ? (
                    <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(87,59,0,0.3)', borderTopColor: 'var(--on-primary)', animation: 'spin 1s linear infinite' }} />Authenticating...</>
                  ) : (
                    <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>Sign In to Dashboard</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Demo hint */}
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(33,179,117,0.05)', border: '1px solid rgba(33,179,117,0.15)', borderRadius: '4px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: 4 }}>🧪 Demo credentials</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', fontFamily: "'JetBrains Mono',monospace" }}>admin / admin123</p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.675rem', color: 'var(--outline)', marginTop: '1.25rem', lineHeight: 1.5 }}>
            Unauthorised access is prohibited and punishable under the IT Act, 2000.
          </p>
        </div>
      </div>
    </div>
  )
}
