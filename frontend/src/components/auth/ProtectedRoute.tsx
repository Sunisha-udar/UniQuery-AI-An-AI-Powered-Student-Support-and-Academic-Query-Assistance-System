import { Navigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { SuspendedAccountModal } from '../modals/SuspendedAccountModal'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
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

    // Show suspended modal for suspended users - blocks all access
    if (user.suspended) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <SuspendedAccountModal isOpen={true} />
            </div>
        )
    }

    if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = user.role === 'admin' ? '/admin' : '/student'
        return <Navigate to={redirectPath} replace />
    }

    return <>{children}</>
}
