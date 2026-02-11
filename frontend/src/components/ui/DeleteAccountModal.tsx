import { useState, type FormEvent } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

interface DeleteAccountModalProps {
    isOpen: boolean
    userEmail: string
    onClose: () => void
    onConfirm: () => Promise<void>
}

export function DeleteAccountModal({ isOpen, userEmail, onClose, onConfirm }: DeleteAccountModalProps) {
    const [confirmEmail, setConfirmEmail] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // User must type their email to confirm
    const isConfirmValid = confirmEmail.toLowerCase() === userEmail.toLowerCase()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        
        if (!isConfirmValid) {
            setError('Email does not match')
            return
        }

        setIsDeleting(true)
        setError(null)

        try {
            await onConfirm()
            // Modal will be closed by parent component on success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account')
            setIsDeleting(false)
        }
    }

    const handleClose = () => {
        if (!isDeleting) {
            setConfirmEmail('')
            setError(null)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-xl shadow-2xl max-w-lg w-full border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-text">Delete Your Account</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="p-2 hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {/* Critical Warning */}
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                            <p className="text-sm text-red-600 font-bold mb-2">
                                ⚠️ WARNING: This action is permanent and cannot be undone!
                            </p>
                            <p className="text-sm text-text-muted mb-3">
                                Deleting your account will immediately and permanently remove:
                            </p>
                            <ul className="text-sm text-text-muted space-y-1.5 ml-4 list-disc">
                                <li><strong>Your profile</strong> - All personal information and settings</li>
                                <li><strong>Chat history</strong> - All your conversations and messages</li>
                                <li><strong>Query records</strong> - All your questions and interactions</li>
                                <li><strong>Account access</strong> - You will be immediately signed out</li>
                            </ul>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <p className="text-sm text-yellow-700 dark:text-yellow-500 font-medium mb-1">
                                Before you proceed:
                            </p>
                            <ul className="text-sm text-text-muted space-y-1 ml-4 list-disc">
                                <li>Make sure you have saved any important information</li>
                                <li>You will need to create a new account to use the system again</li>
                                <li>Your email address will become available for re-registration</li>
                            </ul>
                        </div>

                        {/* Account Info */}
                        <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-muted">Account Email:</span>
                                <span className="text-text font-medium">{userEmail}</span>
                            </div>
                        </div>

                        {/* Confirmation Input */}
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                To confirm, type your email address: <span className="font-mono text-red-600">{userEmail}</span>
                            </label>
                            <input
                                type="email"
                                value={confirmEmail}
                                onChange={(e) => setConfirmEmail(e.target.value)}
                                placeholder="Enter your email address"
                                disabled={isDeleting}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-text disabled:opacity-50"
                                autoComplete="off"
                            />
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
                            onClick={handleClose}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium text-text hover:bg-muted/50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isConfirmValid || isDeleting}
                            className={clsx(
                                "px-6 py-2 text-sm font-medium text-white rounded-lg transition-all",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                isConfirmValid && !isDeleting
                                    ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30"
                                    : "bg-red-600/50"
                            )}
                        >
                            {isDeleting ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting Account...
                                </span>
                            ) : (
                                'Delete My Account Permanently'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
