import { useState } from 'react'
import { Trash2, AlertCircle, FileText } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal'
import { Button } from './Button'
import { type Document } from '../../lib/api'

interface DeleteDocumentModalProps {
    isOpen: boolean
    onClose: () => void
    doc: Document | null
    onDelete: (docId: string) => Promise<void>
}

export function DeleteDocumentModal({
    isOpen,
    onClose,
    doc,
    onDelete
}: DeleteDocumentModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        if (!doc) return

        setLoading(true)
        setError(null)

        try {
            await onDelete(doc.id)
            onClose()
        } catch (err) {
            console.error('Delete error:', err)
            setError('Failed to delete document. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!doc) return null

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader onClose={onClose}>
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
                        <Trash2 className="w-5 h-5 text-error" />
                    </div>
                    <h2 className="text-lg font-semibold text-text">Delete Document</h2>
                </div>
            </ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    <p className="text-sm text-text-muted leading-relaxed">
                        Are you sure you want to delete this document? This action cannot be undone.
                    </p>

                    <div className="bg-background rounded-lg p-4 border border-border">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                                    Document
                                </span>
                                <span className="text-xs font-medium text-primary capitalize">
                                    {doc.category.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex items-start gap-2">
                                <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text break-words">
                                        {doc.title}
                                    </p>
                                    {(doc.program || doc.department || doc.semester) && (
                                        <p className="text-xs text-text-muted mt-1">
                                            {[
                                                doc.program,
                                                doc.department,
                                                doc.semester && `Semester ${doc.semester}`
                                            ].filter(Boolean).join(' • ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-error">{error}</p>
                        </div>
                    )}

                    <p className="text-xs text-text-light">
                        All associated data and file chunks will be permanently removed from the system.
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
                    Delete Document
                </Button>
            </ModalFooter>
        </Modal>
    )
}
