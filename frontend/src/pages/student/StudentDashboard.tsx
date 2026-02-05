import { useState, type FormEvent, useRef, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { api, type Citation } from '../../lib/api'
import { createChatSession, addMessageToSession, loadChatSessions, deleteChatSession, loadChatSession, updateSessionTitle } from '../../lib/chatHistory'
import { PlaceholdersAndVanishInput } from '../../components/ui/placeholders-and-vanish-input'
import {
    MoreVertical,
    Trash2,
    MessageSquarePlus,
    Download,
    AlertCircle,
    PanelLeft,
    Filter,
    Sparkles
} from 'lucide-react'
import { Select } from '../../components/ui/Select'

interface Message {
    id: string
    type: 'user' | 'assistant'
    text: string
    citations?: Citation[]
    confidence?: number
}

const EXAMPLE_QUESTIONS = [
    'What is the minimum attendance required?',
    'When is the exam schedule for B.Tech?',
    'What are the distinct scholarship prerequisites?',
    'How is the grading policy structured?',
]

const PROGRAMS = [
    { value: 'B.Tech', label: 'B.Tech' },
    { value: 'M.Tech', label: 'M.Tech' },
    { value: 'MBA', label: 'MBA' },
    { value: 'BCA', label: 'BCA' },
    { value: 'MCA', label: 'MCA' }
]

const DEPARTMENTS = [
    { value: 'CSE', label: 'Computer Science' },
    { value: 'ECE', label: 'Electronics & Comm.' },
    { value: 'MECH', label: 'Mechanical' },
    { value: 'CIVIL', label: 'Civil' },
    { value: 'EEE', label: 'Electrical' }
]

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`
}))

export function StudentDashboard() {
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)
    const [displayedText, setDisplayedText] = useState('')
    const [showMenu, setShowMenu] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(true) // Default open on desktop
    const [chatSessions, setChatSessions] = useState<any[]>([])
    const [filters, setFilters] = useState({ program: '', department: '', semester: '' })
    const [showFilters, setShowFilters] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!streamingMessage) return

        let index = 0
        const text = streamingMessage.text
        setDisplayedText('')

        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1))
                index++
            } else {
                clearInterval(interval)
                setMessages(prev => [...prev, streamingMessage])
                setStreamingMessage(null)
                setDisplayedText('')
            }
        }, 15)

        return () => clearInterval(interval)
    }, [streamingMessage])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, displayedText])

    useEffect(() => {
        if (!user?.uid) {
            setIsLoadingHistory(false)
            return
        }

        const init = async () => {
            try {
                const sessions = await loadChatSessions(user.uid)
                setChatSessions(sessions)
                if (sessions.length > 0) {
                    setCurrentSessionId(sessions[0].id)
                    setMessages(sessions[0].messages || [])
                } else {
                    const newId = await createChatSession(user.uid)
                    setCurrentSessionId(newId)
                }
            } catch (err) {
                console.error('Init error:', err)
            } finally {
                setIsLoadingHistory(false)
            }
        }
        init()
    }, [user?.uid])

    useEffect(() => {
        if (user) {
            setFilters({
                program: user.program || '',
                department: user.department || '',
                semester: user.semester ? String(user.semester) : ''
            })
        }
    }, [user])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleStartNewChat = async () => {
        if (!user?.uid) return
        try {
            const newId = await createChatSession(user.uid)
            const sessions = await loadChatSessions(user.uid)
            setChatSessions(sessions)
            setCurrentSessionId(newId)
            setMessages([])
            setQuery('')
            setError(null)
            setShowMenu(false)
        } catch (err) {
            console.error('New chat error:', err)
        }
    }

    const handleSelectSession = async (sessionId: string) => {
        try {
            const session = await loadChatSession(sessionId)
            if (session) {
                setCurrentSessionId(session.id)
                setMessages(session.messages || [])
                setQuery('')
                // Don't auto-close history on desktop
                if (window.innerWidth < 768) setIsChatHistoryOpen(false)
            }
        } catch (err) {
            console.error('Load session error:', err)
        }
    }

    const handleDeleteSession = async (sessionId: string) => {
        if (!user?.uid) return
        try {
            await deleteChatSession(sessionId)
            const sessions = await loadChatSessions(user.uid)
            setChatSessions(sessions)
            if (sessionId === currentSessionId) {
                const newId = await createChatSession(user.uid)
                setCurrentSessionId(newId)
                setMessages([])
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const handleClearHistory = async () => {
        if (!user?.uid || !currentSessionId) return
        try {
            await deleteChatSession(currentSessionId)
            const newId = await createChatSession(user.uid)
            const sessions = await loadChatSessions(user.uid)
            setChatSessions(sessions)
            setCurrentSessionId(newId)
            setMessages([])
            setError(null)
            setShowMenu(false)
        } catch (err) {
            console.error('Clear error:', err)
        }
    }

    const handleExportChat = () => {
        const content = messages.map(m => `${m.type === 'user' ? 'You' : 'AI'}: ${m.text}`).join('\n\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
        setShowMenu(false)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!query.trim() || !user?.uid || isTyping) return

        let sessionId = currentSessionId
        if (!sessionId) {
            sessionId = await createChatSession(user.uid)
            setCurrentSessionId(sessionId)
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            type: 'user',
            text: query
        }

        setMessages(prev => [...prev, userMsg])
        setIsTyping(true)
        setError(null)
        const currentQuery = query
        setQuery('')

        try {
            await addMessageToSession(sessionId, 'user', userMsg.text)

            const result = await api.queryDocuments({
                question: currentQuery,
                program: filters.program || undefined,
                department: filters.department || undefined,
                semester: filters.semester ? Number(filters.semester) : undefined
            })

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                text: result.answer,
                citations: result.citations,
                confidence: result.confidence
            }

            setIsTyping(false)
            setStreamingMessage(assistantMsg)
            await addMessageToSession(sessionId, 'assistant', assistantMsg.text, assistantMsg.citations, assistantMsg.confidence)

            if (messages.length === 0) {
                await updateSessionTitle(sessionId, currentQuery.slice(0, 30) + (currentQuery.length > 30 ? '...' : ''))
                const sessions = await loadChatSessions(user.uid)
                setChatSessions(sessions)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get answer')
            console.error('Query error:', err)
        } finally {
            setIsTyping(false)
        }
    }

    return (
        <DashboardLayout variant="student">
            {/* Main Chat Container - Glassmorphism */}
            <div className="flex h-full relative rounded-3xl border border-white/5 bg-surface/30 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-300">

                {/* Collapsible Chat History Panel - Frosted Glass */}
                <div
                    className={`border-r border-white/5 bg-background/50 flex-shrink-0 z-20 transition-all duration-300 ease-in-out overflow-hidden ${isChatHistoryOpen ? 'w-80' : 'w-0'
                        }`}
                >
                    <div className="w-80 h-full flex flex-col p-4">
                        {/* New Chat Button Area */}
                        <div className="mb-4">
                            <button
                                onClick={handleStartNewChat}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all shadow-glow hover:scale-[1.02] active:scale-[0.98] group"
                            >
                                <MessageSquarePlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                <span className="font-semibold tracking-wide">New Chat</span>
                            </button>
                        </div>

                        {/* Chat Sessions List */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-2 custom-scrollbar">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-2">Recent Sessions</h3>
                            {chatSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`group/item relative p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 border border-transparent ${session.id === currentSessionId
                                        ? 'bg-white/5 border-white/10 text-primary shadow-sm'
                                        : 'hover:bg-white/5 text-text-dim hover:text-text'
                                        }`}
                                    onClick={() => handleSelectSession(session.id)}
                                >
                                    <div className="min-w-[24px] flex justify-center items-center">
                                        <MessageSquarePlus className={`w-5 h-5 transition-colors duration-300 ${session.id === currentSessionId ? 'text-primary' : 'text-text-muted group-hover/item:text-text-dim'}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {session.title || 'New Conversation'}
                                        </p>
                                        <p className="text-[10px] opacity-60 truncate">
                                            {session.createdAt?.toDate ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteSession(session.id)
                                        }}
                                        className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-all absolute right-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 h-full bg-transparent relative">
                    {/* Header - Transparent Floating */}
                    <div className="flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/80 to-transparent">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-text-muted hover:text-text"
                            >
                                <PanelLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
                                    UniQuery AI <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 rounded-xl hover:bg-white/10 transition-colors text-text-muted hover:text-text"
                                    aria-label="Options"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-12 w-48 glass rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                                        <button
                                            onClick={handleClearHistory}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-white/5 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-text-muted" />
                                            Clear history
                                        </button>
                                        <button
                                            onClick={handleExportChat}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-white/5 transition-colors"
                                        >
                                            <Download className="w-4 h-4 text-text-muted" />
                                            Export Chat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filters Pill Area */}
                    <div className="absolute top-[70px] left-0 right-0 px-6 z-10 flex justify-center">
                        <div className={`glass rounded-full px-4 py-1.5 flex items-center gap-3 transition-all duration-300 ${showFilters ? 'rounded-2xl flex-col p-4 items-stretch w-full max-w-md' : ''}`}>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-primary transition-colors uppercase tracking-wide"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                {showFilters ? 'Close Filters' : 'Context Filters'}
                            </button>

                            {!showFilters && (
                                <div className="h-4 w-[1px] bg-border"></div>
                            )}

                            {!showFilters && (filters.program || filters.department || filters.semester) && (
                                <span className="text-xs text-primary font-medium">
                                    {[filters.program, filters.department, filters.semester ? `Sem ${filters.semester}` : ''].filter(Boolean).join(' • ')}
                                </span>
                            )}

                            {showFilters && (
                                <div className="grid grid-cols-1 gap-3 mt-2 animate-in fade-in slide-in-from-top-2">
                                    <Select
                                        label="Program"
                                        options={PROGRAMS}
                                        value={filters.program}
                                        onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                                        placeholder="Select Program"
                                        className="bg-background/50 h-9 text-sm rounded-lg"
                                    />
                                    <Select
                                        label="Department"
                                        options={DEPARTMENTS}
                                        value={filters.department}
                                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                        placeholder="Select Department"
                                        className="bg-background/50 h-9 text-sm rounded-lg"
                                    />
                                    <Select
                                        label="Semester"
                                        options={SEMESTERS}
                                        value={filters.semester}
                                        onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                                        placeholder="Select Semester"
                                        className="bg-background/50 h-9 text-sm rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto pt-32 pb-32 px-4 scroll-smooth" id="chat-container">
                        {isLoadingHistory && (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce"></div>
                                    <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2.5 h-2.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        {!isLoadingHistory && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center shadow-glow mb-8">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight mb-4 text-center">
                                    Hello, Scholar
                                </h1>
                                <p className="text-text-muted text-lg max-w-md text-center leading-relaxed">
                                    I'm your academic assistant. Ask me anything about your <span className="text-primary font-medium">courses</span>, <span className="text-secondary font-medium">schedule</span>, or <span className="text-accent font-medium">campus life</span>.
                                </p>
                            </div>
                        )}

                        {messages.length > 0 && (
                            <div className="max-w-3xl mx-auto space-y-8">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`${msg.type === 'user' ? 'max-w-[85%]' : 'max-w-full'}`}>
                                            <div className={`${msg.type === 'user'
                                                ? 'bg-primary text-white rounded-3xl rounded-tr-md px-6 py-4 shadow-glow'
                                                : 'bg-white/5 backdrop-blur-sm border border-white/5 text-text-dim rounded-3xl rounded-tl-md px-6 py-5'}`}>
                                                <p className={`text-[15px] leading-7 ${msg.type === 'assistant' ? 'font-light' : 'font-medium'}`}>{msg.text}</p>
                                            </div>

                                            {msg.type === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-4 pl-2">
                                                    <p className="text-[10px] uppercase tracking-widest text-text-muted font-bold mb-2 opacity-60">Sources</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {msg.citations.map((citation, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-text-light hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer group">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-accent group-hover:shadow-[0_0_8px_currentColor]"></span>
                                                                <span className="font-medium truncate max-w-[150px]">{citation.title}</span>
                                                                <span className="opacity-40">|</span>
                                                                <span className="opacity-60">p.{citation.page}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {streamingMessage && (
                                    <div className="flex justify-start">
                                        <div className="max-w-full bg-white/5 backdrop-blur-sm border border-white/5 text-text-dim rounded-3xl rounded-tl-md px-6 py-5">
                                            <p className="text-[15px] leading-7 font-light">
                                                {displayedText}
                                                <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse"></span>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 rounded-full px-4 py-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex justify-center my-4">
                                        <div className="flex items-center gap-2 text-error bg-error/10 border border-error/20 rounded-xl px-4 py-2 backdrop-blur-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-sm font-medium">{error}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Gradient Overlay for Input */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent h-40 pointer-events-none transition-all duration-500" />

                    {/* Input - Floating & Centered */}
                    <div className="absolute bottom-8 left-0 right-0 px-4 z-20">
                        <div className="max-w-3xl mx-auto shadow-2xl rounded-full">
                            <PlaceholdersAndVanishInput
                                placeholders={EXAMPLE_QUESTIONS}
                                onChange={(e) => setQuery(e.target.value)}
                                onSubmit={handleSubmit}
                            />
                        </div>
                        <p className="text-center text-[10px] text-text-muted mt-3 opacity-40">
                            UniQuery AI can make mistakes. Check important info.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

