
import { Card, CardContent } from '../../components/ui/Card'
import { MessageSquare, User, Clock, TrendingUp, TrendingDown, Minus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllUserQueries } from '../../lib/chatHistory'
import { Button } from '../../components/ui/Button'
import { clsx } from 'clsx'
import { ManualAnswerModal } from '../../components/admin/ManualAnswerModal'
import { Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QueryWithDetails {
    id: string
    userId: string
    question: string
    timestamp: Date
    confidence?: number
    feedback?: 'up' | 'down'
}

export function AdminQueries() {
    const [queries, setQueries] = useState<QueryWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10
    const [isManualAnswerModalOpen, setIsManualAnswerModalOpen] = useState(false)
    const [selectedQuestion, setSelectedQuestion] = useState('')
    const navigate = useNavigate()
    // Placeholder for future "View Chat" modal
    // const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null)

    useEffect(() => {
        loadQueries()
    }, [])

    const loadQueries = async () => {
        try {
            setLoading(true)
            const userQueries = await getAllUserQueries(200) // Fetch more for pagination
            console.log('[AdminQueries] Fetched queries:', userQueries.length)

            // Extract all user questions with their metadata
            const allQueries: QueryWithDetails[] = userQueries.map((q) => ({
                id: q.id,
                userId: q.user_id,
                question: q.question,
                timestamp: new Date(q.created_at),
                confidence: q.confidence,
                feedback: q.feedback
            }))

            console.log('[AdminQueries] Extracted queries:', allQueries.length)

            // Sort by most recent
            allQueries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

            setQueries(allQueries)
            setError(null)
        } catch (err) {
            console.error('Failed to load queries:', err)
            setError('Failed to load user queries. Check console for details.')
        } finally {
            setLoading(false)
        }
    }

    const filteredQueries = queries.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.userId.toLowerCase().includes(searchQuery.toLowerCase())

        if (searchQuery.toLowerCase() === 'helpful') {
            return q.feedback === 'up'
        }
        if (searchQuery.toLowerCase() === 'not helpful') {
            return q.feedback === 'down'
        }

        return matchesSearch
    })

    const totalPages = Math.ceil(filteredQueries.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedQueries = filteredQueries.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const getConfidenceBadge = (confidence?: number) => {
        if (confidence === undefined) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-border/50 text-text-muted text-xs font-medium">
                    <Minus className="w-3.5 h-3.5" />
                    N/A
                </div>
            )
        }

        if (confidence >= 0.9) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    High ({Math.round(confidence * 100)}%)
                </div>
            )
        } else if (confidence >= 0.7) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                    <Minus className="w-3.5 h-3.5" />
                    Med ({Math.round(confidence * 100)}%)
                </div>
            )
        } else {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Low ({Math.round(confidence * 100)}%)
                </div>
            )
        }
    }

    const getFeedbackBadge = (feedback?: 'up' | 'down') => {
        if (!feedback) return null;

        if (feedback === 'up') {
            return (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wider border border-green-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M7.493 18.525a3.951 3.951 0 0 1-3.418-2.022 3.947 3.947 0 0 1-.223-3.61l1.528-3.328A3.957 3.957 0 0 1 8.955 7.5h1.53c1.077 0 2.052-.403 2.768-1.07l.211-.198a6 6 0 0 0 1.956-4.522 10.662 10.662 0 0 1 .867-.674 1.5 1.5 0 0 1 2.37.95l.409 3.064c.264 1.973 1.258 3.737 2.784 4.96A9.957 9.957 0 0 1 24 17.5a2.5 2.5 0 0 1-2.5 2.5h-9.5c-1.396 0-2.618-.4-3.791-.796-1.127-.38-2.222-.75-3.535-.75h-3.181a1.493 1.493 0 0 1-1.353-.8z" />
                        <path d="M1.5 8C1.224 8 1 8.224 1 8.5v12c0 .276.224.5.5.5h4V8h-4z" />
                    </svg>
                    Helpful
                </div>
            )
        }

        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-wider border border-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M16.507 5.475a3.951 3.951 0 0 1 3.418 2.022 3.947 3.947 0 0 1 .223 3.61l-1.528 3.328A3.957 3.957 0 0 1 15.045 16.5h-1.53c-1.077 0-2.052.403-2.768 1.07l-.211.198a6 6 0 0 0-1.956 4.522 10.662 10.662 0 0 1-.867.674 1.5 1.5 0 0 1-2.37-.95l-.409-3.064c-.264-1.973-1.258-3.737-2.784-4.96A9.957 9.957 0 0 1 0 6.5 2.5 2.5 0 0 1 2.5 4h9.5c1.396 0 2.618.4 3.791.796 1.127.38 2.222.75 3.535.75h3.181a1.493 1.493 0 0 1 1.353.8z" />
                    <path d="M22.5 16c.276 0 .5-.224.5-.5v-12a.5.5 0 0 0-.5-.5h-4v13h4z" />
                </svg>
                Not Helpful
            </div>
        )
    }

    const formatTimestamp = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">User Queries</h1>
                            <p className="text-sm text-text-muted mt-1">Monitor and manage student questions</p>
                        </div>
                    </div>
                    <button
                        onClick={loadQueries}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Total Queries</p>
                                    <p className="text-2xl font-bold text-text mt-1">{filteredQueries.length}</p>
                                </div>
                                <MessageSquare className="w-8 h-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Avg Confidence</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {filteredQueries.filter(q => q.confidence !== undefined).length > 0
                                            ? Math.round(
                                                filteredQueries
                                                    .filter(q => q.confidence !== undefined)
                                                    .reduce((acc, q) => acc + (q.confidence || 0), 0) /
                                                filteredQueries.filter(q => q.confidence !== undefined).length *
                                                100
                                            ) + '%'
                                            : 'N/A'}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Low Confidence</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {filteredQueries.filter(q => q.confidence !== undefined && q.confidence < 0.7).length}
                                    </p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
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
                                        placeholder="Search queries by question or user ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Queries Table/Cards */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="!p-0">
                        {loading ? (
                            <div className="py-16 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-sm text-text-muted">Loading queries...</p>
                            </div>
                        ) : error ? (
                            <div className="py-16 text-center">
                                <MessageSquare className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-text mb-2">Error Loading Queries</h3>
                                <p className="text-sm text-text-muted max-w-md mx-auto">{error}</p>
                            </div>
                        ) : queries.length === 0 ? (
                            <div className="py-16 text-center">
                                <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-text mb-2">No Queries Yet</h3>
                                <p className="text-sm text-text-muted max-w-md mx-auto">
                                    User queries will appear here once students start asking questions.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View - Hidden on Mobile */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/30 border-b border-border">
                                            <tr>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Question
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Confidence
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Time
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {paginatedQueries.map((query, idx) => (
                                                <tr key={`${query.id}-${idx}`}>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <span className="text-sm text-text font-medium truncate max-w-[150px]">
                                                                {query.userId.substring(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex flex-col gap-1.5">
                                                            <p className="text-sm text-text line-clamp-2 max-w-md">
                                                                {query.question}
                                                            </p>
                                                            {query.feedback && (
                                                                <div className="flex items-center">
                                                                    {getFeedbackBadge(query.feedback)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        {getConfidenceBadge(query.confidence)}
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-1.5 text-sm text-text-muted">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatTimestamp(query.timestamp)}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    sessionStorage.setItem('fixItQuestion', query.question)
                                                                    navigate('/admin/documents?action=upload')
                                                                }}
                                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                                                                title="Upload Document"
                                                            >
                                                                <Upload className="w-3.5 h-3.5" />
                                                                Upload
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setSelectedQuestion(query.question)
                                                                    setIsManualAnswerModalOpen(true)
                                                                }}
                                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-medium transition-colors"
                                                                title="Provide Manual Answer"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                Answer
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View - Shown on Mobile Only */}
                                <div className="md:hidden space-y-3 p-4">
                                    {paginatedQueries.map((query, idx) => (
                                        <div
                                            key={`${query.id}-${idx}`}
                                            className="bg-surface border border-border rounded-lg p-4"
                                        >
                                            {/* User and Time Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-sm text-text font-medium">
                                                        {query.userId.substring(0, 12)}...
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {formatTimestamp(query.timestamp)}
                                                </div>
                                            </div>

                                            {/* Question */}
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs text-text-muted">Question</p>
                                                    {query.feedback && getFeedbackBadge(query.feedback)}
                                                </div>
                                                <p className="text-sm text-text leading-relaxed">
                                                    {query.question}
                                                </p>
                                            </div>

                                            {/* Confidence Badge */}
                                            <div className="mb-3">
                                                <p className="text-xs text-text-muted mb-1">Confidence</p>
                                                {getConfidenceBadge(query.confidence)}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-3 border-t border-border">
                                                <button
                                                    onClick={() => {
                                                        sessionStorage.setItem('fixItQuestion', query.question)
                                                        navigate('/admin/documents?action=upload')
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                                                >
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Upload Doc
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setSelectedQuestion(query.question)
                                                        setIsManualAnswerModalOpen(true)
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-medium transition-colors"
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    Answer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                    {filteredQueries.length > ITEMS_PER_PAGE && (
                        <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                            <p className="text-sm text-text-muted">
                                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredQueries.length)} of {filteredQueries.length}
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
                                <div className="hidden md:flex items-center gap-1">
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

                <ManualAnswerModal
                    isOpen={isManualAnswerModalOpen}
                    onClose={() => setIsManualAnswerModalOpen(false)}
                    question={selectedQuestion}
                    onSuccess={loadQueries}
                />
            </div>
        </div>
    )
}
