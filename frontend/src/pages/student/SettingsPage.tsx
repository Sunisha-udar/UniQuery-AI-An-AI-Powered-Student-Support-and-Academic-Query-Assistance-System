import { useState, type FormEvent } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { User, Mail, Phone, BookOpen, Building, Hash, FileText, Settings } from 'lucide-react'

export function SettingsPage() {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        phoneNumber: user?.phoneNumber || '',
        studentId: user?.studentId || '',
        bio: user?.bio || '',
        program: user?.program || '',
        department: user?.department || '',
        semester: user?.semester?.toString() || '',
    })

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            await updateUser({
                ...formData,
                semester: formData.semester ? parseInt(formData.semester) : undefined
            })
            setSuccess('Profile updated successfully!')
        } catch {
            setError('Failed to update profile.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout variant="student">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Settings</h1>
                        <p className="text-sm text-text-muted mt-1">Manage your profile and preferences</p>
                    </div>
                </div>

                <Card className="border border-border shadow-sm">
                    <CardHeader className="border-b border-border">
                        <h2 className="text-sm font-semibold text-text">Profile Information</h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-error/10 text-error text-sm rounded-lg">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 bg-success/10 text-success text-sm rounded-lg">
                                    {success}
                                </div>
                            )}

                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormGroup label="Full Name" icon={User}>
                                    <Input
                                        value={formData.displayName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="John Doe"
                                    />
                                </FormGroup>
                                <FormGroup label="Student ID" icon={Hash}>
                                    <Input
                                        value={formData.studentId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                                        placeholder="ST-2024-001"
                                    />
                                </FormGroup>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormGroup label="Email (Read-only)" icon={Mail}>
                                    <Input
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-background-secondary cursor-not-allowed"
                                    />
                                </FormGroup>
                                <FormGroup label="Phone Number" icon={Phone}>
                                    <Input
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                        placeholder="+1 234 567 890"
                                    />
                                </FormGroup>
                            </div>

                            {/* Academic Info */}
                            <div className="border-t border-border pt-4 mt-2">
                                <h3 className="text-sm font-medium text-text-muted mb-3">Academic Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormGroup label="Program" icon={BookOpen}>
                                        <Input
                                            value={formData.program}
                                            onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                                            placeholder="BCA"
                                        />
                                    </FormGroup>
                                    <FormGroup label="Department" icon={Building}>
                                        <Input
                                            value={formData.department}
                                            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                                            placeholder="Computer Science"
                                        />
                                    </FormGroup>
                                    <FormGroup label="Semester" icon={Hash}>
                                        <Input
                                            type="number"
                                            value={formData.semester}
                                            onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                                            placeholder="1"
                                            min="1"
                                            max="8"
                                        />
                                    </FormGroup>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="border-t border-border pt-4 mt-2">
                                <FormGroup label="Bio" icon={FileText}>
                                    <textarea
                                        className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-border bg-background-input text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y"
                                        placeholder="Tell us a bit about yourself..."
                                        value={formData.bio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    />
                                </FormGroup>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" loading={loading} className="w-full md:w-auto">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}

function FormGroup({ label, icon: Icon, children }: { label: string, icon: React.ComponentType<{ className?: string }>, children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-text-muted">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </label>
            {children}
        </div>
    )
}
