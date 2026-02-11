import { useState, type FormEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SaveChangesModal } from '../../components/ui/SaveChangesModal'
import { DeleteAccountModal } from '../../components/ui/DeleteAccountModal'
import { User, Mail, Phone, BookOpen, Building, Hash, FileText, Settings, AlertTriangle } from 'lucide-react'

export function SettingsPage() {
    const { user, updateUser, deleteAccount } = useAuth()
    const navigate = useNavigate()
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
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

    // Calculate changes for the modal
    const changes = useMemo(() => {
        const changesList: Array<{ field: string; oldValue: string; newValue: string }> = []

        if (formData.displayName !== (user?.displayName || '')) {
            changesList.push({
                field: 'displayName',
                oldValue: user?.displayName || '',
                newValue: formData.displayName
            })
        }
        if (formData.phoneNumber !== (user?.phoneNumber || '')) {
            changesList.push({
                field: 'phoneNumber',
                oldValue: user?.phoneNumber || '',
                newValue: formData.phoneNumber
            })
        }
        if (formData.studentId !== (user?.studentId || '')) {
            changesList.push({
                field: 'studentId',
                oldValue: user?.studentId || '',
                newValue: formData.studentId
            })
        }
        if (formData.bio !== (user?.bio || '')) {
            changesList.push({
                field: 'bio',
                oldValue: user?.bio || '',
                newValue: formData.bio
            })
        }
        if (formData.program !== (user?.program || '')) {
            changesList.push({
                field: 'program',
                oldValue: user?.program || '',
                newValue: formData.program
            })
        }
        if (formData.department !== (user?.department || '')) {
            changesList.push({
                field: 'department',
                oldValue: user?.department || '',
                newValue: formData.department
            })
        }
        if (formData.semester !== (user?.semester?.toString() || '')) {
            changesList.push({
                field: 'semester',
                oldValue: user?.semester?.toString() || '',
                newValue: formData.semester
            })
        }

        return changesList
    }, [formData, user])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        // Show confirmation modal
        setShowSaveModal(true)
    }

    const handleConfirmSave = async () => {
        setError('')
        setSuccess('')

        await updateUser({
            ...formData,
            semester: formData.semester ? parseInt(formData.semester) : undefined
        })
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
    }

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount()
            // User will be redirected to login after account deletion
            navigate('/login')
        } catch (err) {
            console.error('Error deleting account:', err)
            throw err // Re-throw to be caught by modal
        }
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
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
                                <Button type="submit" disabled={changes.length === 0} className="w-full md:w-auto">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border border-red-500/20 shadow-sm">
                    <CardHeader className="border-b border-red-500/20 bg-red-500/5">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <h2 className="text-sm font-semibold text-red-600">Danger Zone</h2>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                                <h3 className="font-medium text-text">Delete Account</h3>
                                <p className="text-sm text-text-muted mt-1">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30"
                            >
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <SaveChangesModal
                    isOpen={showSaveModal}
                    onClose={() => setShowSaveModal(false)}
                    onConfirm={handleConfirmSave}
                    title="Save Profile Changes"
                    description="Are you sure you want to save these changes to your profile?"
                    changes={changes}
                />

                <DeleteAccountModal
                    isOpen={showDeleteModal}
                    userEmail={user?.email || ''}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteAccount}
                />
            </div>
        </div>
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
