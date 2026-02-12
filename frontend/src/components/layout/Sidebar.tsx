import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { LogoutModal } from '../ui/LogoutModal'
import { DeleteChatModal } from '../ui/DeleteChatModal'
import { loadChatSessions, deleteChatSession, updateSessionTitle, type ChatSession } from '../../lib/chatHistory'
import { ChatActionMenu } from '../chat/ChatActionMenu'
import { ChatHistorySearch } from '../search/ChatHistorySearch'
import {
    Settings,
    LogOut,
    MessageSquare,
    Moon,
    Sun,
    Plus,
    Check,
    X,
    HelpCircle,
    User,
    LayoutDashboard,
    FileText,
    BarChart3,
    PanelLeftClose,
    PanelLeftOpen,
    Users,
    Bookmark
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
    variant: 'admin' | 'student'
    isExpanded: boolean
    onToggle: () => void
    currentSessionId?: string | null
}

interface NavItem {
    icon: React.ElementType
    label: string
    href: string
}

const ADMIN_NAV: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
    { icon: MessageSquare, label: 'Queries', href: '/admin/queries' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: HelpCircle, label: 'FAQs', href: '/admin/faqs' },
    { icon: Users, label: 'Users', href: '/admin/users' },
]

export function Sidebar({
    variant,
    isExpanded,
    onToggle,
    currentSessionId,
}: SidebarProps) {
    const { theme, toggleTheme } = useTheme()
    const { user } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(false)
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
    const [editTitle, setEditTitle] = useState('')

    // Load chat sessions if user is a student
    useEffect(() => {
        if (variant === 'student' && user?.uid) {
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
    }, [variant, user?.uid])

    const loadSessions = async (silent = false) => {
        if (!user?.uid) return
        try {
            if (!silent) setLoading(true)
            const loadedSessions = await loadChatSessions(user.uid)
            setSessions(loadedSessions)
        } catch (err) {
            console.error('Failed to load sessions:', err)
        } finally {
            if (!silent) setLoading(false)
        }
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
        // Could add a toast notification here
    }

    const handleRenameClick = (session: ChatSession) => {
        setEditingSessionId(session.id)
        setEditTitle(session.title)
    }

    const handleRenameSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault()
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
        <motion.aside
            initial={false}
            animate={{
                width: isExpanded ? '260px' : '64px'
            }}
            transition={{
                duration: 0.25,
                ease: [0.4, 0, 0.2, 1]
            }}
            className="bg-sidebar border-r border-border h-screen flex flex-col fixed left-0 top-0 z-30 overflow-hidden"
        >
            {/* Logo & New Chat/Navigation */}
            <div className="p-3 flex-shrink-0 space-y-2">
                {/* Logo */}
                <div className={clsx(
                    "flex items-center overflow-hidden h-10 transition-all",
                    isExpanded ? "justify-between px-2 gap-3" : "justify-center px-0"
                )}>
                    {isExpanded && (
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                <img src="/logo.png" alt="UniQuery Logo" className="w-full h-full object-contain" />
                            </div>
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                className="font-semibold text-text whitespace-nowrap text-base"
                            >
                                UniQuery AI
                            </motion.span>
                        </div>
                    )}

                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-sidebar-hover transition-colors"
                        title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        {isExpanded ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                    </button>
                </div>

                {/* New Chat Button - Only for students */}
                {variant === 'student' && (
                    <motion.button
                        onClick={() => navigate('/student')}
                        className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-text-muted hover:bg-sidebar-hover hover:text-text',
                            isExpanded ? 'justify-start' : 'justify-center'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title={!isExpanded ? 'New Chat' : undefined}
                    >
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                                >
                                    New chat
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}
            </div>

            {/* Admin Navigation */}
            {variant === 'admin' && (
                <nav className="px-2 pb-2 flex-shrink-0">
                    <ul className="space-y-0.5">
                        {ADMIN_NAV.map((item) => {
                            const isActive = location.pathname === item.href ||
                                (item.href !== '/admin' && location.pathname.startsWith(item.href))
                            return (
                                <li key={item.href}>
                                    <Link
                                        to={item.href}
                                        className={clsx(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200',
                                            isExpanded ? 'justify-start' : 'justify-center',
                                            isActive
                                                ? 'bg-sidebar-active text-text'
                                                : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                                        )}
                                        title={!isExpanded ? item.label : undefined}
                                    >
                                        <item.icon className="w-5 h-5 flex-shrink-0" />
                                        <AnimatePresence mode="wait">
                                            {isExpanded && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="whitespace-nowrap overflow-hidden"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            )}

            {/* Chat History Search - Only when expanded and for students */}
            {variant === 'student' && user?.uid && (
                <AnimatePresence mode="wait">
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-3 pb-2"
                        >
                            <ChatHistorySearch
                                userId={user.uid}
                                onResultClick={(sessionId) => {
                                    navigate(`/student?session=${sessionId}`)
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Chat History - Only for students */}
            {variant === 'student' && (
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {isExpanded ? (
                        loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-4 text-text-muted text-sm"
                            >
                                Loading...
                            </motion.div>
                        ) : sessions.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-8 text-text-muted text-sm"
                            >
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p>No chat history yet</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-0.5"
                            >
                                {sessions.map((session) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => {
                                            if (editingSessionId !== session.id) {
                                                navigate(`/student?session=${session.id}`)
                                            }
                                        }}
                                        className={clsx(
                                            'group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200',
                                            currentSessionId === session.id
                                                ? 'bg-sidebar-active text-text'
                                                : 'hover:bg-sidebar-hover text-text-muted hover:text-text'
                                        )}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
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
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm truncate font-medium">{session.title}</p>
                                                <p className="text-xs opacity-60">{formatDate(session.updatedAt)}</p>
                                            </div>
                                        )}

                                        {editingSessionId !== session.id && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChatActionMenu
                                                    chatId={session.id}
                                                    chatTitle={session.title}
                                                    onRename={() => handleRenameClick(session)}
                                                    onDelete={() => {
                                                        setSessionToDelete(session)
                                                        setDeleteModalOpen(true)
                                                    }}
                                                    onShare={() => handleShare(session)}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )
                    ) : null}
                </div>
            )}

            {/* Spacer for admin to push bottom content down */}
            {variant === 'admin' && <div className="flex-1" />}

            {/* Bottom Navigation - Settings, FAQ, Theme */}
            <div className="border-t border-border flex-shrink-0">
                <div className="p-2 space-y-0.5">
                    {/* Settings */}
                    <Link
                        to={variant === 'student' ? '/student/settings' : '/admin/settings'}
                        className={clsx(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200',
                            isExpanded ? 'justify-start' : 'justify-center',
                            location.pathname.includes('/settings')
                                ? 'bg-sidebar-active text-text'
                                : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                        )}
                        title={!isExpanded ? 'Settings' : undefined}
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="whitespace-nowrap overflow-hidden"
                                >
                                    Settings
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>

                    {/* FAQ - Only for students */}
                    {variant === 'student' && (
                        <Link
                            to="/student/faqs"
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200',
                                isExpanded ? 'justify-start' : 'justify-center',
                                location.pathname.includes('/faqs')
                                    ? 'bg-sidebar-active text-text'
                                    : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                            )}
                            title={!isExpanded ? 'FAQs' : undefined}
                        >
                            <HelpCircle className="w-5 h-5 flex-shrink-0" />
                            <AnimatePresence mode="wait">
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        FAQs
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )}

                    {/* Bookmarks - Only for students */}
                    {variant === 'student' && (
                        <Link
                            to="/student/bookmarks"
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-normal transition-all duration-200',
                                isExpanded ? 'justify-start' : 'justify-center',
                                location.pathname.includes('/bookmarks')
                                    ? 'bg-sidebar-active text-text'
                                    : 'text-text-muted hover:bg-sidebar-hover hover:text-text'
                            )}
                            title={!isExpanded ? 'Bookmarks' : undefined}
                        >
                            <Bookmark className="w-5 h-5 flex-shrink-0" />
                            <AnimatePresence mode="wait">
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="whitespace-nowrap overflow-hidden"
                                    >
                                        Bookmarks
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    )}

                    {/* Theme Toggle */}
                    <motion.button
                        onClick={toggleTheme}
                        className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-sidebar-hover hover:text-text transition-all duration-200',
                            isExpanded ? 'justify-start' : 'justify-center'
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title={!isExpanded ? `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` : undefined}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    {theme === 'dark' ? 'Light' : 'Dark'} mode
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* User Profile */}
                <div className="p-2 border-t border-border">
                    <AnimatePresence mode="wait">
                        {isExpanded ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-0.5"
                            >
                                {/* User Info */}
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text truncate">
                                            {user?.displayName || user?.email?.split('@')[0] || 'User'}
                                        </p>
                                        <p className="text-xs text-text-muted truncate">{user?.email}</p>
                                    </div>
                                </div>

                                {/* Logout */}
                                <motion.button
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:bg-sidebar-hover hover:text-text transition-all duration-200"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Log out</span>
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-0.5"
                            >
                                {/* User Avatar */}
                                <motion.button
                                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text transition-all duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title={user?.displayName || user?.email || 'User'}
                                >
                                    <User className="w-5 h-5" />
                                </motion.button>

                                {/* Logout */}
                                <motion.button
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="w-full flex items-center justify-center p-2.5 rounded-lg text-text-muted hover:bg-sidebar-hover hover:text-text transition-all duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Log out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

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
        </motion.aside>
    )
}
