import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
      fill="url(#sg)" />
    <path d="M9 12l2 2 4-4" stroke="#573b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="sg" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffba3b" />
        <stop offset="100%" stopColor="#f4ab04" />
      </linearGradient>
    </defs>
  </svg>
)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { t, lang, toggleLanguage } = useLanguage()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const navLinks = [
    { to: '/', label: t('footer.home') },
    { to: '/track', label: t('nav.track') },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'all 0.3s ease',
        backgroundColor: scrolled ? 'rgba(14,20,28,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(60,73,91,0.4)' : '1px solid transparent',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: 34, height: 34,
              background: 'var(--surface)',
              border: '1px solid rgba(255,186,59,0.25)',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldIcon />
            </div>
            <div>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', letterSpacing: '0.08em', lineHeight: 1.2 }}>AWAAZ</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)', lineHeight: 1.2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Secure Report</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  padding: '6px 14px',
                  borderRadius: '2px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  color: isActive(link.to) ? 'var(--primary)' : 'var(--on-surface-variant)',
                  background: isActive(link.to) ? 'rgba(255,186,59,0.08)' : 'transparent',
                  letterSpacing: '0.02em',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              style={{
                padding: '5px 10px',
                border: '1px solid var(--outline-variant)',
                borderRadius: '2px',
                background: 'var(--surface)',
                color: 'var(--on-surface-variant)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
              }}
            >
              {lang === 'en' ? 'हि' : 'EN'}
            </button>

            {/* Report CTA */}
            <Link to="/report" id="nav-report-btn" className="btn-primary" style={{ gap: 6, padding: '7px 16px', fontSize: '0.8125rem' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('nav.report')}
            </Link>

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden"
              style={{
                padding: 8, border: '1px solid var(--outline-variant)', borderRadius: '2px',
                background: 'var(--surface)', color: 'var(--on-surface-variant)', cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                borderTop: '1px solid var(--outline-variant)',
                padding: '8px 0',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
              className="md:hidden"
            >
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    borderRadius: '2px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    color: isActive(link.to) ? 'var(--primary)' : 'var(--on-surface-variant)',
                    background: isActive(link.to) ? 'rgba(255,186,59,0.08)' : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
