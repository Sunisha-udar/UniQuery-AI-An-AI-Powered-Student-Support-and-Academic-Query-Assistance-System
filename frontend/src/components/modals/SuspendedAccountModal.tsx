import { AlertCircle, LifeBuoy, LogOut } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { SupportRequestModal } from '../support/SupportRequestModal'

interface SuspendedAccountModalProps {
    isOpen: boolean
}

export function SuspendedAccountModal({ isOpen }: SuspendedAccountModalProps) {
    const { logout, user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [supportOpen, setSupportOpen] = useState(false)

    const isMounted = useRef(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        return () => {
            isMounted.current = false
        }
    }, [])

    const handleLogout = async () => {
        setLoading(true)
        setError(null)
        try {
            await logout()
        } catch (err) {
            console.error('Logout error:', err)
            if (isMounted.current) {
                setError('Failed to sign out. Please try again.')
            }
        } finally {
            if (isMounted.current) {
                setLoading(false)
            }
        }
    }

    // Non-dismissible modal - no onClose handler
    return (
        <Modal isOpen={isOpen} onClose={() => { }}>
            <ModalHeader onClose={() => { }}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">Account Suspended</h2>
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-sm text-text leading-relaxed">
                            Your account has been suspended by an administrator. You cannot access the application at this time.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {error}
                            </p>
                        </div>
                    )}

                    {user && (
                        <div className="bg-background rounded-lg p-4 border border-border">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                                        Account
                                    </span>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                                        Suspended
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

                    <p className="text-xs text-text-muted">
                        If you believe this is a mistake, send a support request so the admin team can review your account.
                    </p>
                </div>
            </ModalBody>

            <ModalFooter className="flex-col-reverse sm:flex-row">
                <Button
                    variant="secondary"
                    onClick={() => setSupportOpen(true)}
                    className="w-full sm:w-auto border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15"
                >
                    <LifeBuoy className="w-4 h-4 mr-2" />
                    Contact Support
                </Button>
                <Button
                    variant="primary"
                    onClick={handleLogout}
                    loading={loading}
                    className="w-full sm:w-auto bg-red-500 hover:bg-red-600 focus-visible:outline-red-500"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </ModalFooter>

            <SupportRequestModal
                isOpen={supportOpen}
                onClose={() => setSupportOpen(false)}
                defaultSubject="Suspended account review request"
                title="Request Account Review"
                description="Explain why your account should be reviewed or reactivated. Admins will see this even while your account is suspended."
            />
        </Modal>
    )
}
