import { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Search, Clock, MessageSquare, X } from 'lucide-react'
import { clsx } from 'clsx'

export interface ChatSearchResult {
    sessionId: string
    sessionTitle: string
    messageId: string
    messageText: string
    messageType: 'user' | 'assistant'
    timestamp: string
    matchedText: string
}

interface ChatHistorySearchProps {
    onResultClick: (sessionId: string, messageId: string) => void
    userId: string
}

export function ChatHistorySearch({ onResultClick, userId }: ChatHistorySearchProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [results, setResults] = useState<ChatSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setResults([])
            return
        }

        const searchTimeout = setTimeout(() => {
            searchChatHistory(searchQuery)
        }, 300) // Debounce

        return () => clearTimeout(searchTimeout)
    }, [searchQuery])

    const searchChatHistory = async (query: string) => {
        setLoading(true)
        try {
            // This would call your backend API to search chat history
            // For now, we'll use local storage as a placeholder
            const sessions = JSON.parse(localStorage.getItem(`chat_sessions_${userId}`) || '[]')
            
            const searchResults: ChatSearchResult[] = []
            const lowerQuery = query.toLowerCase()

            sessions.forEach((session: any) => {
                session.messages?.forEach((message: any) => {
                    if (message.text.toLowerCase().includes(lowerQuery)) {
                        searchResults.push({
                            sessionId: session.id,
                            sessionTitle: session.title,
                            messageId: message.id,
                            messageText: message.text,
                            messageType: message.type,
                            timestamp: session.updatedAt || session.createdAt,
                            matchedText: highlightMatch(message.text, query)
                        })
                    }
                })
            })

            setResults(searchResults.slice(0, 10)) // Limit to 10 results
        } catch (err) {
            console.error('Failed to search chat history:', err)
        } finally {
            setLoading(false)
        }
    }

    const highlightMatch = (text: string, query: string): string => {
        const index = text.toLowerCase().indexOf(query.toLowerCase())
        if (index === -1) return text.substring(0, 100) + '...'

        const start = Math.max(0, index - 40)
        const end = Math.min(text.length, index + query.length + 40)
        let snippet = text.substring(start, end)

        if (start > 0) snippet = '...' + snippet
        if (end < text.length) snippet = snippet + '...'

        return snippet
    }

    const handleClear = () => {
        setSearchQuery('')
        setResults([])
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search in chat history..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setIsExpanded(true)
                    }}
                    onFocus={() => setIsExpanded(true)}
                    className="w-full h-10 pl-10 pr-10 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {searchQuery && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-text-muted" />
                    </button>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isExpanded && (searchQuery.length >= 2 || results.length > 0) && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-lg">
                    <CardContent className="p-2">
                        {loading && (
                            <div className="py-8 text-center">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-sm text-text-muted">Searching...</p>
                            </div>
                        )}

                        {!loading && results.length === 0 && searchQuery.length >= 2 && (
                            <div className="py-8 text-center">
                                <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-text-muted">No messages found</p>
                            </div>
                        )}

                        {!loading && results.length > 0 && (
                            <div className="space-y-1">
                                {results.map((result) => (
                                    <button
                                        key={`${result.sessionId}-${result.messageId}`}
                                        onClick={() => {
                                            onResultClick(result.sessionId, result.messageId)
                                            setIsExpanded(false)
                                            setSearchQuery('')
                                        }}
                                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-start gap-2 mb-1">
                                            <MessageSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text truncate">
                                                    {result.sessionTitle}
                                                </p>
                                                <p className="text-xs text-text-muted line-clamp-2 mt-1">
                                                    {result.matchedText}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-muted ml-6">
                                            <Clock className="w-3 h-3" />
                                            {new Date(result.timestamp).toLocaleDateString()}
                                            <span className={clsx(
                                                'px-1.5 py-0.5 rounded text-xs',
                                                result.messageType === 'user'
                                                    ? 'bg-blue-500/10 text-blue-600'
                                                    : 'bg-green-500/10 text-green-600'
                                            )}>
                                                {result.messageType === 'user' ? 'Question' : 'Answer'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Backdrop to close dropdown */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    )
}
