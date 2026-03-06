import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminDocuments } from './pages/admin/AdminDocuments'
import { AdminQueries } from './pages/admin/AdminQueries'
import { AdminAnalytics } from './pages/admin/AdminAnalytics'
import { AdminSettings } from './pages/admin/AdminSettings'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminFAQs } from './pages/admin/AdminFAQs'
import { AdminSupport } from './pages/admin/AdminSupport'
import { SettingsPage } from './pages/student/SettingsPage'
import { FAQPage } from './pages/student/FAQPage'
import { BookmarksPage } from './pages/student/BookmarksPage'
import { DashboardLayoutWrapper } from './components/layout/DashboardLayoutWrapper'
import './index.css'

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function RootRedirect() {
  const { user, loading, profileLoading } = useAuth()

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
}
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthLoader>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Student Routes */}
              <Route element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayoutWrapper variant="student" />
                </ProtectedRoute>
              }>
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/student/settings" element={<SettingsPage />} />
                <Route path="/student/faqs" element={<FAQPage />} />
                <Route path="/student/bookmarks" element={<BookmarksPage />} />
              </Route>

              {/* Admin Routes */}
              <Route element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayoutWrapper variant="admin" />
                </ProtectedRoute>
              }>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/documents" element={<AdminDocuments />} />
                <Route path="/admin/queries" element={<AdminQueries />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/faqs" element={<AdminFAQs />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/support" element={<AdminSupport />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthLoader>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
