import { useState, type FormEvent, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, type UserRole } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card, CardContent } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { GraduationCap, AlertCircle } from 'lucide-react'

const DEPARTMENT_PROGRAMS: Record<string, { value: string; label: string }[]> = {
    cse: [
        { value: 'btech', label: 'B.Tech' },
        { value: 'mtech', label: 'M.Tech' },
        { value: 'bca', label: 'BCA' },
        { value: 'mca', label: 'MCA' },
        { value: 'bsc_cs', label: 'B.Sc (Cyber Security)' },
    ],
    it: [
        { value: 'btech', label: 'B.Tech' },
        { value: 'mtech', label: 'M.Tech' },
        { value: 'bca', label: 'BCA' },
        { value: 'mca', label: 'MCA' },
        { value: 'bsc_ts', label: 'B.Sc (Tech)' },
    ],
    default: [
        { value: 'btech', label: 'B.Tech' },
        { value: 'mtech', label: 'M.Tech' },
    ]
}

const DEPARTMENTS = [
    { value: 'cse', label: 'Computer Science' },
    { value: 'it', label: 'Information Technology' },
    { value: 'ece', label: 'Electronics & Communication' },
    { value: 'eee', label: 'Electrical Engineering' },
    { value: 'mech', label: 'Mechanical Engineering' },
    { value: 'civil', label: 'Civil Engineering' },
]

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
}))

export function SignupPage() {
    // const [step, setStep] = useState(1) // Removed step
    // const [role, setRole] = useState<UserRole | null>(null) // Removed role state
    const role: UserRole = 'student' // Default role
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
    useEffect(() => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true })
        }
    }, [user, navigate])

    // const handleRoleSelect = (selectedRole: UserRole) => {
    //     setRole(selectedRole)
    //     setStep(2)
    // }

    const handleDepartmentChange = (val: string) => {
        setDepartment(val)
        setProgram('') // Reset program when department changes
    }

    const currentPrograms = (department && (DEPARTMENT_PROGRAMS[department] || DEPARTMENT_PROGRAMS.default)) || []

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        // if (!role) return // Role is always set

        setError('')
        setLoading(true)

        try {
            const profile = role === 'student' ? {
                program,
                department,
                semester: parseInt(semester),
            } : {}

            await signup(email, password, role, profile)
            navigate('/student')
        } catch {
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
                        {/* Step 1 Removed - Defaulting to Student Role */}

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
                                    <>
                                        <Select
                                            label="Department"
                                            options={DEPARTMENTS}
                                            value={department}
                                            onChange={(e) => handleDepartmentChange(e.target.value)}
                                            placeholder="Select your department"
                                            required
                                        />

                                        <Select
                                            label="Program"
                                            options={currentPrograms}
                                            value={program}
                                            onChange={(e) => setProgram(e.target.value)}
                                            placeholder="Select your program"
                                            required
                                            disabled={!department}
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
                                </>
                            )}

                            <div className="flex gap-3">
                                {/* Back button removed as there is only one step now */}
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    loading={loading}
                                >
                                    Create Account
                                </Button>
                            </div>
                        </form>

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
