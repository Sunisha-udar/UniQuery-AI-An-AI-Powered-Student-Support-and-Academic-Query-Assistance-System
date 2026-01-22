import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { StudentDashboard } from './pages/student/StudentDashboard'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminDocuments } from './pages/admin/AdminDocuments'
import { AdminQueries } from './pages/admin/AdminQueries'
import { AdminAnalytics } from './pages/admin/AdminAnalytics'
import { AdminSettings } from './pages/admin/AdminSettings'
import { SettingsPage } from './pages/student/SettingsPage'
import { FAQPage } from './pages/student/FAQPage'
import './index.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Student Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/settings"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/faqs"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <FAQPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queries"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminQueries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
