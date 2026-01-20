import { useState } from 'react'
import { LogOut, AlertCircle } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'
import { useAuth } from '../../contexts/AuthContext'

interface LogoutModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
    const { logout, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogout = async () => {
        setLoading(true)
        setError(null)

        try {
            await logout()
            onClose()
        } catch (err) {
            console.error('Logout error:', err)
            setError('Failed to sign out. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader onClose={onClose}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
                        <LogOut className="w-5 h-5 text-error" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">Sign Out</h2>
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    <p className="text-sm text-text-muted leading-relaxed">
                        Are you sure you want to sign out of your account?
                    </p>

                    {user && (
                        <div className="bg-background rounded-lg p-4 border border-border">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                                        Account
                                    </span>
                                    <span className="text-xs font-medium text-primary capitalize">
                                        {user.role}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-text">
                                    {user.email}
                                </p>
                                {user.displayName && (
                                    <p className="text-xs text-text-muted">
                                        {user.displayName}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-error">{error}</p>
                        </div>
                    )}

                    <p className="text-xs text-text-light">
                        You'll need to sign in again to access your account.
                    </p>
                </div>
            </ModalBody>

            <ModalFooter>
                <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleLogout}
                    loading={loading}
                    className="bg-error hover:bg-error/90 focus-visible:outline-error"
                >
                    Sign Out
                </Button>
            </ModalFooter>
        </Modal>
    )
}
