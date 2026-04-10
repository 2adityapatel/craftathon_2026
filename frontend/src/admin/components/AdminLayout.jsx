import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  {
    to: '/admin', exact: true, label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/admin/cases', label: 'Case Queue',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/admin/cases?priority=critical', label: 'High Priority', badge: 'critical',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  {
    to: '/admin/domains', label: 'Repeat Offenders',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    to: '/admin/audit', label: 'Audit Log',
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
]

function SidebarLink({ item }) {
  const location = useLocation()
  let isActive = false
  if (item.exact) {
    isActive = location.pathname === item.to
  } else if (location.pathname.startsWith(item.to.split('?')[0]) && item.to !== '/admin') {
    const itemSearch = item.to.split('?')[1]
    if (itemSearch) isActive = location.search.includes(itemSearch)
    else isActive = !location.search.includes('priority=critical')
  }

  return (
    <NavLink
      to={item.to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: '2px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.15s',
        backgroundColor: isActive ? 'rgba(255,186,59,0.1)' : 'transparent',
        color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
        borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
      }}
    >
      <span style={{ flexShrink: 0, color: isActive ? 'var(--primary)' : 'var(--outline)' }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge === 'critical' && (
        <span style={{
          fontSize: '0.6rem', fontWeight: 700,
          background: 'var(--tertiary)', color: '#000',
          padding: '1px 5px', borderRadius: '2px', letterSpacing: '0.05em',
        }}>
          LIVE
        </span>
      )}
    </NavLink>
  )
}

// ── Sidebar content (shared between desktop rail and mobile overlay) ──────────
function SidebarContent({ user, onLogout }) {
  return (
    <>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px', borderBottom: '1px solid var(--outline-variant)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--surface)',
          border: '1px solid rgba(255,186,59,0.25)',
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="url(#als)" />
            <path d="M9 12l2 2 4-4" stroke="#573b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="als" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffba3b" />
                <stop offset="100%" stopColor="#f4ab04" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div>
          <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)', letterSpacing: '0.06em', lineHeight: 1.2 }}>AWAAZ</p>
          <p style={{ fontSize: '0.625rem', color: 'var(--outline)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>Authority Portal</p>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ padding: '0 6px', fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: '0.6rem', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6, flexShrink: 0 }}>
          Navigation
        </p>
        {NAV.map(item => <SidebarLink key={item.to} item={item} />)}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: '1px solid var(--outline-variant)', padding: '12px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30,
            background: 'rgba(255,186,59,0.1)',
            border: '1px solid rgba(255,186,59,0.25)',
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)' }}>
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username || 'Admin'}
            </p>
            <p style={{ fontSize: '0.675rem', color: 'var(--outline)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.department || 'Authority Officer'}
            </p>
          </div>
        </div>
        <button
          id="admin-logout-btn"
          onClick={onLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: '2px',
            border: '1px solid var(--outline-variant)',
            background: 'transparent', color: 'var(--outline)',
            fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--tertiary)'; e.currentTarget.style.borderColor = 'rgba(255,113,98,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--outline)'; e.currentTarget.style.borderColor = 'var(--outline-variant)' }}
        >
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function AdminLayout({ children, title, breadcrumb }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Track whether mobile drawer is open
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Track whether we're on a desktop breakpoint (≥ 1024px)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  // Close drawer on route change
  const location = useLocation()
  useEffect(() => { setDrawerOpen(false) }, [location.pathname, location.search])

  const handleLogout = () => { logout(); navigate('/admin/login', { replace: true }) }

  const SIDEBAR_WIDTH = 236

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ── DESKTOP SIDEBAR (always visible on lg+) ─────────────────── */}
      {isDesktop && (
        <aside style={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          height: '100vh',
          background: 'var(--surface-low)',
          borderRight: '1px solid var(--outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflowY: 'auto',
        }}>
          <SidebarContent user={user} onLogout={handleLogout} />
        </aside>
      )}

      {/* ── MOBILE DRAWER (fixed overlay, only on < 1024px) ─────────── */}
      {!isDesktop && (
        <>
          {/* Backdrop */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />
          )}
          {/* Drawer panel */}
          <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
            width: SIDEBAR_WIDTH,
            background: 'var(--surface-low)',
            borderRight: '1px solid var(--outline-variant)',
            display: 'flex', flexDirection: 'column',
            transform: drawerOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_WIDTH}px)`,
            transition: 'transform 0.3s ease',
          }}>
            <SidebarContent user={user} onLogout={handleLogout} />
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT AREA ────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          background: 'var(--surface-low)',
          borderBottom: '1px solid var(--outline-variant)',
          padding: '0 1.25rem',
          display: 'flex', alignItems: 'center', gap: 12,
          height: 52, flexShrink: 0,
        }}>
          {/* Mobile hamburger — only visible when NOT desktop */}
          {!isDesktop && (
            <button
              id="admin-menu-toggle"
              onClick={() => setDrawerOpen(o => !o)}
              style={{
                padding: 6,
                border: '1px solid var(--outline-variant)',
                borderRadius: '2px',
                background: 'transparent',
                color: 'var(--on-surface-variant)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Breadcrumb + page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {breadcrumb && (
              <p style={{ fontSize: '0.6375rem', color: 'var(--outline)', marginBottom: 1, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {breadcrumb}
              </p>
            )}
            <h1 style={{
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: '0.9375rem',
              color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </h1>
          </div>

          {/* Right indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="dot-live" />
              <span style={{ fontSize: '0.7rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap' }}>
                Sepolia · Live
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--outline)', whiteSpace: 'nowrap' }}>
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          background: 'var(--bg)',
          backgroundImage: 'linear-gradient(rgba(60,73,91,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(60,73,91,0.07) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
