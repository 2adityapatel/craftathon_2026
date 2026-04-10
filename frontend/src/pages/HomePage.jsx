import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
})

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

// Thin-line SVG icons (2pt glyph style per design system)
const IconLock = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)
const IconShield = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const IconChain = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
)
const IconAI = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

export default function HomePage() {
  const { t } = useLanguage()

  const trustItems = [
    { icon: <IconLock />,   label: t('trust.zeroId'),    desc: t('trust.zeroIdDesc') },
    { icon: <IconShield />, label: t('trust.e2e'),        desc: t('trust.e2eDesc') },
    { icon: <IconChain />,  label: t('trust.blockchain'), desc: t('trust.blockchainDesc') },
    { icon: <IconAI />,     label: t('trust.ai'),         desc: t('trust.aiDesc') },
  ]

  const steps = [
    { num: '01', title: t('steps.step1Title'), desc: t('steps.step1Desc') },
    { num: '02', title: t('steps.step2Title'), desc: t('steps.step2Desc') },
    { num: '03', title: t('steps.step3Title'), desc: t('steps.step3Desc') },
    { num: '04', title: t('steps.step4Title'), desc: t('steps.step4Desc') },
  ]

  const stats = [
    { value: '256-bit', label: t('stats.encryption') },
    { value: '100%',    label: t('stats.anonymous') },
    { value: 'ETH',     label: t('stats.blockchain') },
  ]

  const evidenceTypes = [
    { glyph: '🔗', type: t('evidence.urlType'),    desc: t('evidence.urlDesc') },
    { glyph: '🖼️', type: t('evidence.imgType'),    desc: t('evidence.imgDesc') },
    { glyph: '📝', type: t('evidence.textType'),   desc: t('evidence.textDesc') },
    { glyph: '📸', type: t('evidence.screenType'), desc: t('evidence.screenDesc') },
  ]

  return (
    <Layout>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-void bg-grid">
        {/* Ambient blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '-5%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(255,186,59,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '-5%', width: 360, height: 360, background: 'radial-gradient(circle, rgba(33,179,117,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '6rem 1.5rem 4rem', width: '100%' }}>
          <div style={{ maxWidth: 760 }}>

            {/* Live badge */}
            <motion.div {...fadeUp(0)} style={{ marginBottom: 28 }}>
              <span className="chip-confirmed" style={{ verticalAlign: 'middle' }}>
                <span className="dot-live" />
                Secure · Anonymous · Blockchain-Anchored
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.08)}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                lineHeight: 1.1,
                color: 'var(--on-surface)',
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              {t('hero.title1')}{' '}
              <span style={{
                background: 'linear-gradient(120deg, #ffdead, #ffba3b, #f4ab04)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {t('hero.title2')}
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.15)} style={{ fontSize: '1.0625rem', color: 'var(--on-surface-variant)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 560 }}>
              {t('hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.22)} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '3rem' }}>
              <Link to="/report" id="hero-report-btn" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.9375rem', gap: 8 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('hero.submitBtn')}
              </Link>
              <Link to="/track" id="hero-track-btn" className="btn-outline" style={{ padding: '12px 28px', fontSize: '0.9375rem', gap: 8 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t('hero.trackBtn')}
              </Link>
            </motion.div>

            {/* Stats — Bento row */}
            <motion.div {...fadeUp(0.3)} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
              {stats.map((s) => (
                <div key={s.label} style={{
                  background: 'var(--surface)',
                  padding: '14px 18px',
                  borderRadius: '4px',
                }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)', lineHeight: 1.1 }}>{s.value}</div>
                  <div className="label-caps" style={{ marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--surface-low)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div {...inView(0)} style={{ marginBottom: '3rem' }}>
            <p className="label-caps" style={{ marginBottom: 12 }}>System Integrity</p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--on-surface)', marginBottom: 12, letterSpacing: '-0.01em' }}>
              {t('trust.title1')}{' '}
              <span style={{ color: 'var(--primary)' }}>{t('trust.title2')}</span>
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', maxWidth: 480, lineHeight: 1.65 }}>{t('trust.subtitle')}</p>
          </motion.div>

          {/* Bento grid — 2-col on mobile, 4-col on lg */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
            {trustItems.map((item, i) => (
              <motion.div
                key={item.label}
                {...inView(i * 0.08)}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '4px',
                  padding: '24px',
                  transition: 'background 0.2s',
                  cursor: 'default',
                }}
                whileHover={{ backgroundColor: 'var(--surface-high)' }}
              >
                <div style={{
                  width: 40, height: 40,
                  background: 'rgba(255,186,59,0.08)',
                  border: '1px solid rgba(255,186,59,0.15)',
                  borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)',
                  marginBottom: 16,
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 8 }}>{item.label}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div {...inView(0)} style={{ marginBottom: '3rem' }}>
            <p className="label-caps" style={{ marginBottom: 12 }}>Process Pipeline</p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
              {t('steps.title1')} <span style={{ color: 'var(--primary)' }}>{t('steps.title2')}</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {steps.map((step, i) => (
              <motion.div key={step.num} {...inView(i * 0.1)}>
                <div style={{
                  background: 'var(--surface)',
                  borderRadius: '4px',
                  padding: '24px',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Step number — large ghost watermark */}
                  <span style={{
                    position: 'absolute', right: 16, top: 12,
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800, fontSize: '4rem',
                    color: 'rgba(255,186,59,0.04)',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}>{step.num}</span>

                  <div style={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, rgba(255,186,59,0.15), rgba(255,186,59,0.05))',
                    border: '1px solid rgba(255,186,59,0.25)',
                    borderRadius: '2px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)' }}>{step.num}</span>
                  </div>
                  <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.9375rem', color: 'var(--on-surface)', marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVIDENCE TYPES ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--surface-low)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <motion.div {...inView(0)} style={{ marginBottom: '3rem' }}>
            <p className="label-caps" style={{ marginBottom: 12 }}>Evidence Protocol</p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
              {t('evidence.title1')} <span style={{ color: 'var(--primary)' }}>{t('evidence.title2')}</span>
            </h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
            {evidenceTypes.map((item, i) => (
              <motion.div key={item.type} {...inView(i * 0.07)} style={{ background: 'var(--surface)', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: 12 }}>{item.glyph}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '0.875rem', color: 'var(--on-surface)', marginBottom: 6 }}>{item.type}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <motion.div {...inView(0)} style={{
            background: 'var(--surface)',
            borderRadius: '4px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255,186,59,0.1)',
          }}>
            {/* top accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,186,59,0.4), transparent)' }} />

            <div style={{
              width: 48, height: 48,
              background: 'rgba(255,186,59,0.08)',
              border: '1px solid rgba(255,186,59,0.2)',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }} className="animate-float">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--primary)">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" />
              </svg>
            </div>

            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1.75rem', color: 'var(--on-surface)', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
              {t('cta.title')}
            </h2>
            <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem', lineHeight: 1.65 }}>{t('cta.desc')}</p>

            <Link to="/report" id="cta-report-btn" className="btn-primary" style={{ padding: '12px 32px', fontSize: '0.9375rem', gap: 8 }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {t('cta.btn')}
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
