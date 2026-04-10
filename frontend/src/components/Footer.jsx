import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer style={{
      background: 'var(--surface-low)',
      borderTop: '1px solid var(--outline-variant)',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: 'var(--surface)', border: '1px solid rgba(255,186,59,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="url(#fg)" />
                <path d="M9 12l2 2 4-4" stroke="#573b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs><linearGradient id="fg" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#ffba3b" /><stop offset="100%" stopColor="#f4ab04" /></linearGradient></defs>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)', letterSpacing: '0.06em' }}>AWAAZ</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--outline)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Blockchain POCSO Portal</p>
            </div>
          </div>

          {/* Nav links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {[
              { to: '/', label: t('footer.home') },
              { to: '/report', label: t('nav.report') },
              { to: '/track', label: t('nav.track') },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--on-surface)'}
                onMouseLeave={e => e.target.style.color = 'var(--on-surface-variant)'}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: '1rem', borderTop: '1px solid rgba(60,73,91,0.3)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--outline)' }}>
            © {year} Awaaz POCSO Reporting System — Immutable evidence, zero identity exposure.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="dot-live" />
            <span style={{ fontSize: '0.7rem', color: 'var(--outline)', fontFamily: "'JetBrains Mono',monospace" }}>Sepolia ETH Node · Online</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
