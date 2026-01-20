import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { GraduationCap, AlertCircle, Users, BookOpen } from 'lucide-react'

const PROGRAMS = [
    { value: 'btech', label: 'B.Tech' },
    { value: 'mtech', label: 'M.Tech' },
    { value: 'mba', label: 'MBA' },
    { value: 'bba', label: 'BBA' },
    { value: 'bsc', label: 'B.Sc' },
    { value: 'msc', label: 'M.Sc' },
]

const DEPARTMENTS = [
    { value: 'cse', label: 'Computer Science' },
    { value: 'ece', label: 'Electronics & Communication' },
    { value: 'eee', label: 'Electrical Engineering' },
    { value: 'mech', label: 'Mechanical Engineering' },
    { value: 'civil', label: 'Civil Engineering' },
    { value: 'it', label: 'Information Technology' },
]

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
}))

export function SignupPage() {
    const [step, setStep] = useState(1)
    const [role, setRole] = useState<UserRole | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [program, setProgram] = useState('')
    const [department, setDepartment] = useState('')
    const [semester, setSemester] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signup, user } = useAuth()
    const navigate = useNavigate()

    // Redirect if already logged in
    if (user) {
        navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true })
    }

    const handleRoleSelect = (selectedRole: UserRole) => {
        setRole(selectedRole)
        setStep(2)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!role) return

        setError('')
        setLoading(true)

        try {
            const profile = role === 'student' ? {
                program,
                department,
                semester: parseInt(semester),
            } : {}

            await signup(email, password, role, profile)
            navigate(role === 'admin' ? '/admin' : '/student')
        } catch (err) {
            setError('Failed to create account. Email may already be in use.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary mb-4">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-text">Create Account</h1>
                    <p className="text-text-muted mt-2">Join UniQuery today</p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        {step === 1 && (
                            <div className="space-y-4">
                                <p className="text-sm text-text-muted text-center mb-6">
                                    Select your role to continue
                                </p>

                                <button
                                    onClick={() => handleRoleSelect('student')}
                                    className="w-full p-4 rounded-lg border border-border bg-surface hover:border-primary hover:bg-primary/5 transition-colors duration-200 cursor-pointer flex items-center gap-4 text-left"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text">Student</p>
                                        <p className="text-sm text-text-muted">Ask questions about courses, exams & policies</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleRoleSelect('admin')}
                                    className="w-full p-4 rounded-lg border border-border bg-surface hover:border-primary hover:bg-primary/5 transition-colors duration-200 cursor-pointer flex items-center gap-4 text-left"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-cta/10 flex items-center justify-center">
                                        <Users className="w-6 h-6 text-cta" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-text">Administrator</p>
                                        <p className="text-sm text-text-muted">Manage documents & view analytics</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {step === 2 && (
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
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />

                                {role === 'student' && (
                                    <>
                                        <Select
                                            label="Program"
                                            options={PROGRAMS}
                                            value={program}
                                            onChange={(e) => setProgram(e.target.value)}
                                            placeholder="Select your program"
                                            required
                                        />

                                        <Select
                                            label="Department"
                                            options={DEPARTMENTS}
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            placeholder="Select your department"
                                            required
                                        />

                                        <Select
                                            label="Semester"
                                            options={SEMESTERS}
                                            value={semester}
                                            onChange={(e) => setSemester(e.target.value)}
                                            placeholder="Select your semester"
                                            required
                                        />
                                    </>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setStep(1)}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1"
                                        loading={loading}
                                    >
                                        Create Account
                                    </Button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 text-center text-sm text-text-muted">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-primary font-medium hover:underline focus:outline-none focus:underline"
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
