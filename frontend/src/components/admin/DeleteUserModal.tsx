import { useState, type FormEvent } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import type { FullUserProfile } from '../../lib/adminUserManagement'

interface DeleteUserModalProps {
    user: FullUserProfile
    onClose: () => void
    onConfirm: () => Promise<void>
}

export function DeleteUserModal({ user, onClose, onConfirm }: DeleteUserModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()


        setIsDeleting(true)
        setError(null)

        try {
            await onConfirm()
            // Modal will be closed by parent component on success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user')
            setIsDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-text">Delete User Account</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="p-2 hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {/* Warning Message */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="text-sm text-red-600 font-medium mb-2">
                                ⚠️ This action cannot be undone!
                            </p>
                            <p className="text-sm text-text-muted">
                                Deleting this user will permanently remove:
                            </p>
                            <ul className="text-sm text-text-muted mt-2 ml-4 space-y-1 list-disc">
                                <li>User profile and account access</li>
                                <li>All chat history and conversations</li>
                                <li>All query records and interactions</li>
                                <li>Any associated data in the system</li>
                            </ul>
                        </div>

                        {/* User Info */}
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Email:</span>
                                <span className="text-text font-medium">{user.email}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Role:</span>
                                <span className={clsx(
                                    "font-medium capitalize",
                                    user.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                                )}>
                                    {user.role}
                                </span>
                            </div>
                            {user.display_name && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Name:</span>
                                    <span className="text-text font-medium">{user.display_name}</span>
                                </div>
                            )}
                        </div>


                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-text hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isDeleting}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium text-white rounded-lg transition-all",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                !isDeleting
                                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30"
                                    : "bg-red-600/50"
                            )}
                        >
                            {isDeleting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                'Delete User'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
