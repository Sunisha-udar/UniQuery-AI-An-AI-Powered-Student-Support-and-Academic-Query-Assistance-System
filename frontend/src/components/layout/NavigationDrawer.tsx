import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { LogoutModal } from '../ui/LogoutModal'
import { DeleteChatModal } from '../ui/DeleteChatModal'
import { useState, useEffect } from 'react'
import { loadChatSessions, deleteChatSession, updateSessionTitle, type ChatSession } from '../../lib/chatHistory'
import {
    Settings,
    LogOut,
    Moon,
    Sun,
    User,
    Plus,
    MessageSquare,
    Search,
    HelpCircle,
    MoreHorizontal,
    Share2,
    Edit2,
    Trash2,
    Check,
    X,
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
    icon: React.ElementType
    label: string
    href: string
}

interface NavigationDrawerProps {
    isOpen: boolean
    onClose: () => void
    variant: 'admin' | 'student'
    adminNavItems?: NavItem[]
}

const STUDENT_BOTTOM_ITEMS: NavItem[] = [
    { icon: Settings, label: 'Settings', href: '/student/settings' },
    { icon: HelpCircle, label: 'FAQs', href: '/student/faqs' },
]

const ADMIN_BOTTOM_ITEMS: NavItem[] = [
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export function NavigationDrawer({
    isOpen,
    onClose,
    variant,
    adminNavItems = []
}: NavigationDrawerProps) {
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const currentSessionId = searchParams.get('session')

    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)

    const bottomItems = variant === 'student' ? STUDENT_BOTTOM_ITEMS : ADMIN_BOTTOM_ITEMS

    // Load chat sessions for students
    useEffect(() => {
        if (variant === 'student' && user?.uid && isOpen) {
            loadSessions()
        }

        const handleSessionCreated = (e: Event) => {
            const detail = (e as CustomEvent).detail
            setSessions(prev => [detail, ...prev])
        }

        const handleSessionUpdated = (e: Event) => {
            const detail = (e as CustomEvent).detail
            setSessions(prev => prev.map(s =>
                s.id === detail.id
                    ? { ...s, title: detail.title, updatedAt: detail.updatedAt }
                    : s
            ))
        }

        window.addEventListener('chat-session-created', handleSessionCreated)
        window.addEventListener('chat-session-updated', handleSessionUpdated)

        return () => {
            window.removeEventListener('chat-session-created', handleSessionCreated)
            window.removeEventListener('chat-session-updated', handleSessionUpdated)
        }
    }, [variant, user?.uid, isOpen])

    const loadSessions = async () => {
        if (!user?.uid) return
        try {
            setLoading(true)
            const loadedSessions = await loadChatSessions(user.uid)
            setSessions(loadedSessions)
        } catch (err) {
            console.error('Failed to load sessions:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleNavClick = (href: string) => {
        navigate(href)
        onClose()
    }

    const handleDeleteConfirm = async () => {
        if (!sessionToDelete) return
        await deleteChatSession(sessionToDelete.id)
        setSessions(prev => prev.filter(s => s.id !== sessionToDelete.id))
        if (sessionToDelete.id === currentSessionId) {
            navigate('/student')
        }
    }

    const handleShare = (session: ChatSession) => {
        const url = `${window.location.origin}/student?session=${session.id}`
        navigator.clipboard.writeText(url)
        setOpenMenuId(null)
    }

    const handleRenameClick = (session: ChatSession) => {
        setEditingSessionId(session.id)
        setEditTitle(session.title)
        setOpenMenuId(null)
    }

    const handleRenameSubmit = async () => {
        if (!editingSessionId || !editTitle.trim()) {
            setEditingSessionId(null)
            return
        }
        try {
            await updateSessionTitle(editingSessionId, editTitle.trim())
            setSessions(prev => prev.map(s =>
                s.id === editingSessionId
                    ? { ...s, title: editTitle.trim(), updatedAt: new Date().toISOString() }
                    : s
            ))
        } catch (err) {
            console.error('Failed to rename session:', err)
        } finally {
            setEditingSessionId(null)
        }
    }



    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 z-30 md:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.nav
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed left-0 top-0 h-screen w-72 bg-surface border-r border-border z-40 md:hidden flex flex-col"
                    >
                        {/* Header with Logo */}
                        <div className="flex items-center justify-between p-3 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center overflow-hidden">
                                    <img src="/logo.png" alt="UniQuery Logo" className="w-full h-full object-cover" />
                                </div>
                                <span className="font-semibold text-text text-base">UniQuery AI</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-sidebar-hover transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Admin Navigation Items */}
                        {variant === 'admin' && adminNavItems.length > 0 && (
                            <div className="p-3 space-y-1">
                                {adminNavItems.map((item) => {
                                    const isActive =
                                        location.pathname === item.href ||
                                        (item.href !== '/admin' &&
                                            location.pathname.startsWith(item.href))

                                    return (
                                        <button
                                            key={item.href}
                                            onClick={() => handleNavClick(item.href)}
                                            className={clsx(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200',
                                                isActive
                                                    ? 'bg-sidebar-active text-text'
                                                    : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                                            )}
                                        >
                                            <item.icon className="w-5 h-5 flex-shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Student: New Chat + Search + Chat List */}
                        {variant === 'student' && (
                            <>
                                {/* New Chat Button */}
                                <div className="p-3 pb-0">
                                    <button
                                        onClick={() => {
                                            navigate('/student')
                                            onClose()
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span className="text-sm font-medium">New chat</span>
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="px-3 py-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search chats"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-sidebar-hover border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                                        />
                                    </div>
                                </div>

                                {/* YOUR CHATS label */}
                                <div className="px-4 py-2">
                                    <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Your Chats</span>
                                </div>

                                {/* Chat List */}
                                <div className="flex-1 overflow-y-auto px-2">
                                    {loading ? (
                                        <div className="text-center py-4 text-text-muted text-sm">Loading...</div>
                                    ) : filteredSessions.length === 0 ? (
                                        <div className="text-center py-8 text-text-muted text-sm">
                                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p>{searchQuery ? 'No chats found' : 'No chat history yet'}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {filteredSessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    onClick={() => {
                                                        if (editingSessionId !== session.id) {
                                                            navigate(`/student?session=${session.id}`)
                                                            onClose()
                                                        }
                                                    }}
                                                    className={clsx(
                                                        'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                                                        currentSessionId === session.id
                                                            ? 'bg-sidebar-active text-text'
                                                            : 'hover:bg-sidebar-hover text-text-muted hover:text-text'
                                                    )}
                                                >
                                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />

                                                    {editingSessionId === session.id ? (
                                                        <div className="flex-1 min-w-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                            <input
                                                                type="text"
                                                                value={editTitle}
                                                                onChange={(e) => setEditTitle(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleRenameSubmit()
                                                                    if (e.key === 'Escape') setEditingSessionId(null)
                                                                    e.stopPropagation()
                                                                }}
                                                                className="flex-1 min-w-0 bg-background border border-border rounded px-1 py-0.5 text-sm focus:outline-hidden focus:border-primary"
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleRenameSubmit()}
                                                                className="p-0.5 text-primary hover:bg-primary/10 rounded"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingSessionId(null)}
                                                                className="p-0.5 text-text-muted hover:bg-error/10 hover:text-error rounded"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm truncate font-medium">{session.title}</p>
                                                            </div>

                                                            {/* Mobile-friendly menu button (always visible) */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        setOpenMenuId(openMenuId === session.id ? null : session.id)
                                                                    }}
                                                                    className="p-1 rounded-md text-text-muted hover:text-text hover:bg-sidebar-hover"
                                                                >
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </button>

                                                                {/* Dropdown menu */}
                                                                {openMenuId === session.id && (
                                                                    <div
                                                                        className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-lg shadow-xl z-50 py-1"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            onClick={() => handleShare(session)}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-sidebar-hover"
                                                                        >
                                                                            <Share2 className="w-4 h-4" />
                                                                            Share
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRenameClick(session)}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-sidebar-hover"
                                                                        >
                                                                            <Edit2 className="w-4 h-4" />
                                                                            Rename
                                                                        </button>
                                                                        <div className="h-px bg-border my-1" />
                                                                        <button
                                                                            onClick={() => {
                                                                                setSessionToDelete(session)
                                                                                setDeleteModalOpen(true)
                                                                                setOpenMenuId(null)
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error/10"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Spacer for admin */}
                        {variant === 'admin' && <div className="flex-1" />}

                        {/* Bottom Section */}
                        <div className="border-t border-border p-3 space-y-1">
                            {/* Settings & FAQs */}
                            {bottomItems.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavClick(item.href)}
                                    className={clsx(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200',
                                        location.pathname.includes(item.href.split('/').pop() || '')
                                            ? 'bg-sidebar-active text-text'
                                            : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                                    )}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            ))}

                            {/* Theme Toggle */}
                            <button
                                onClick={() => {
                                    toggleTheme()
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-sidebar-hover hover:text-text transition-all duration-200"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="w-5 h-5 flex-shrink-0" />
                                ) : (
                                    <Moon className="w-5 h-5 flex-shrink-0" />
                                )}
                                <span>
                                    {theme === 'dark' ? 'Light' : 'Dark'} mode
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="my-2 border-t border-border" />

                            {/* User Info */}
                            <div className="flex items-center gap-3 px-3 py-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text truncate">
                                        {user?.displayName ||
                                            user?.email?.split('@')[0] ||
                                            'User'}
                                    </p>
                                    <p className="text-xs text-text-muted truncate">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            {/* Logout */}
                            <button
                                onClick={() => {
                                    setIsLogoutModalOpen(true)
                                    onClose()
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-sidebar-hover hover:text-text transition-all duration-200"
                            >
                                <LogOut className="w-5 h-5 flex-shrink-0" />
                                <span>Log out</span>
                            </button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />
            <DeleteChatModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                chatTitle={sessionToDelete?.title || ''}
            />
        </>
    )
}
