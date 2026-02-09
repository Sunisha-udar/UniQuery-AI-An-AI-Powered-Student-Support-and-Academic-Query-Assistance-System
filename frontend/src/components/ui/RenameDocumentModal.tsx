import { useState, useEffect } from 'react'
import { X, FileText, AlertCircle, RotateCcw, History, Clock } from 'lucide-react'
import { Button } from './Button'
import { Input } from './Input'
import { Card, CardContent, CardHeader } from './Card'
import type { Document } from '../../lib/api'
import { api } from '../../lib/api'

interface RenameDocumentModalProps {
    isOpen: boolean
    onClose: () => void
    doc: Document | null
    onRename: (docId: string, newTitle: string) => Promise<void>
    onUndo?: (docId: string) => Promise<void>
}

interface RenameHistoryEntry {
    id: string
    old_title: string
    new_title: string
    renamed_at: string
    renamed_by: string
    undone: boolean
}

export function RenameDocumentModal({ isOpen, onClose, doc, onRename, onUndo }: RenameDocumentModalProps) {
    const [newTitle, setNewTitle] = useState('')
    const [isRenaming, setIsRenaming] = useState(false)
    const [isUndoing, setIsUndoing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const [history, setHistory] = useState<RenameHistoryEntry[]>([])
    const [canUndo, setCanUndo] = useState(false)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    // Reset state when modal opens/closes or doc changes
    useEffect(() => {
        if (isOpen && doc) {
            setNewTitle(doc.title)
            setError(null)
            setShowHistory(false)
            loadHistory()
        }
    }, [isOpen, doc])

    const loadHistory = async () => {
        if (!doc) return

        setIsLoadingHistory(true)
        try {
            const response = await api.getRenameHistory(doc.id, 10)
            setHistory(response.history || [])
            setCanUndo(response.can_undo || false)
        } catch (err) {
            console.error('Failed to load rename history:', err)
        } finally {
            setIsLoadingHistory(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!doc) return

        // Validate
        const trimmedTitle = newTitle.trim()
        if (!trimmedTitle) {
            setError('Title cannot be empty')
            return
        }

        if (trimmedTitle === doc.title) {
            setError('New title must be different from the current title')
            return
        }

        setIsRenaming(true)
        setError(null)

        try {
            await onRename(doc.id, trimmedTitle)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to rename document')
        } finally {
            setIsRenaming(false)
        }
    }

    const handleUndo = async () => {
        if (!doc || !onUndo) return

        setIsUndoing(true)
        setError(null)

        try {
            await onUndo(doc.id)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to undo rename')
        } finally {
            setIsUndoing(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date)
    }

    if (!isOpen || !doc) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-text">Rename Document</h2>
                        <div className="flex items-center gap-2">
                            {canUndo && onUndo && (
                                <button
                                    type="button"
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="p-1 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer"
                                    title="View history"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                disabled={isRenaming || isUndoing}
                                className="p-1 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current Document Info */}
                        <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-muted mb-1">Current Title</p>
                                <p className="text-sm text-text font-medium break-words">{doc.title}</p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                                <span className="text-sm text-error">{error}</span>
                            </div>
                        )}

                        {/* New Title Input */}
                        <Input
                            label="New Title"
                            placeholder="Enter new document title"
                            value={newTitle}
                            onChange={(e) => {
                                setNewTitle(e.target.value)
                                setError(null)
                            }}
                            disabled={isRenaming}
                            autoFocus
                        />

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            {canUndo && onUndo && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleUndo}
                                    disabled={isRenaming || isUndoing}
                                    className="flex items-center gap-2"
                                    title="Undo last rename"
                                >
                                    {isUndoing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            Undoing...
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="w-4 h-4" />
                                            Undo
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={isRenaming || isUndoing}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="cta"
                                disabled={isRenaming || isUndoing || !newTitle.trim()}
                                className="flex-1"
                            >
                                {isRenaming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Renaming...
                                    </>
                                ) : (
                                    'Rename'
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Rename History */}
                    {showHistory && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-text-muted" />
                                <h3 className="text-sm font-medium text-text">Rename History</h3>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : history.length === 0 ? (
                                <p className="text-sm text-text-muted py-4 text-center">No rename history available</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {history.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`p-3 rounded-lg border ${entry.undone
                                                    ? 'bg-background/50 border-border/50 opacity-60'
                                                    : 'bg-background border-border'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-text-muted mb-1">
                                                        {formatDate(entry.renamed_at)}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-text-muted line-through truncate max-w-[120px]">
                                                            {entry.old_title}
                                                        </span>
                                                        <span className="text-text-muted">→</span>
                                                        <span className="text-text font-medium truncate max-w-[120px]">
                                                            {entry.new_title}
                                                        </span>
                                                    </div>
                                                </div>
                                                {entry.undone && (
                                                    <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded-full flex-shrink-0">
                                                        Undone
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-muted">
                                                by {entry.renamed_by}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
