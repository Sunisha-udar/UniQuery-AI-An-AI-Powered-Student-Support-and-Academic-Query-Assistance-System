import { useState } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'

interface DeleteChatModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    chatTitle: string
}

export function DeleteChatModal({ isOpen, onClose, onConfirm, chatTitle }: DeleteChatModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        setLoading(true)
        setError(null)

        try {
            await onConfirm()
            onClose()
        } catch (err) {
            console.error('Delete error:', err)
            setError('Failed to delete chat. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader onClose={onClose}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
                        <Trash2 className="w-5 h-5 text-error" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">Delete Chat</h2>
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    <p className="text-sm text-text-muted leading-relaxed">
                        Are you sure you want to delete this chat?
                    </p>

                    <div className="bg-background rounded-lg p-4 border border-border">
                        <p className="text-sm font-medium text-text truncate">
                            {chatTitle}
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-error">{error}</p>
                        </div>
                    )}

                    <p className="text-xs text-text-light">
                        This action cannot be undone.
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
                    onClick={handleDelete}
                    loading={loading}
                    className="bg-error hover:bg-error/90 focus-visible:outline-error"
                >
                    Delete
                </Button>
            </ModalFooter>
        </Modal>
    )
}
