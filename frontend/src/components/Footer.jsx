import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="bg-navy-950 border-t border-navy-700/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-navy-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                </svg>
              </div>
              <span className="font-bold text-amber-400 font-display">Awaaz Secure Report</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('footer.desc')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">{t('footer.reportTitle')}</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-sm text-slate-500 hover:text-amber-400 transition-colors">{t('footer.home')}</Link></li>
              <li><Link to="/report" className="text-sm text-slate-500 hover:text-amber-400 transition-colors">{t('footer.submit')}</Link></li>
              <li><Link to="/track" className="text-sm text-slate-500 hover:text-amber-400 transition-colors">{t('footer.track')}</Link></li>
            </ul>
          </div>

          {/* Security */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">{t('footer.securityTitle')}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                {t('footer.s1')}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                {t('footer.s2')}
              </li>
            </ul>
          </div>
        </div>

        <div className="divider pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-slate-600">{t('footer.network')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
