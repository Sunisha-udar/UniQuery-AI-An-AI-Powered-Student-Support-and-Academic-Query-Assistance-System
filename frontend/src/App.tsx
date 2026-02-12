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
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminFAQs } from './pages/admin/AdminFAQs'
import { SettingsPage } from './pages/student/SettingsPage'
import { FAQPage } from './pages/student/FAQPage'
import { DashboardLayoutWrapper } from './components/layout/DashboardLayoutWrapper'
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
            <Route element={
              <ProtectedRoute allowedRoles={['student']}>
                <DashboardLayoutWrapper variant="student" />
              </ProtectedRoute>
            }>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/settings" element={<SettingsPage />} />
              <Route path="/student/faqs" element={<FAQPage />} />
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
            </Route>

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
