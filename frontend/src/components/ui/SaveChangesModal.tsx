import { useState } from 'react'
import { Save, AlertCircle, CheckCircle } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'

interface SaveChangesModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    title?: string
    description?: string
    changes?: Array<{ field: string; oldValue: string; newValue: string }>
}

export function SaveChangesModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Save Changes',
    description = 'Are you sure you want to save these changes to your profile?',
    changes = []
}: SaveChangesModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        setError(null)
        setSuccess(false)

        try {
            await onConfirm()
            setSuccess(true)
            
            // Auto-close after success
            setTimeout(() => {
                setSuccess(false)
                onClose()
            }, 1500)
        } catch (err) {
            console.error('Save error:', err)
            setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            setError(null)
            setSuccess(false)
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <ModalHeader onClose={handleClose}>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        success ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                        {success ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                        ) : (
                            <Save className="w-5 h-5 text-primary" />
                        )}
                    </div>
                    <h2 className="text-lg font-semibold text-text">
                        {success ? 'Changes Saved!' : title}
                    </h2>
                </div>
            </ModalHeader>

            <ModalBody>
                {success ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-success font-medium">
                            Your profile has been updated successfully.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-text-muted leading-relaxed">
                            {description}
                        </p>

                        {changes.length > 0 && (
                            <div className="bg-background rounded-lg p-4 border border-border">
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
                                    Changes Summary
                                </h3>
                                <div className="space-y-2.5">
                                    {changes.map((change, index) => (
                                        <div key={index} className="text-xs">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-text capitalize">
                                                    {change.field.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-text-muted line-through">
                                                    {change.oldValue || '(empty)'}
                                                </span>
                                                <span className="text-text-muted">→</span>
                                                <span className="text-primary font-medium">
                                                    {change.newValue || '(empty)'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-error">{error}</p>
                            </div>
                        )}

                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                            <p className="text-xs text-text-muted leading-relaxed">
                                💡 Your changes will be saved immediately and reflected across the system.
                            </p>
                        </div>
                    </div>
                )}
            </ModalBody>

            {!success && (
                <ModalFooter>
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        loading={loading}
                        className="bg-primary hover:bg-primary-hover focus-visible:outline-primary"
                    >
                        Save Changes
                    </Button>
                </ModalFooter>
            )}
        </Modal>
    )
}
