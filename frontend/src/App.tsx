import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
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

const ADMIN_ROUTE_PREFIXES = [
  '/admin',
  '/admin/documents',
  '/admin/queries',
  '/admin/analytics',
  '/admin/faqs',
  '/admin/settings',
  '/admin/users',
  '/admin/support',
]

const STUDENT_ROUTE_PREFIXES = [
  '/student',
  '/student/settings',
  '/student/faqs',
  '/student/bookmarks',
]

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

function isPathAllowedForRole(path: string, role: 'admin' | 'student') {
  const normalizedPath = normalizePath(path)
  const prefixes = role === 'admin' ? ADMIN_ROUTE_PREFIXES : STUDENT_ROUTE_PREFIXES
  return prefixes.some((prefix) =>
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  )
}

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

  const lastVisitedPath = sessionStorage.getItem('lastVisitedPath')
  const isRolePathValid = lastVisitedPath
    ? isPathAllowedForRole(lastVisitedPath, user.role)
    : false

  if (lastVisitedPath && isRolePathValid) {
    return <Navigate to={normalizePath(lastVisitedPath)} replace />
  }

  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />
}

function CatchAllRedirect() {
  const location = useLocation()
  const normalizedPath = normalizePath(location.pathname)

  if (normalizedPath !== location.pathname) {
    return <Navigate to={`${normalizedPath}${location.search}${location.hash}`} replace />
  }

  return <RootRedirect />
}

function RoutePersistence() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/signup') return

    const isRoleRoute =
      location.pathname === '/admin' ||
      location.pathname.startsWith('/admin/') ||
      location.pathname === '/student' ||
      location.pathname.startsWith('/student/')

    if (!isRoleRoute) return

    const currentPath = `${normalizePath(location.pathname)}${location.search}${location.hash}`
    sessionStorage.setItem('lastVisitedPath', currentPath)
  }, [location.pathname, location.search, location.hash])

  return null
}
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AuthLoader>
            <RoutePersistence />
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <DashboardLayoutWrapper variant="student" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StudentDashboard />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="faqs" element={<FAQPage />} />
                <Route path="bookmarks" element={<BookmarksPage />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayoutWrapper variant="admin" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="documents" element={<AdminDocuments />} />
                <Route path="queries" element={<AdminQueries />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="faqs" element={<AdminFAQs />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="support" element={<AdminSupport />} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<CatchAllRedirect />} />
            </Routes>
          </AuthLoader>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
