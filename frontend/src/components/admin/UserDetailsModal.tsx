import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal'
import { Button } from '../ui/Button'
import {
    User,
    Mail,
    Phone,
    Hash,
    BookOpen,
    Building,
    Calendar,
    Shield,
    Ban,
    CheckCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import type { FullUserProfile } from '../../lib/adminUserManagement'

interface UserDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    user: FullUserProfile | null
    onSuspend?: (suspend: boolean) => void
    onChangeRole?: (role: 'admin' | 'student') => void
    isLoading?: boolean
}

export function UserDetailsModal({
    isOpen,
    onClose,
    user,
    onSuspend,
    onChangeRole,
    isLoading = false
}: UserDetailsModalProps) {
    if (!user) return null

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <ModalHeader onClose={onClose}>
                <div>
                    <h2 className="text-xl font-bold text-text">User Details</h2>
                    <p className="text-sm text-text-muted mt-1">View and manage user information</p>
                </div>
            </ModalHeader>

            <ModalBody className="space-y-6">
                {/* Status Banner */}
                {user.suspended && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <Ban className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Account Suspended</p>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80">This user cannot access the application</p>
                        </div>
                    </div>
                )}

                {/* Profile Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Profile Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Email</p>
                                <p className="text-sm font-medium text-text truncate">{user.email || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Display Name */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Name</p>
                                <p className="text-sm font-medium text-text truncate">{user.display_name || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Phone</p>
                                <p className="text-sm font-medium text-text truncate">{user.phone_number || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Student ID */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Hash className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Student ID</p>
                                <p className="text-sm font-medium text-text truncate">{user.student_id || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Role</p>
                                <span className={clsx(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                    user.role === 'admin'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                )}>
                                    {user.role === 'admin' ? 'Admin' : 'Student'}
                                </span>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-start gap-3">
                            <div className={clsx(
                                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                user.suspended ? "bg-red-500/10" : "bg-green-500/10"
                            )}>
                                {user.suspended ? (
                                    <Ban className="w-4 h-4 text-red-500" />
                                ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Status</p>
                                <span className={clsx(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                    user.suspended
                                        ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                        : 'bg-green-500/10 text-green-600 dark:text-green-400'
                                )}>
                                    {user.suspended ? 'Suspended' : 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Academic Details Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Academic Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Program */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Program</p>
                                <p className="text-sm font-medium text-text truncate">{user.program || 'Not specified'}</p>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Department</p>
                                <p className="text-sm font-medium text-text truncate">{user.department || 'Not specified'}</p>
                            </div>
                        </div>

                        {/* Semester */}
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted">Semester</p>
                                <p className="text-sm font-medium text-text">
                                    {user.semester ? `Semester ${user.semester}` : 'Not specified'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <div className="pt-2">
                            <p className="text-xs text-text-muted mb-2">Bio</p>
                            <p className="text-sm text-text bg-surface p-3 rounded-lg border border-border">{user.bio}</p>
                        </div>
                    )}
                </div>

                {/* Account Metadata */}
                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-text uppercase tracking-wide">Account Metadata</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-text-muted">User ID</p>
                            <p className="text-xs font-mono text-text mt-1 break-all">{user.id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">Joined</p>
                            <p className="text-sm text-text mt-1">{formatDate(user.created_at)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">Last Updated</p>
                            <p className="text-sm text-text mt-1">{formatDate(user.updated_at)}</p>
                        </div>
                    </div>
                </div>
            </ModalBody>

            <ModalFooter>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        {onSuspend && (
                            <Button
                                variant={user.suspended ? "primary" : "secondary"}
                                size="sm"
                                onClick={() => onSuspend(!user.suspended)}
                                disabled={isLoading}
                                className={!user.suspended ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 w-full sm:w-auto" : "w-full sm:w-auto"}
                            >
                                {user.suspended ? (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-1.5" />
                                        Activate Account
                                    </>
                                ) : (
                                    <>
                                        <Ban className="w-4 h-4 mr-1.5" />
                                        Suspend Account
                                    </>
                                )}
                            </Button>
                        )}
                        {onChangeRole && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => onChangeRole(user.role === 'admin' ? 'student' : 'admin')}
                                disabled={isLoading}
                                className="w-full sm:w-auto"
                            >
                                Change to {user.role === 'admin' ? 'Student' : 'Admin'}
                            </Button>
                        )}
                    </div>
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        Close
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    )
}
