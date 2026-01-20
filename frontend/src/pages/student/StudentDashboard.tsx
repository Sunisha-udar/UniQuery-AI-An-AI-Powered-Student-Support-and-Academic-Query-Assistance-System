import { useState, type FormEvent, useRef, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { api, type Citation } from '../../lib/api'
import { createChatSession, addMessageToSession, loadChatSessions, deleteChatSession, loadChatSession } from '../../lib/chatHistory'
import { PlaceholdersAndVanishInput } from '../../components/ui/placeholders-and-vanish-input'
import {
    ThumbsUp,
    ThumbsDown,
    User,
    MoreVertical,
    Trash2,
    MessageSquarePlus,
    Download,
    AlertCircle,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react'

interface Message {
    id: string
    type: 'user' | 'assistant'
    text: string
    source?: string
    citations?: Citation[]
    confidence?: number
}

const INITIAL_MESSAGES: Message[] = []

const EXAMPLE_QUESTIONS = [
    'What is the minimum attendance required?',
    'When is the exam schedule?',
    'What are the course prerequisites?',
    'How do I apply for scholarships?',
    'What is the grading policy?',
    'When are the semester breaks?'
]

const generateId = () => Math.random().toString(36).substr(2, 9)

export function StudentDashboard() {
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
    const [activeAnswer, setActiveAnswer] = useState<Message | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const [displayedText, setDisplayedText] = useState('')
    const [showMenu, setShowMenu] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false)
    const [chatSessions, setChatSessions] = useState<any[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const hasAddedToMessages = useRef(false)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Load or create chat session on mount
    useEffect(() => {
        const initSession = async () => {
            if (!user?.uid) return

            try {
                setIsLoadingHistory(true)
                // Load existing sessions
                const sessions = await loadChatSessions(user.uid)
                setChatSessions(sessions)

                if (sessions.length > 0) {
                    // Load the most recent session
                    const mostRecent = sessions[0]
                    setCurrentSessionId(mostRecent.id)
                    setMessages(mostRecent.messages)
                    console.log('[Dashboard] Loaded existing session:', mostRecent.id)
                } else {
                    // Create a new session
                    const newSessionId = await createChatSession(user.uid)
                    setCurrentSessionId(newSessionId)
                    console.log('[Dashboard] Created new session:', newSessionId)
                }
            } catch (err) {
                console.error('Failed to initialize session:', err)
            } finally {
                setIsLoadingHistory(false)
            }
        }

        initSession()
    }, [user?.uid])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping, displayedText])

    useEffect(() => {
        if (activeAnswer && activeAnswer.text) {
            let currentIndex = 0
            setDisplayedText('')
            const text = activeAnswer.text
            hasAddedToMessages.current = false

            const interval = setInterval(() => {
                if (currentIndex < text.length) {
                    setDisplayedText(text.substring(0, currentIndex + 1))
                    currentIndex++
                } else {
                    clearInterval(interval)
                    // Add to messages array when typing is complete
                    if (!hasAddedToMessages.current && user?.uid && currentSessionId) {
                        hasAddedToMessages.current = true
                        setMessages(prev => [...prev, activeAnswer])

                        // Save to session
                        console.log('Attempting to save assistant message to session')
                        addMessageToSession(
                            currentSessionId,
                            'assistant',
                            activeAnswer.text,
                            activeAnswer.citations,
                            activeAnswer.confidence
                        ).then(() => {
                            console.log('Assistant message saved to session successfully')
                        }).catch(err => {
                            console.error('Failed to save assistant message:', err)
                        })

                        // Clear active answer after adding to messages
                        setTimeout(() => setActiveAnswer(null), 100)
                    }
                }
            }, 20) // Adjust speed here (lower = faster)

            return () => clearInterval(interval)
        }
    }, [activeAnswer, user?.uid])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleClearHistory = async () => {
        if (!user?.uid || !currentSessionId) return

        try {
            await deleteChatSession(currentSessionId)
            // Create a new session
            const newSessionId = await createChatSession(user.uid)
            setCurrentSessionId(newSessionId)
            setMessages([])
            setActiveAnswer(null)
            setShowMenu(false)
            // Refresh sessions list
            const sessions = await loadChatSessions(user.uid)
            setChatSessions(sessions)
        } catch (err) {
            console.error('Failed to clear chat history:', err)
            setError('Failed to clear chat history')
        }
    }

    const handleStartNewChat = async () => {
        if (!user?.uid) return

        try {
            const newSessionId = await createChatSession(user.uid)
            setCurrentSessionId(newSessionId)
            setMessages([])
            setActiveAnswer(null)
            setQuery('')
            setShowMenu(false)
            // Refresh sessions list
            const sessions = await loadChatSessions(user.uid)
            setChatSessions(sessions)
        } catch (err) {
            console.error('Failed to start new chat:', err)
            setError('Failed to start new chat')
        }
    }

    const handleSelectSession = async (sessionId: string) => {
        try {
            const session = await loadChatSession(sessionId)
            if (session) {
                setCurrentSessionId(session.id)
                setMessages(session.messages)
                setActiveAnswer(null)
                setQuery('')
                setIsChatHistoryOpen(false)
            }
        } catch (err) {
            console.error('Failed to load session:', err)
            setError('Failed to load session')
        }
    }

    const handleDeleteSession = async (sessionId: string) => {
        if (!user?.uid) return

        try {
            await deleteChatSession(sessionId)
            // Refresh sessions list
            const sessions = await loadChatSessions(user.uid)
            setChatSessions(sessions)

            // If we deleted the current session, create a new one
            if (sessionId === currentSessionId) {
                const newSessionId = await createChatSession(user.uid)
                setCurrentSessionId(newSessionId)
                setMessages([])
                setActiveAnswer(null)
            }
        } catch (err) {
            console.error('Failed to delete session:', err)
            setError('Failed to delete session')
        }
    }

    const handleExportChat = () => {
        const chatContent = messages.map(msg => `${msg.type === 'user' ? 'You' : 'AI'}: ${msg.text}`).join('\n\n')
        const blob = new Blob([chatContent], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
        setShowMenu(false)
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!query.trim() || !user?.uid) return

        // Create session if doesn't exist
        let sessionId = currentSessionId
        if (!sessionId) {
            sessionId = await createChatSession(user.uid, query)
            setCurrentSessionId(sessionId)
        }

        const newMessage: Message = {
            id: generateId(),
            type: 'user',
            text: query,
        }
        setMessages(prev => [...prev, newMessage])
        setActiveAnswer(null)
        setIsTyping(true)
        setError(null)
        setQuery('')

        // Save user message to session
        try {
            await addMessageToSession(sessionId, 'user', newMessage.text)
            console.log('User message saved to session')
        } catch (err) {
            console.error('Failed to save user message:', err)
        }

        try {
            // Call real API - search all documents without filters
            const result = await api.queryDocuments({
                question: newMessage.text
            })

            setIsTyping(false)
            setActiveAnswer({
                id: 'answer-' + Date.now(),
                type: 'assistant',
                text: result.answer,
                citations: result.citations,
                confidence: result.confidence
            })
        } catch (err) {
            setIsTyping(false)
            setError(err instanceof Error ? err.message : 'Failed to get answer')
            console.error('Query error:', err)
        }
    }

    return (
        <DashboardLayout variant="student">
            <div className="flex h-full relative">
                {/* Collapsible Chat History Panel */}
                <div 
                    className={`border-r border-gray-200 bg-white flex-shrink-0 z-20 shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${
                        isChatHistoryOpen ? 'w-72' : 'w-0'
                    }`}
                >
                    <div className="w-72 h-full flex flex-col">
                        {/* New Chat Button Area */}
                        <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                            <button
                                onClick={handleStartNewChat}
                                className="w-full h-[46px] flex items-center justify-start px-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
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
                                        ? 'bg-primary/5 text-primary'
                                        : 'hover:bg-gray-50 text-gray-600'
                                        }`}
                                    onClick={() => handleSelectSession(session.id)}
                                >
                                    <div className="min-w-[24px] flex justify-center items-center">
                                        <MessageSquarePlus className={`w-5 h-5 transition-colors duration-300 ${session.id === currentSessionId ? 'text-primary' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
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
                                        className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all absolute right-2"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 h-full bg-white">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsChatHistoryOpen(!isChatHistoryOpen)}
                                className="p-2 rounded-xl hover:bg-gray-100 transition-all hover:scale-105"
                            >
                                <PanelLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
                                UniQuery AI
                            </h2>
                        </div>
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 rounded-xl hover:bg-gray-100/80 transition-all hover:scale-105"
                                aria-label="Open chat menu"
                            >
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl py-2 z-10 animate-fadeIn">
                                    <button
                                        onClick={handleStartNewChat}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <MessageSquarePlus className="w-4 h-4 text-primary" />
                                        Start new chat
                                    </button>
                                    <button
                                        onClick={handleClearHistory}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4 text-error" />
                                        Clear history
                                    </button>
                                    <button
                                        onClick={handleExportChat}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Download className="w-4 h-4 text-teal" />
                                        Export chat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingHistory && (
                            <div className="flex items-center justify-center h-full">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        {!isLoadingHistory && messages.length === 0 && !activeAnswer && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-4 px-4 max-w-2xl">
                                    <h1 className="text-4xl font-semibold text-gray-800 tracking-tight">Ask UniQuery AI</h1>
                                    <p className="text-gray-500 text-lg">Ask any question about your documents, schedule, or courses.</p>
                                </div>
                            </div>
                        )}

                        {messages.length > 0 && (<>
                            <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex items-start gap-4 animate-fadeIn ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-10 h-10 rounded-2xl ${msg.type === 'assistant' ? 'bg-gradient-to-br from-primary to-teal' : 'bg-gradient-to-br from-blue-500 to-blue-600'} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                            {msg.type === 'assistant' ? (
                                                <span className="text-white text-sm font-bold">AI</span>
                                            ) : (
                                                <User className="w-5 h-5 text-white" />
                                            )}
                                        </div>
                                        <div className={`${msg.type === 'user' ? 'max-w-[80%]' : 'flex-1'} ${msg.type === 'assistant' ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'} py-4 px-5 rounded-3xl`}>
                                            <p className={`text-[15px] leading-relaxed ${msg.type === 'assistant' ? 'text-gray-800' : 'text-white'}`}>{msg.text}</p>
                                            {msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
                                                        <span className="text-base">📚</span> Sources
                                                    </p>
                                                    <div className="space-y-2">
                                                        {msg.citations.map((citation, idx) => (
                                                            <div key={idx} className="text-xs bg-gray-50 rounded-xl p-3 border border-gray-200">
                                                                <span className="font-semibold text-gray-800">{citation.title}</span>
                                                                <span className="text-gray-500 ml-2">• Page {citation.page}</span>
                                                                <span className="text-primary ml-2">• {(citation.score * 100).toFixed(0)}% match</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {msg.confidence !== undefined && (
                                                <div className="mt-4 flex items-center gap-3">
                                                    <span className="text-xs font-medium text-gray-600">Confidence</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-teal rounded-full transition-all duration-500"
                                                            style={{ width: `${msg.confidence * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-primary">{(msg.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex items-start gap-4 animate-fadeIn">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-teal flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <span className="text-white text-sm font-bold">AI</span>
                                        </div>
                                        <div className="flex-1 py-5 px-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-teal rounded-full animate-bounce"></div>
                                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* AI Answer - Inside Chat Flow */}
                                {activeAnswer && !isTyping && (
                                    <div className="flex items-start gap-4 animate-fadeIn">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-teal flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <span className="text-white text-sm font-bold">AI</span>
                                        </div>
                                        <div className="flex-1 py-4 px-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                                            <p className="text-[15px] text-gray-800 leading-relaxed">
                                                {displayedText}
                                                {displayedText.length < activeAnswer.text.length && (
                                                    <span className="inline-block w-1.5 h-5 bg-primary ml-1 animate-pulse rounded"></span>
                                                )}
                                            </p>
                                            {activeAnswer.citations && activeAnswer.citations.length > 0 && displayedText.length === activeAnswer.text.length && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
                                                    <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
                                                        <span className="text-base">📚</span> Sources
                                                    </p>
                                                    <div className="space-y-2">
                                                        {activeAnswer.citations.map((citation, idx) => (
                                                            <div key={idx} className="text-xs bg-gray-50 rounded-xl p-3 border border-gray-200">
                                                                <span className="font-semibold text-gray-800">{citation.title}</span>
                                                                <span className="text-gray-500 ml-2">• Page {citation.page}</span>
                                                                <span className="text-primary ml-2">• {(citation.score * 100).toFixed(0)}% match</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {activeAnswer.confidence !== undefined && displayedText.length === activeAnswer.text.length && (
                                                <div className="mt-4 flex items-center gap-3 animate-fadeIn">
                                                    <span className="text-xs font-medium text-gray-600">Confidence</span>
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-teal rounded-full transition-all duration-500"
                                                            style={{ width: `${activeAnswer.confidence * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-primary">{(activeAnswer.confidence * 100).toFixed(0)}%</span>
                                                </div>
                                            )}
                                            {displayedText.length === activeAnswer.text.length && (
                                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 animate-fadeIn">
                                                    <button
                                                        className="p-2 rounded-xl hover:bg-success/10 text-gray-400 hover:text-success transition-all hover:scale-110"
                                                        aria-label="Mark answer as helpful"
                                                    >
                                                        <ThumbsUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 rounded-xl hover:bg-error/10 text-gray-400 hover:text-error transition-all hover:scale-110"
                                                        aria-label="Mark answer as not helpful"
                                                    >
                                                        <ThumbsDown className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Error Message */}
                                {error && !isTyping && (
                                    <div className="flex items-start gap-4 animate-fadeIn">
                                        <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex-1 py-4 px-5 bg-red-50 rounded-3xl border border-red-200 shadow-sm">
                                            <p className="text-[15px] text-red-700 font-medium">{error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div ref={messagesEndRef} />
                        </>
                        )}
                    </div>

                    {/* Input - Fixed at Bottom */}
                    <div className="border-t border-gray-200/50 bg-white px-6 py-6">
                        <PlaceholdersAndVanishInput
                            placeholders={EXAMPLE_QUESTIONS}
                            onChange={(e) => setQuery(e.target.value)}
                            onSubmit={handleSubmit}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout >
    )
}
