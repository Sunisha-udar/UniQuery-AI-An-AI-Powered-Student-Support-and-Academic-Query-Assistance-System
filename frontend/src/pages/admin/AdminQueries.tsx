
import { Card, CardContent } from '../../components/ui/Card'
import { MessageSquare, User, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllChatSessionsForAdmin, type ChatMessage } from '../../lib/chatHistory'

interface QueryWithDetails {
    id: string
    userId: string
    question: string
    timestamp: Date
    confidence?: number
}

export function AdminQueries() {
    const [queries, setQueries] = useState<QueryWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // Placeholder for future "View Chat" modal
    // const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null)

    useEffect(() => {
        loadQueries()
    }, [])

    const loadQueries = async () => {
        try {
            setLoading(true)
            const sessions = await getAllChatSessionsForAdmin(100)

            // Extract all user questions with their metadata
            const allQueries: QueryWithDetails[] = []

            sessions.forEach(session => {
                session.messages.forEach((msg: ChatMessage) => {
                    if (msg.type === 'user') {
                        allQueries.push({
                            id: session.id,
                            userId: session.userId,
                            question: msg.text,
                            timestamp: new Date(msg.timestamp),
                            confidence: session.messages.find(
                                (m: ChatMessage) => m.type === 'assistant' && m.timestamp > msg.timestamp
                            )?.confidence
                        })
                    }
                })
            })

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
                <div className="flex items-center justify-between">
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
                        className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
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
                                    <p className="text-2xl font-bold text-text mt-1">{queries.length}</p>
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
                                        {queries.filter(q => q.confidence !== undefined).length > 0
                                            ? Math.round(
                                                queries
                                                    .filter(q => q.confidence !== undefined)
                                                    .reduce((acc, q) => acc + (q.confidence || 0), 0) /
                                                queries.filter(q => q.confidence !== undefined).length *
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
                                        {queries.filter(q => q.confidence !== undefined && q.confidence < 0.7).length}
                                    </p>
                                </div>
                                <TrendingDown className="w-8 h-8 text-red-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Queries Table */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-0">
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-muted/30 border-b border-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                Question
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                Confidence
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                Time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {queries.map((query, idx) => (
                                            <tr key={`${query.id}-${idx}`} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm text-text font-medium truncate max-w-[150px]">
                                                            {query.userId.substring(0, 8)}...
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-text line-clamp-2 max-w-md">
                                                        {query.question}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {getConfidenceBadge(query.confidence)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 text-sm text-text-muted">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatTimestamp(query.timestamp)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
