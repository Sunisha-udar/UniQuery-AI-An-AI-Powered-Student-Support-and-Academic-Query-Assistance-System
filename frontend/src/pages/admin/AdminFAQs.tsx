import { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { api, type FAQItem, type CreateFAQRequest } from '../../lib/api'
import {
    HelpCircle,
    Plus,
    Search,
    Edit2,
    Trash2,
    Pin,
    PinOff,
    TrendingUp,
    X,
    Save,
    AlertCircle,
    Check
} from 'lucide-react'
import { clsx } from 'clsx'

export function AdminFAQs() {
    const [faqs, setFaqs] = useState<FAQItem[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    
    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedFAQ, setSelectedFAQ] = useState<FAQItem | null>(null)
    
    // Form states
    const [formData, setFormData] = useState<CreateFAQRequest>({
        question: '',
        answer: '',
        category: 'General',
        program: 'All',
        department: 'All',
        semester: 0,
        is_pinned: false
    })
    const [formError, setFormError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    useEffect(() => {
        loadFAQs()
        loadCategories()
    }, [])

    const loadFAQs = async () => {
        try {
            setLoading(true)
            const data = await api.getFAQs({ limit: 100 })
            setFaqs(data)
            setError(null)
        } catch (err) {
            console.error('Failed to load FAQs:', err)
            setError('Failed to load FAQs. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const cats = await api.getFAQCategories()
            // Ensure we always have at least "General" category
            if (cats.length === 0) {
                setCategories(['General'])
            } else {
                setCategories(cats)
            }
        } catch (err) {
            console.error('Failed to load categories:', err)
            // Fallback to default categories
            setCategories(['General', 'Attendance', 'Exams', 'Academics', 'Facilities', 'Fees'])
        }
    }

    const handleCreateFAQ = async () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            setFormError('Question and answer are required')
            return
        }

        try {
            setSubmitting(true)
            setFormError(null)
            await api.createFAQ(formData)
            await loadFAQs()
            await loadCategories()
            setIsCreateModalOpen(false)
            resetForm()
        } catch (err) {
            console.error('Failed to create FAQ:', err)
            setFormError(err instanceof Error ? err.message : 'Failed to create FAQ')
        } finally {
            setSubmitting(false)
        }
    }

    const handleUpdateFAQ = async () => {
        if (!selectedFAQ || !formData.question.trim() || !formData.answer.trim()) {
            setFormError('Question and answer are required')
            return
        }

        try {
            setSubmitting(true)
            setFormError(null)
            await api.updateFAQ(selectedFAQ.id, formData)
            await loadFAQs()
            await loadCategories()
            setIsEditModalOpen(false)
            setSelectedFAQ(null)
            resetForm()
        } catch (err) {
            console.error('Failed to update FAQ:', err)
            setFormError(err instanceof Error ? err.message : 'Failed to update FAQ')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteFAQ = async () => {
        if (!selectedFAQ) return

        try {
            setSubmitting(true)
            await api.deleteFAQ(selectedFAQ.id)
            await loadFAQs()
            await loadCategories()
            setIsDeleteModalOpen(false)
            setSelectedFAQ(null)
        } catch (err) {
            console.error('Failed to delete FAQ:', err)
            setFormError(err instanceof Error ? err.message : 'Failed to delete FAQ')
        } finally {
            setSubmitting(false)
        }
    }

    const handleTogglePin = async (faq: FAQItem) => {
        try {
            await api.updateFAQ(faq.id, { is_pinned: !faq.is_pinned })
            await loadFAQs()
        } catch (err) {
            console.error('Failed to toggle pin:', err)
        }
    }

    const openEditModal = (faq: FAQItem) => {
        setSelectedFAQ(faq)
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            program: faq.program || 'All',
            department: faq.department || 'All',
            semester: faq.semester || 0,
            is_pinned: faq.is_pinned
        })
        setIsEditModalOpen(true)
    }

    const openDeleteModal = (faq: FAQItem) => {
        setSelectedFAQ(faq)
        setIsDeleteModalOpen(true)
    }

    const resetForm = () => {
        setFormData({
            question: '',
            answer: '',
            category: 'General',
            program: 'All',
            department: 'All',
            semester: 0,
            is_pinned: false
        })
        setFormError(null)
        setShowNewCategoryInput(false)
        setNewCategoryName('')
    }

    const handleCategoryChange = (value: string) => {
        if (value === '__new__') {
            setShowNewCategoryInput(true)
            setNewCategoryName('')
        } else {
            setShowNewCategoryInput(false)
            setFormData({ ...formData, category: value })
        }
    }

    const handleNewCategorySubmit = () => {
        if (newCategoryName.trim()) {
            setFormData({ ...formData, category: newCategoryName.trim() })
            setShowNewCategoryInput(false)
        }
    }

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = 
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesCategory = 
            selectedCategory === 'all' || 
            faq.category.toLowerCase() === selectedCategory.toLowerCase()
        
        return matchesSearch && matchesCategory
    })

    const pinnedFAQs = filteredFAQs.filter(faq => faq.is_pinned)
    const regularFAQs = filteredFAQs.filter(faq => !faq.is_pinned)

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">Manage FAQs</h1>
                            <p className="text-sm text-text-muted mt-1">Create and manage frequently asked questions</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            resetForm()
                            setIsCreateModalOpen(true)
                        }}
                        className="w-full sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add FAQ
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Total FAQs</p>
                                    <p className="text-2xl font-bold text-text mt-1">{faqs.length}</p>
                                </div>
                                <HelpCircle className="w-8 h-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Pinned FAQs</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {faqs.filter(f => f.is_pinned).length}
                                    </p>
                                </div>
                                <Pin className="w-8 h-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Total Views</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {faqs.reduce((sum, faq) => sum + faq.view_count, 0)}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="py-4">
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search FAQs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={clsx(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                        selectedCategory === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-surface text-text-muted hover:bg-muted hover:text-text'
                                    )}
                                >
                                    All
                                </button>
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                            selectedCategory === category
                                                ? 'bg-primary text-white'
                                                : 'bg-surface text-text-muted hover:bg-muted hover:text-text'
                                        )}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loading State */}
                {loading && (
                    <Card>
                        <div className="py-16 text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-sm text-text-muted">Loading FAQs...</p>
                        </div>
                    </Card>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card>
                        <div className="py-16 text-center px-4">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-text mb-2">Error Loading FAQs</h3>
                            <p className="text-sm text-text-muted max-w-md mx-auto">{error}</p>
                            <button
                                onClick={loadFAQs}
                                className="mt-4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </Card>
                )}

                {/* Empty State */}
                {!loading && !error && faqs.length === 0 && (
                    <Card>
                        <div className="py-16 text-center px-4">
                            <HelpCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-text mb-2">No FAQs Yet</h3>
                            <p className="text-sm text-text-muted max-w-md mx-auto mb-4">
                                Get started by creating your first FAQ to help students find answers quickly.
                            </p>
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create First FAQ
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Pinned FAQs */}
                {!loading && !error && pinnedFAQs.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                            <Pin className="w-4 h-4" />
                            <span>Pinned FAQs</span>
                        </div>
                        {pinnedFAQs.map(faq => (
                            <FAQCard
                                key={faq.id}
                                faq={faq}
                                onEdit={openEditModal}
                                onDelete={openDeleteModal}
                                onTogglePin={handleTogglePin}
                            />
                        ))}
                    </div>
                )}

                {/* Regular FAQs */}
                {!loading && !error && regularFAQs.length > 0 && (
                    <div className="space-y-3">
                        {pinnedFAQs.length > 0 && (
                            <div className="text-sm font-medium text-text-muted pt-4">
                                All FAQs
                            </div>
                        )}
                        {regularFAQs.map(faq => (
                            <FAQCard
                                key={faq.id}
                                faq={faq}
                                onEdit={openEditModal}
                                onDelete={openDeleteModal}
                                onTogglePin={handleTogglePin}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(isCreateModalOpen || isEditModalOpen) && (
                <FAQFormModal
                    isOpen={isCreateModalOpen || isEditModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false)
                        setIsEditModalOpen(false)
                        setSelectedFAQ(null)
                        resetForm()
                    }}
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={isEditModalOpen ? handleUpdateFAQ : handleCreateFAQ}
                    submitting={submitting}
                    error={formError}
                    title={isEditModalOpen ? 'Edit FAQ' : 'Create New FAQ'}
                    categories={categories}
                    showNewCategoryInput={showNewCategoryInput}
                    newCategoryName={newCategoryName}
                    setNewCategoryName={setNewCategoryName}
                    onCategoryChange={handleCategoryChange}
                    onNewCategorySubmit={handleNewCategorySubmit}
                />
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && selectedFAQ && (
                <DeleteConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => {
                        setIsDeleteModalOpen(false)
                        setSelectedFAQ(null)
                    }}
                    onConfirm={handleDeleteFAQ}
                    faqQuestion={selectedFAQ.question}
                    submitting={submitting}
                />
            )}
        </div>
    )
}

// FAQ Card Component
function FAQCard({
    faq,
    onEdit,
    onDelete,
    onTogglePin
}: {
    faq: FAQItem
    onEdit: (faq: FAQItem) => void
    onDelete: (faq: FAQItem) => void
    onTogglePin: (faq: FAQItem) => void
}) {
    return (
        <Card className="border border-border shadow-sm">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-base font-semibold text-text">
                                {faq.question}
                            </h3>
                            {faq.is_pinned && (
                                <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-sm text-text-muted line-clamp-2 mb-3">
                            {faq.answer}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                                {faq.category}
                            </span>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{faq.view_count} views</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => onTogglePin(faq)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title={faq.is_pinned ? 'Unpin' : 'Pin'}
                        >
                            {faq.is_pinned ? (
                                <PinOff className="w-4 h-4 text-text-muted" />
                            ) : (
                                <Pin className="w-4 h-4 text-text-muted" />
                            )}
                        </button>
                        <button
                            onClick={() => onEdit(faq)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4 text-text-muted" />
                        </button>
                        <button
                            onClick={() => onDelete(faq)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// FAQ Form Modal Component
function FAQFormModal({
    isOpen,
    onClose,
    formData,
    setFormData,
    onSubmit,
    submitting,
    error,
    title,
    categories,
    showNewCategoryInput,
    newCategoryName,
    setNewCategoryName,
    onCategoryChange,
    onNewCategorySubmit
}: {
    isOpen: boolean
    onClose: () => void
    formData: CreateFAQRequest
    setFormData: (data: CreateFAQRequest) => void
    onSubmit: () => void
    submitting: boolean
    error: string | null
    title: string
    categories: string[]
    showNewCategoryInput: boolean
    newCategoryName: string
    setNewCategoryName: (name: string) => void
    onCategoryChange: (value: string) => void
    onNewCategorySubmit: () => void
}) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">
                            Question *
                        </label>
                        <Input
                            value={formData.question}
                            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                            placeholder="What is the attendance policy?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text mb-2">
                            Answer *
                        </label>
                        <textarea
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            placeholder="Students must maintain a minimum of 75% attendance..."
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Category *
                            </label>
                            {!showNewCategoryInput ? (
                                <select
                                    value={formData.category}
                                    onChange={(e) => onCategoryChange(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    <option value="__new__">+ Add New Category</option>
                                </select>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Enter new category name"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                onNewCategorySubmit()
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={onNewCategorySubmit}
                                        className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex-shrink-0"
                                        disabled={!newCategoryName.trim()}
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onCategoryChange(categories[0] || 'General')
                                        }}
                                        className="px-3 py-2 rounded-lg bg-muted text-text-muted hover:bg-border transition-colors flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Program
                            </label>
                            <Input
                                value={formData.program || 'All'}
                                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                                placeholder="All, B.Tech, M.Tech"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Department
                            </label>
                            <Input
                                value={formData.department || 'All'}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                placeholder="All, CSE, ECE"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                Semester
                            </label>
                            <Input
                                type="number"
                                value={formData.semester || 0}
                                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 0 })}
                                placeholder="0 for all semesters"
                                min="0"
                                max="10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_pinned"
                            checked={formData.is_pinned}
                            onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="is_pinned" className="text-sm text-text cursor-pointer">
                            Pin this FAQ (appears at the top)
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t border-border flex items-center justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting}>
                        {submitting ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save FAQ
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// Delete Confirm Modal Component
function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    faqQuestion,
    submitting
}: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    faqQuestion: string
    submitting: boolean
}) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-text">Delete FAQ</h2>
                    </div>

                    <p className="text-sm text-text-muted mb-4">
                        Are you sure you want to delete this FAQ? This action cannot be undone.
                    </p>

                    <div className="p-3 rounded-lg bg-muted mb-6">
                        <p className="text-sm text-text font-medium">{faqQuestion}</p>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="secondary" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <button
                            onClick={onConfirm}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete FAQ
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
