import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { useLanguage } from '../context/LanguageContext'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
})

export default function HomePage() {
  const { t } = useLanguage()

  const trustItems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      ),
      label: t('trust.zeroId'),
      desc: t('trust.zeroIdDesc'),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
      ),
      label: t('trust.e2e'),
      desc: t('trust.e2eDesc'),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
        </svg>
      ),
      label: t('trust.blockchain'),
      desc: t('trust.blockchainDesc'),
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      ),
      label: t('trust.ai'),
      desc: t('trust.aiDesc'),
    },
  ]

  const steps = [
    { num: '01', title: t('steps.step1Title'), desc: t('steps.step1Desc') },
    { num: '02', title: t('steps.step2Title'), desc: t('steps.step2Desc') },
    { num: '03', title: t('steps.step3Title'), desc: t('steps.step3Desc') },
    { num: '04', title: t('steps.step4Title'), desc: t('steps.step4Desc') },
  ]

  const stats = [
    { value: '256-bit', label: t('stats.encryption') },
    { value: '100%', label: t('stats.anonymous') },
    { value: 'Ethereum', label: t('stats.blockchain') },
  ]

  return (
    <Layout>
      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-amber-500/3 rounded-full blur-2xl" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            <motion.div {...fadeUp(0)} className="mb-6 inline-flex items-center gap-2">
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-xs font-medium tracking-wide uppercase">
                  {t('hero.badge')}
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl lg:text-6xl font-black font-display leading-tight mb-6">
              {t('hero.title1')}{' '}
              <span className="text-gradient-gold text-glow-amber block sm:inline">
                {t('hero.title2')}
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="text-lg sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-2xl">
              {t('hero.subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link to="/report" id="hero-report-btn"
                className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-3 animate-pulse-glow">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {t('hero.submitBtn')}
              </Link>
              <Link to="/track" id="hero-track-btn"
                className="btn-outline text-base px-8 py-4 flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                {t('hero.trackBtn')}
              </Link>
            </motion.div>

            {t('hero.sloganText') && (
              <motion.div {...fadeUp(0.35)} className="mb-16 mt-[-1rem]">
                <p className="text-amber-400/90 italic font-medium text-lg border-l-4 border-amber-500 pl-4 py-1">
                  "{t('hero.sloganText')}"
                </p>
              </motion.div>
            )}

            {/* Stats */}
            <motion.div {...fadeUp(0.4)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <div className="text-xl font-bold font-display text-amber-400">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST SIGNALS ── */}
      <section className="py-20 px-4 sm:px-6 bg-navy-950/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              {t('trust.title1')}{' '}
              <span className="text-gradient-amber">{t('trust.title2')}</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t('trust.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trustItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card p-6 group hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-glow"
              >
                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-4 group-hover:bg-amber-500/20 transition-colors">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-slate-200 mb-2">{item.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              {t('steps.title1')} <span className="text-gradient-amber">{t('steps.title2')}</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              {t('steps.subtitle')}
            </p>
          </motion.div>

          <div className="relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.15 }}
                  className="relative"
                >
                  <div className="card p-6 h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-5">
                      <span className="text-amber-400 font-black font-display text-lg">{step.num}</span>
                    </div>
                    <h3 className="font-semibold text-slate-200 mb-2 font-display">{step.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EVIDENCE TYPES ── */}
      <section className="py-20 px-4 sm:px-6 bg-navy-950/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              {t('evidence.title1')} <span className="text-gradient-amber">{t('evidence.title2')}</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🔗', type: t('evidence.urlType'), desc: t('evidence.urlDesc') },
              { icon: '🖼️', type: t('evidence.imgType'), desc: t('evidence.imgDesc') },
              { icon: '📝', type: t('evidence.textType'), desc: t('evidence.textDesc') },
              { icon: '📸', type: t('evidence.screenType'), desc: t('evidence.screenDesc') },
            ].map((item, i) => (
              <motion.div
                key={item.type}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="card p-5 text-center group hover:border-amber-500/30 transition-all duration-300 cursor-default"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className="text-sm font-semibold text-slate-200">{item.type}</div>
                <div className="text-xs text-slate-600 mt-1">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-navy-800 via-navy-800 to-navy-700 p-10 text-center shadow-amber-lg"
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-amber-500/10 blur-2xl" />

            <div className="relative">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float">
                <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                </svg>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display mb-3 text-white">
                {t('cta.title')}
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                {t('cta.desc')}
              </p>

              <Link to="/report" id="cta-report-btn"
                className="btn-primary text-base px-10 py-4 inline-flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                {t('cta.btn')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  )
}
