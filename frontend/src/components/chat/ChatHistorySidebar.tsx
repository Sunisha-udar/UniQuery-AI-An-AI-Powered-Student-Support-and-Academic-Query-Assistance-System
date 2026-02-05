import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import { loadChatSessions, deleteChatSession, type ChatSession } from '../../lib/chatHistory'
import { DeleteChatModal } from '../ui/DeleteChatModal'

interface ChatHistorySidebarProps {
    userId: string
    currentSessionId: string | null
    onSelectSession: (sessionId: string) => void
    onNewChat: () => void
}

export function ChatHistorySidebar({ userId, currentSessionId, onSelectSession, onNewChat }: ChatHistorySidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)

    useEffect(() => {
        loadSessions()

        // Listen for updates from StudentDashboard
        const handleSessionUpdate = () => {
            loadSessions()
        }

        window.addEventListener('chat-session-updated', handleSessionUpdate)

        return () => {
            window.removeEventListener('chat-session-updated', handleSessionUpdate)
        }
    }, [userId])

    const loadSessions = async () => {
        try {
            setLoading(true)
            const loadedSessions = await loadChatSessions(userId)
            setSessions(loadedSessions)
        } catch (err) {
            console.error('Failed to load sessions:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (session: ChatSession, e: React.MouseEvent) => {
        e.stopPropagation()
        setSessionToDelete(session)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!sessionToDelete) return

        await deleteChatSession(sessionToDelete.id)
        setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id))

        // If deleting current session, create new one
        if (sessionToDelete.id === currentSessionId) {
            onNewChat()
        }
    }

    const formatDate = (date: any) => {
        const d = date?.toDate ? date.toDate() : new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return d.toLocaleDateString()
    }

    return (
        <div className="w-64 bg-white flex flex-col h-full border-r border-gray-200">
            {/* Header */}
            <div className="p-3 border-b border-gray-200">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">New Chat</span>
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No chat history yet</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => onSelectSession(session.id)}
                                className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id
                                        ? 'bg-gray-100'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate text-gray-800">{session.title}</p>
                                    <p className="text-xs text-gray-500">{formatDate(session.updatedAt)}</p>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteClick(session, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                                    aria-label="Delete chat"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    {sessions.length} {sessions.length === 1 ? 'chat' : 'chats'}
                </p>
            </div>

            {/* Delete Modal */}
            <DeleteChatModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                chatTitle={sessionToDelete?.title || ''}
            />
        </div>
    )
}
