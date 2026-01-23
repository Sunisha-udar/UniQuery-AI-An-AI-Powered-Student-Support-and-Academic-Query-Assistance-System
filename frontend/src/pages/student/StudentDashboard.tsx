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
    Filter
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
    'When is the exam schedule?',
    'What are the course prerequisites?',
    'How do I apply for scholarships?',
    'What is the grading policy?',
    'When are the semester breaks?'
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
    const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false)
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
                setIsChatHistoryOpen(false)
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
            <div className="flex h-full relative rounded-2xl border border-border bg-surface shadow-md overflow-hidden transition-all duration-300">
                {/* Collapsible Chat History Panel */}
                <div
                    className={`border-r border-border bg-surface flex-shrink-0 z-20 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${isChatHistoryOpen ? 'w-72' : 'w-0'
                        }`}
                >
                    <div className="w-72 h-full flex flex-col">
                        {/* New Chat Button Area */}
                        <div className="p-3 border-b border-border flex items-center gap-3">
                            <button
                                onClick={handleStartNewChat}
                                className="w-full h-[46px] flex items-center justify-start px-4 bg-background text-text rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                                <MessageSquarePlus className="w-5 h-5 flex-shrink-0" />
                                <span className="whitespace-nowrap ml-3 font-medium">New Chat</span>
                            </button>
                        </div>

                        {/* Chat Sessions List */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
                            {chatSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className={`group/item relative p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${session.id === currentSessionId
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-background text-text-muted'
                                        }`}
                                    onClick={() => handleSelectSession(session.id)}
                                >
                                    <div className="min-w-[24px] flex justify-center items-center">
                                        <MessageSquarePlus className={`w-5 h-5 transition-colors duration-300 ${session.id === currentSessionId ? 'text-primary' : 'text-text-muted group-hover/item:text-text'}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {session.title || 'New Chat'}
                                        </p>
                                        <p className="text-[10px] opacity-60 truncate">
                                            {session.createdAt?.toDate ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'Today'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteSession(session.id)
                                        }}
                                        className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-all absolute right-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 h-full bg-background">
                    {/* Header - Minimal Glass Effect */}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                                className="p-2 rounded-lg hover:bg-background transition-colors"
                            >
                                <PanelLeft className="w-5 h-5 text-text-muted" />
                            </button>
                            <h2 className="text-lg font-medium text-text">
                                UniQuery AI
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleStartNewChat}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-background transition-colors text-text-muted hover:text-text"
                            >
                                <MessageSquarePlus className="w-4.5 h-4.5" />
                                <span className="text-sm font-medium">New chat</span>
                            </button>
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 rounded-lg hover:bg-background transition-colors"
                                    aria-label="Open chat menu"
                                >
                                    <MoreVertical className="w-5 h-5 text-text-muted" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-10 w-48 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-10 animate-fadeIn">
                                        <button
                                            onClick={handleClearHistory}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-background transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-text-muted" />
                                            Clear history
                                        </button>
                                        <button
                                            onClick={handleExportChat}
                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text hover:bg-background transition-colors"
                                        >
                                            <Download className="w-4 h-4 text-text-muted" />
                                            Export
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Filters Bar */}
                    <div className="bg-surface/50 backdrop-blur-sm border-b border-border px-4 py-2">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text transition-colors"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                {showFilters ? 'Hide Context Filters' : 'Show Context Filters'}
                            </button>
                            {!showFilters && (filters.program || filters.department || filters.semester) && (
                                <span className="text-xs text-text-light">
                                    Active: {[filters.program, filters.department, filters.semester ? `Sem ${filters.semester}` : ''].filter(Boolean).join(' • ')}
                                </span>
                            )}
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-3 gap-3 animate-fadeIn mb-2">
                                <Select
                                    label="Program"
                                    options={PROGRAMS}
                                    value={filters.program}
                                    onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                                    placeholder="All Programs"
                                    className="bg-surface h-8 text-sm"
                                />
                                <Select
                                    label="Department"
                                    options={DEPARTMENTS}
                                    value={filters.department}
                                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                                    placeholder="All Departments"
                                    className="bg-surface h-8 text-sm"
                                />
                                <Select
                                    label="Semester"
                                    options={SEMESTERS}
                                    value={filters.semester}
                                    onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                                    placeholder="All Semesters"
                                    className="bg-surface h-8 text-sm"
                                />
                            </div>
                        )}
                    </div>

                    {/* Messages Area - Centered */}
                    <div className="flex-1 overflow-y-auto pb-32">
                        {isLoadingHistory && (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        {!isLoadingHistory && messages.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-3 px-4 max-w-xl">
                                    <h1 className="text-3xl font-semibold text-text">Ask UniQuery AI</h1>
                                    <p className="text-text-muted text-base">Ask any question about your documents, schedule, or courses.</p>
                                </div>
                            </div>
                        )}

                        {messages.length > 0 && (
                            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex animate-fadeIn ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`${msg.type === 'user' ? 'max-w-[85%]' : 'max-w-full'}`}>
                                            <div className={`${msg.type === 'user'
                                                ? 'bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3'
                                                : 'text-text'}`}>
                                                <p className="text-[15px] leading-relaxed">{msg.text}</p>
                                            </div>

                                            {msg.type === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-3 overflow-x-auto scrollbar-hide">
                                                    <div className="flex gap-2 pb-1">
                                                        {msg.citations.map((citation, idx) => (
                                                            <div key={idx} className="flex-shrink-0 text-xs bg-surface border border-border rounded-full px-3 py-1.5 text-text-muted hover:border-text-light transition-colors cursor-pointer">
                                                                <span className="font-medium text-text">{citation.title}</span>
                                                                <span className="text-text-light mx-1.5">·</span>
                                                                <span>p.{citation.page}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {msg.type === 'assistant' && msg.confidence !== undefined && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                                                        <div className="h-full bg-text-muted rounded-full" style={{ width: `${msg.confidence * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-text-light">{(msg.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {streamingMessage && (
                                    <div className="flex animate-fadeIn justify-start">
                                        <div className="max-w-full">
                                            <div className="text-text">
                                                <p className="text-[15px] leading-relaxed">
                                                    {displayedText}
                                                    <span className="inline-block w-0.5 h-4 bg-text-muted ml-0.5 animate-pulse"></span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isTyping && (
                                    <div className="flex justify-start animate-fadeIn">
                                        <div className="flex items-center gap-1 py-2">
                                            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="flex justify-start animate-fadeIn">
                                        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <p className="text-sm">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input - Floating at Bottom with Blur */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/95 to-transparent pt-8 pb-4 px-4">
                        <div className="max-w-3xl mx-auto">
                            <PlaceholdersAndVanishInput
                                placeholders={EXAMPLE_QUESTIONS}
                                onChange={(e) => setQuery(e.target.value)}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

