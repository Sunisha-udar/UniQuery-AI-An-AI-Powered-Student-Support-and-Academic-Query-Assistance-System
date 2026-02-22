import { useState, type FormEvent } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { AlertCircle } from 'lucide-react'

export function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const { login, user, loading: authLoading } = useAuth()
    const location = useLocation()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        try {
            // Clear any stale data first
            sessionStorage.clear()

            await login(email, password)
            // Navigation happens via render block when user state updates
        } catch (err) {
            setError('Invalid email or password. Please try again.')
            setSubmitting(false)
        }
    }

    // Show loading spinner while auth state is being determined
    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-muted text-sm">Loading...</p>
                </div>
            </div>
        )
    }

    if (user) {
        // Use location state first, then fallback to sessionStorage
        const savedRedirect = sessionStorage.getItem('redirectAfterLogin')
        const redirectPath = location.state?.from?.pathname || savedRedirect || (user.role === 'admin' ? '/admin' : '/student')

        // Clear the saved redirect so it doesn't persist to subsequent logins
        if (savedRedirect) {
            sessionStorage.removeItem('redirectAfterLogin')
        }

        return <Navigate to={redirectPath} replace />
    }

    return (
        <div className="h-[100dvh] overflow-hidden overscroll-none bg-background flex items-center justify-center p-4 pb-4 md:pb-20">
            <div className="w-full max-w-md">
                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 mb-2">
                        <img src="/logo.png" alt="UniQuery Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Welcome to UniQuery</h1>
                    <p className="text-text-muted mt-2">Your AI-powered academic assistant</p>
                </div>

                {/* Login Card */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@university.edu"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />

                            <Button
                                type="submit"
                                className="w-full"
                                loading={submitting}
                            >
                                Sign In
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm text-text-muted">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-text-muted mt-6">
                    By continuing, you agree to UniQuery's Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    )
}
