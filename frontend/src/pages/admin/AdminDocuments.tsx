import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { DeleteDocumentModal } from '../../components/ui/DeleteDocumentModal'
import { api, type Document } from '../../lib/api'
import {
    FileText,
    Upload,
    Search,
    Trash2,
    X,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
import { clsx } from 'clsx'

export function AdminDocuments() {
    const [searchQuery, setSearchQuery] = useState('')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Real API state
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Upload form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [title, setTitle] = useState('')

    const location = useLocation()
    const [fixItQuestion, setFixItQuestion] = useState<string | null>(null)

    // Load documents on mount only
    useEffect(() => {
        loadDocuments()
    }, [])

    // Handle URL-driven UI state changes
    useEffect(() => {
        // Check for "Fix It" context
        const searchParams = new URLSearchParams(location.search)
        if (searchParams.get('action') === 'upload') {
            setShowUploadModal(true)
        }

        const storedQuestion = sessionStorage.getItem('fixItQuestion')
        if (storedQuestion) {
            setFixItQuestion(storedQuestion)
        }
    }, [location])

    const loadDocuments = async () => {
        try {
            setLoading(true)
            setError(null)
            const docs = await api.getDocuments()
            setDocuments(docs)
        } catch (err) {
            // Only show error if it's not a network issue or empty collection
            const errorMessage = err instanceof Error ? err.message : 'Failed to load documents'

            // Don't show error for empty collections
            if (!errorMessage.includes('Failed to fetch')) {
                setError(errorMessage)
            }
            console.error('Error loading documents:', err)

            // Set empty array on error so UI shows "No documents found"
            setDocuments([])
        } finally {
            setLoading(false)
        }
    }

    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
        }
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            setError('Please select a file')
            return
        }

        try {
            setUploading(true)
            setError(null)

            await api.uploadDocument(
                selectedFile,
                title
            )

            setUploadSuccess(true)

            // Reset form
            setSelectedFile(null)
            setTitle('')

            // Reload documents
            await loadDocuments()

            // Close modal after delay
            setTimeout(() => {
                setShowUploadModal(false)
                setUploadSuccess(false)
                sessionStorage.removeItem('fixItQuestion')
                setFixItQuestion(null)
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
            console.error('Upload error:', err)
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = (doc: Document) => {
        setSelectedDocument(doc)
        setIsDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async (docId: string) => {
        try {
            await api.deleteDocument(docId)
            await loadDocuments()
            setSelectedDocument(null)
        } catch (err) {
            // Error is handled in the modal
            throw err
        }
    }



    return (

        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-text">Documents</h1>
                                <Badge variant="default" className="text-xs font-semibold">
                                    {documents.length} total
                                </Badge>
                            </div>
                            <p className="text-sm text-text-muted mt-1">Manage uploaded academic documents</p>
                        </div>
                    </div>
                    <Button variant="cta" onClick={() => setShowUploadModal(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Table */}
                <Card>
                    <CardContent className="p-0">
                        {error && (
                            <div className="p-4 bg-error/10 border-b border-error/20 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-error" />
                                <span className="text-sm text-error">{error}</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-text-muted mt-3">Loading documents...</p>
                            </div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="p-8 text-center">
                                <FileText className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                                <p className="text-sm text-text-muted">No documents found</p>
                                <p className="text-xs text-text-muted mt-1">Upload your first document to get started</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Document</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Version</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Chunks</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Uploaded</th>
                                            <th className="text-right text-sm font-medium text-text-muted px-5 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedDocs.map((doc) => (
                                            <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <span className="font-medium text-text">{doc.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.program}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.department}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">v{doc.version}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.chunk_count}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">
                                                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleDelete(doc)}
                                                            className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors cursor-pointer"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                    {filteredDocs.length > ITEMS_PER_PAGE && (
                        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                            <p className="text-sm text-text-muted">
                                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredDocs.length)} of {filteredDocs.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={clsx(
                                                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                                                currentPage === page
                                                    ? 'bg-primary text-white'
                                                    : 'text-text-muted hover:bg-background hover:text-text'
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <DeleteDocumentModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false)
                        setSelectedDocument(null)
                    }}
                    document={selectedDocument}
                    onDelete={handleDeleteConfirm}
                />

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h2 className="font-semibold text-text">Upload Document</h2>
                                    <button
                                        onClick={() => {
                                            setShowUploadModal(false)
                                            setError(null)
                                            setUploadSuccess(false)
                                            sessionStorage.removeItem('fixItQuestion')
                                            setFixItQuestion(null)
                                        }}
                                        className="p-1 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {fixItQuestion && (
                                    <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Fixing Question:</p>
                                        <p className="text-sm text-text italic line-clamp-2">"{fixItQuestion}"</p>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                {uploadSuccess ? (
                                    <div className="py-8 text-center">
                                        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-success" />
                                        </div>
                                        <p className="text-text font-medium">Document uploaded successfully!</p>
                                        <p className="text-sm text-text-muted mt-1">Processing complete</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleUpload} className="space-y-4">
                                        {error && (
                                            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                                                <span className="text-sm text-error">{error}</span>
                                            </div>
                                        )}

                                        <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors">
                                            <input
                                                type="file"
                                                onChange={handleFileSelect}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.txt,.md"
                                                id="file-upload"
                                            />
                                            <Upload className="w-8 h-8 text-text-muted mx-auto mb-3 pointer-events-none" />
                                            {selectedFile ? (
                                                <div className="pointer-events-none">
                                                    <p className="text-sm text-text font-medium mb-1">{selectedFile?.name}</p>
                                                    <p className="text-xs text-text-muted">{(selectedFile?.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <div className="pointer-events-none">
                                                    <p className="text-sm text-text-muted mb-1">Drag & drop file here, or click to browse</p>
                                                    <p className="text-xs text-text-muted">Supported: PDF, Word, Excel, PowerPoint, Text</p>
                                                </div>
                                            )}
                                        </div>

                                        <Input
                                            label="Document Title (Optional)"
                                            placeholder="Leave empty to auto-extract from PDF"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />

                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => {
                                                    setShowUploadModal(false)
                                                    setError(null)
                                                    sessionStorage.removeItem('fixItQuestion')
                                                    setFixItQuestion(null)
                                                }}
                                                disabled={uploading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="cta"
                                                className="flex-1"
                                                disabled={uploading || !selectedFile}
                                            >
                                                {uploading ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Upload
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
