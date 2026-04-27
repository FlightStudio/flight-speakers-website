import { Routes, Route, Navigate } from 'react-router-dom'
import { useAdminAuth } from './hooks/useAdminAuth'
import AdminLayout from './AdminLayout'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminEnquiryDetailPage from './pages/AdminEnquiryDetailPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminEnquiriesPage from './pages/AdminEnquiriesPage'
import AdminSpeakersPage from './pages/AdminSpeakersPage'
import AdminSpeakerDetailPage from './pages/AdminSpeakerDetailPage'
import AdminSpeakerFormPage from './pages/AdminSpeakerFormPage'
import AdminReviewPage from './pages/AdminReviewPage'
import AdminNewsGuidePage from './pages/AdminNewsGuidePage'
import '../admin/admin.css'

export default function AdminApp() {
  const { user, isLoading, isAuthenticated, login, logout } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="admin-loading" style={{ minHeight: '100vh' }}>
        <div className="admin-loading__spinner" />
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onLogin={login} />
  }

  return (
    <Routes>
      <Route element={<AdminLayout user={user} onLogout={logout} />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="enquiries" element={<AdminEnquiriesPage />} />
        <Route path="enquiries/:id" element={<AdminEnquiryDetailPage />} />
        <Route path="speakers" element={<AdminSpeakersPage />} />
        <Route path="speakers/new" element={<AdminSpeakerFormPage />} />
        <Route path="speakers/:id/edit" element={<AdminSpeakerFormPage />} />
        <Route path="speakers/:id" element={<AdminSpeakerDetailPage />} />
        <Route path="review" element={<AdminReviewPage />} />
        <Route path="news" element={<AdminNewsGuidePage />} />
        <Route path="integrations" element={<AdminSettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
