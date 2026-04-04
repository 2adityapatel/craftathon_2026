import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Reporter portal
import HomePage    from './pages/HomePage'
import ReportPage  from './pages/ReportPage'
import SuccessPage from './pages/SuccessPage'
import TrackPage   from './pages/TrackPage'

// Admin panel
import { AuthProvider }     from './admin/context/AuthContext'
import ProtectedRoute       from './admin/components/ProtectedRoute'
import AdminLogin           from './admin/pages/AdminLogin'
import AdminDashboard       from './admin/pages/AdminDashboard'
import AdminCases           from './admin/pages/AdminCases'
import AdminCaseDetail      from './admin/pages/AdminCaseDetail'
import AdminDomains         from './admin/pages/AdminDomains'
import AdminAudit           from './admin/pages/AdminAudit'

// Global components
import AwaazChatbot         from './components/AwaazChatbot'

import { LanguageProvider } from './context/LanguageContext'

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
        <Routes>
          {/* ── Reporter Portal ── */}
          <Route path="/"        element={<HomePage />} />
          <Route path="/report"  element={<ReportPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/track"   element={<TrackPage />} />

          {/* ── Admin Panel ── */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/cases" element={
            <ProtectedRoute><AdminCases /></ProtectedRoute>
          } />
          <Route path="/admin/case/:id" element={
            <ProtectedRoute><AdminCaseDetail /></ProtectedRoute>
          } />
          <Route path="/admin/domains" element={
            <ProtectedRoute><AdminDomains /></ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute><AdminAudit /></ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* AI Chatbot — floating widget on all pages */}
        <AwaazChatbot />
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
