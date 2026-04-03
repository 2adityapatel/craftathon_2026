import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ShieldIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" 
      fill="url(#shieldGrad)" stroke="none"/>
    <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="shieldGrad" x1="3" y1="2" x2="21" y2="23.25" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fbbf24"/>
        <stop offset="100%" stopColor="#f59e0b"/>
      </linearGradient>
    </defs>
  </svg>
)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/track', label: 'Track Case' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-navy-900/95 backdrop-blur-xl border-b border-navy-700/60 shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-xl blur-lg group-hover:bg-amber-500/30 transition-all duration-300" />
              <div className="relative bg-navy-800 border border-amber-500/30 rounded-xl p-1.5">
                <ShieldIcon />
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-amber-400 font-display tracking-wide leading-tight">POCSO</p>
              <p className="text-xs text-slate-500 leading-tight">Secure Report</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.to
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link to="/report" id="nav-report-btn"
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
              <span>Report Now</span>
            </Link>

            {/* Mobile menu button */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
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
              className="md:hidden border-t border-navy-700 py-3 space-y-1"
            >
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700'
                  }`}
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
