import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
    getUserBookmarks,
    removeBookmark,
    updateBookmarkNotes,
    updateBookmarkTags,
    searchBookmarks,
    type Bookmark
} from '../../lib/bookmarks'
import {
    Bookmark as BookmarkIcon,
    Search,
    Tag,
    Trash2,
    Edit3,
    X,
    Check,
    AlertCircle,
    MessageSquare
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function BookmarksPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editNotes, setEditNotes] = useState('')
    const [editTags, setEditTags] = useState('')

    useEffect(() => {
        loadBookmarks()
    }, [user?.uid])

    const loadBookmarks = async () => {
        if (!user?.uid) return
        try {
            setLoading(true)
            const data = await getUserBookmarks(user.uid)
            setBookmarks(data)
        } catch (err) {
            setError('Failed to load bookmarks')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        if (!user?.uid) return
        if (!searchQuery.trim()) {
            loadBookmarks()
            return
        }
        try {
            setLoading(true)
            const results = await searchBookmarks(user.uid, searchQuery)
            setBookmarks(results)
        } catch (err) {
            setError('Search failed')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (bookmarkId: string) => {
        try {
            await removeBookmark(bookmarkId)
            setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
        } catch (err) {
            setError('Failed to delete bookmark')
            console.error(err)
        }
    }

    const handleEdit = (bookmark: Bookmark) => {
        setEditingId(bookmark.id)
        setEditNotes(bookmark.notes || '')
        setEditTags(bookmark.tags?.join(', ') || '')
    }

    const handleSaveEdit = async (bookmarkId: string) => {
        try {
            await updateBookmarkNotes(bookmarkId, editNotes)
            const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
            await updateBookmarkTags(bookmarkId, tags)
            
            setBookmarks(prev => prev.map(b =>
                b.id === bookmarkId
                    ? { ...b, notes: editNotes, tags }
                    : b
            ))
            setEditingId(null)
        } catch (err) {
            setError('Failed to update bookmark')
            console.error(err)
        }
    }

    const handleGoToChat = (sessionId: string) => {
        navigate(`/student?session=${sessionId}`)
    }

    if (loading && bookmarks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BookmarkIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold text-text">Bookmarks</h1>
                    </div>
                    <p className="text-text-muted">Your saved queries and answers</p>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search bookmarks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-error" />
                        <span className="text-error">{error}</span>
                    </div>
                )}

                {/* Bookmarks List */}
                {bookmarks.length === 0 ? (
                    <div className="text-center py-16">
                        <BookmarkIcon className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-30" />
                        <p className="text-text-muted text-lg">No bookmarks yet</p>
                        <p className="text-text-muted text-sm mt-2">
                            Bookmark important answers from your chats to find them easily later
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {bookmarks.map((bookmark) => (
                            <div
                                key={bookmark.id}
                                className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-all"
                            >
                                {/* Question */}
                                <div className="mb-3">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h3 className="text-lg font-semibold text-text flex-1">
                                            {bookmark.question}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleGoToChat(bookmark.session_id)}
                                                className="p-2 rounded-lg hover:bg-secondary/50 text-text-muted hover:text-text transition-colors"
                                                title="Go to chat"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(bookmark)}
                                                className="p-2 rounded-lg hover:bg-secondary/50 text-text-muted hover:text-text transition-colors"
                                                title="Edit notes and tags"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bookmark.id)}
                                                className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                                                title="Delete bookmark"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Answer */}
                                <div className="mb-3 prose prose-sm dark:prose-invert max-w-none text-text-muted">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {bookmark.answer.length > 300
                                            ? bookmark.answer.slice(0, 300) + '...'
                                            : bookmark.answer}
                                    </ReactMarkdown>
                                </div>

                                {/* Citations */}
                                {bookmark.citations && bookmark.citations.length > 0 && (
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            {bookmark.citations.map((citation: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="text-xs bg-secondary/30 border border-border rounded-full px-3 py-1"
                                                >
                                                    {citation.title} - p.{citation.page}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes and Tags */}
                                {editingId === bookmark.id ? (
                                    <div className="space-y-3 pt-3 border-t border-border">
                                        <div>
                                            <label className="text-xs text-text-muted mb-1 block">Notes</label>
                                            <textarea
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                className="w-full p-2 bg-background border border-border rounded-lg text-sm text-text resize-none focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                                                rows={2}
                                                placeholder="Add notes..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-1 block">Tags (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={editTags}
                                                onChange={(e) => setEditTags(e.target.value)}
                                                className="w-full p-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                                                placeholder="important, exam, review"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(bookmark.id)}
                                                className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm flex items-center gap-1 hover:bg-primary/90"
                                            >
                                                <Check className="w-4 h-4" />
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1.5 bg-secondary text-text rounded-lg text-sm flex items-center gap-1 hover:bg-secondary/80"
                                            >
                                                <X className="w-4 h-4" />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {bookmark.notes && (
                                            <div className="mb-2 pt-3 border-t border-border">
                                                <p className="text-sm text-text-muted italic">{bookmark.notes}</p>
                                            </div>
                                        )}
                                        {bookmark.tags && bookmark.tags.length > 0 && (
                                            <div className="flex items-center gap-2 flex-wrap pt-2">
                                                <Tag className="w-3.5 h-3.5 text-text-muted" />
                                                {bookmark.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Timestamp */}
                                <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs text-text-muted">
                                        Saved {new Date(bookmark.created_at).toLocaleDateString()} at{' '}
                                        {new Date(bookmark.created_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
