import { AlertCircle, Ban, CheckCircle } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal'
import { Button } from '../ui/Button'

interface SuspendUserModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    userEmail: string
    isSuspending: boolean
    loading?: boolean
}

export function SuspendUserModal({
    isOpen,
    onClose,
    onConfirm,
    userEmail,
    isSuspending,
    loading = false
}: SuspendUserModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader onClose={onClose}>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        isSuspending 
                            ? 'bg-red-500/10' 
                            : 'bg-green-500/10'
                    }`}>
                        {isSuspending ? (
                            <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-text">
                        {isSuspending ? 'Suspend User' : 'Activate User'}
                    </h2>
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    <p className="text-sm text-text-muted leading-relaxed">
                        {isSuspending 
                            ? 'Are you sure you want to suspend this user? They will no longer be able to access the application.'
                            : 'Are you sure you want to activate this user? They will regain access to the application.'
                        }
                    </p>

                    <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                                    User Account
                                </span>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    isSuspending
                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                        : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}>
                                    {isSuspending ? 'Active' : 'Suspended'}
                                </span>
                            </div>
                            <p className="text-sm font-medium text-text">
                                {userEmail}
                            </p>
                        </div>
                    </div>

                    {isSuspending && (
                        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                This user will be immediately signed out and cannot access the application until reactivated.
                            </p>
                        </div>
                    )}
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
                    onClick={onConfirm}
                    loading={loading}
                    className={isSuspending 
                        ? 'bg-red-500 hover:bg-red-600 focus-visible:outline-red-500'
                        : 'bg-green-500 hover:bg-green-600 focus-visible:outline-green-500'
                    }
                >
                    {isSuspending ? (
                        <>
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend User
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate User
                        </>
                    )}
                </Button>
            </ModalFooter>
        </Modal>
    )
}
