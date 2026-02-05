import { useState, type FormEvent, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { api, type Citation } from '../../lib/api'
import { createChatSession, addMessageToSession, loadChatSessions, updateSessionTitle, saveUserQuery } from '../../lib/chatHistory'
import { PlaceholdersAndVanishInput } from '../../components/ui/placeholders-and-vanish-input'
import {
    AlertCircle
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

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

export function StudentDashboard() {
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const querySessionId = searchParams.get('session')
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTyping, setIsTyping] = useState(false)
    const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)
    const [displayedText, setDisplayedText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const [filters, setFilters] = useState({ program: '', department: '', semester: '' })


    const messagesEndRef = useRef<HTMLDivElement>(null)

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
                setMessages(prev => {
                    if (prev.some(m => m.id === streamingMessage.id)) return prev
                    return [...prev, streamingMessage]
                })
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
                // If we have a session ID in URL, try to load it
                if (querySessionId) {
                    // Avoid reloading if we're already on this session (e.g. just created it)
                    if (querySessionId === currentSessionId && messages.length > 0) {
                        setIsLoadingHistory(false)
                        return
                    }

                    setCurrentSessionId(querySessionId)
                    // Messages will be loaded when sessions are loaded or we can fetch specific session
                    // For now, let's load all sessions and find the one we need
                    const loadedSessions = await loadChatSessions(user.uid)
                    const currentSession = loadedSessions.find(s => s.id === querySessionId)
                    if (currentSession) {
                        setMessages(currentSession.messages || [])
                    } else {
                        // Session not found (maybe deleted), redirect to new chat
                        navigate('/student')
                    }
                } else {
                    // No session ID, reset state for new chat
                    setCurrentSessionId(null)
                    setMessages([])
                }
            } catch (err) {
                console.error('Init error:', err)
            } finally {
                setIsLoadingHistory(false)
            }
        }
        init()
    }, [user?.uid, querySessionId, navigate])

    useEffect(() => {
        if (user) {
            setFilters({
                program: user.program || '',
                department: user.department || '',
                semester: user.semester ? String(user.semester) : ''
            })
        }
    }, [user])



    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!query.trim() || !user?.uid || isTyping) return

        let sessionId = currentSessionId
        let isNewSession = false

        if (!sessionId) {
            sessionId = await createChatSession(user.uid)
            setCurrentSessionId(sessionId)
            isNewSession = true

            // Notify sidebar to add new session immediately
            const newSession = {
                id: sessionId,
                userId: user.uid,
                messages: [],
                title: 'New Chat',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
            window.dispatchEvent(new CustomEvent('chat-session-created', { detail: newSession }))
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
            await addMessageToSession(sessionId, 'user', userMsg.text, undefined, undefined, userMsg.id)

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
            await addMessageToSession(sessionId, 'assistant', assistantMsg.text, assistantMsg.citations, assistantMsg.confidence, assistantMsg.id)

            if (messages.length === 0 || isNewSession) {
                const title = currentQuery.slice(0, 30) + (currentQuery.length > 30 ? '...' : '')
                await updateSessionTitle(sessionId, title)
                // Notify sidebar to update title
                window.dispatchEvent(new CustomEvent('chat-session-updated', {
                    detail: { id: sessionId, title, updatedAt: new Date().toISOString() }
                }))
            }

            // Update URL if it was a new session
            if (isNewSession) {
                navigate(`/student?session=${sessionId}`, { replace: true })
            }

            // Save for analytics in background
            saveUserQuery(
                user.uid,
                sessionId,
                currentQuery,
                assistantMsg.text,
                assistantMsg.confidence || 0,
                assistantMsg.citations
            )
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get answer')
            console.error('Query error:', err)
        } finally {
            setIsTyping(false)
        }
    }





    return (
        <div className="flex flex-col h-full relative">
            {/* Messages Area - Full height with centered content */}
            <div className="flex-1 overflow-y-auto pb-32 scroll-smooth" id="chat-container">
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
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-2xl px-6">
                            <h1 className="text-4xl font-bold text-text mb-4">What can I help with?</h1>
                            <p className="text-text-muted text-sm mb-8">
                                Ask me anything about university policies, programs, schedules, and more.
                            </p>
                        </div>
                    </div>
                )}

                {messages.length > 0 && (
                    <div className="max-w-6xl mx-auto space-y-10 px-6 pt-16 md:pt-24 pb-10">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`${msg.type === 'user' ? 'max-w-[85%]' : 'max-w-full'}`}>
                                    <div className={`${msg.type === 'user'
                                        ? 'bg-secondary text-secondary-foreground rounded-2xl px-5 py-3'
                                        : 'px-2 py-1'}`}>
                                        <div className={`text-sm leading-relaxed ${msg.type === 'assistant' ? 'text-text' : 'text-inherit'} prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm, remarkBreaks]}
                                                components={{
                                                    strong: ({ node, ...props }: any) => <span className="font-semibold text-primary bg-primary/10 px-1 rounded" {...props} />,
                                                    em: ({ node, ...props }: any) => <span className="font-semibold text-primary bg-primary/10 px-1 rounded not-italic" {...props} />
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        </div>
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
                                <div className="max-w-full px-2 py-1">
                                    <div className="text-sm leading-relaxed text-text prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                            components={{
                                                strong: ({ node, ...props }: any) => <span className="font-semibold text-primary bg-primary/10 px-1 rounded" {...props} />,
                                                em: ({ node, ...props }: any) => <span className="font-semibold text-primary bg-primary/10 px-1 rounded not-italic" {...props} />
                                            }}
                                        >
                                            {displayedText + (streamingMessage ? '▋' : '')}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="px-2 py-1 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex justify-center my-4">
                                <div className="flex items-center gap-2 text-error bg-error/10 border border-error/20 rounded-lg px-4 py-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4">
                <div className="max-w-5xl mx-auto">
                    <PlaceholdersAndVanishInput
                        placeholders={EXAMPLE_QUESTIONS}
                        onChange={(e) => setQuery(e.target.value)}
                        onSubmit={handleSubmit}
                    />
                    <p className="text-center text-xs text-text-muted mt-2">
                        UniQuery AI can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    )
}

