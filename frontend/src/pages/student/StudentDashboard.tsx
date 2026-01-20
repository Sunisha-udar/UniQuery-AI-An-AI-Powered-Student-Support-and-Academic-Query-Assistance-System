import { useState, type FormEvent, useRef, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import {
    Search,
    Send,
    Play,
    ThumbsUp,
    ThumbsDown,
    User,
    MoreVertical,
    Trash2,
    MessageSquarePlus,
    Download,
    LayoutDashboard
} from 'lucide-react'

const COURSES = [
    { value: '', label: 'Select Course' },
    { value: 'btech', label: 'B.Tech' },
    { value: 'mtech', label: 'M.Tech' },
    { value: 'bca', label: 'BCA' },
    { value: 'mca', label: 'MCA' },
    { value: 'bsc_cs', label: 'B.Sc (Cyber Security)' },
    { value: 'bsc_ts', label: 'B.Sc (Tech)' },
]

const SEMESTERS = [
    { value: '', label: 'Select Semester' },
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
]

const POPULAR_QUESTIONS = [
    'What is the attendance requirement for BCA students?',
    'When is the internal assessment conducted?',
    'How can I apply for revaluation?',
    'What electives are available in the 5th semester?',
]

interface Message {
    id: string
    type: 'user' | 'assistant'
    text: string
    source?: string
}

const INITIAL_MESSAGES: Message[] = []


const generateId = () => Math.random().toString(36).substr(2, 9)

export function StudentDashboard() {
    const { user } = useAuth()
    // Use lazy initializer to avoid reading user during render
    const [course, setCourse] = useState(() => user?.program || '')
    const [semester, setSemester] = useState(() => user?.semester?.toString() || '')
    const [subject, setSubject] = useState('')
    const [query, setQuery] = useState('')
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
    const [activeAnswer, setActiveAnswer] = useState<Message | null>(null)
    const [showMenu, setShowMenu] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleClearHistory = () => {
        setMessages([])
        setActiveAnswer(null)
        setShowMenu(false)
    }

    const handleStartNewChat = () => {
        setMessages([])
        setActiveAnswer(null)
        setQuery('')
        setShowMenu(false)
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

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        const newMessage: Message = {
            id: generateId(),
            type: 'user',
            text: query,
        }
        setMessages(prev => [...prev, newMessage])

        // Mock answer
        setActiveAnswer({
            id: 'answer-' + Date.now(),
            type: 'assistant',
            text: 'Based on the academic documents, I found relevant information for your query. Please note that specific details may vary by department.',
            source: 'Academic Handbook 2024, Page 12'
        })

        setQuery('')
    }

    const handlePopularQuestion = (question: string) => {
        const newMessage: Message = {
            id: generateId(),
            type: 'user',
            text: question,
        }
        setMessages(prev => [...prev, newMessage])

        // Mock answer for popular question
        if (question.includes('attendance')) {
            setActiveAnswer({
                id: 'answer-' + generateId(),
                type: 'assistant',
                text: 'BCA students must maintain a minimum of 75% attendance in each semester to be eligible for exams. Leaves of absence will only be considered if supported by valid medical or other official documents.',
                source: 'Attendance Rules.pdf, Page 3'
            })
        } else {
            setActiveAnswer({
                id: 'answer-' + generateId(),
                type: 'assistant',
                text: 'I found relevant information in the academic documents. Please refer to the source for detailed information.',
                source: 'Academic Handbook 2024'
            })
        }
    }

    return (
        <DashboardLayout variant="student">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
                        <p className="text-sm text-text-muted">Ask questions about your academic documents</p>
                    </div>
                </div>

                {/* Ask a Question Section */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="py-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Select
                                options={COURSES}
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                className="flex-1"
                            />
                            <Select
                                options={SEMESTERS}
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                className="flex-1"
                            />
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Select Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-white text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                        </div>

                        <p className="text-xs text-text-muted">
                            💡 Try: "What is the attendance requirement?" or "When are exams scheduled?"
                        </p>
                    </CardContent>
                </Card>

                {/* Popular Questions + Answer Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 chat-container-height">
                    {/* Popular Questions */}
                    <Card className="h-fit border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Popular Questions</h2>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {POPULAR_QUESTIONS.map((question, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePopularQuestion(question)}
                                    className="w-full flex items-start gap-2 p-3 rounded-lg hover:bg-background transition-all cursor-pointer text-left group border border-transparent hover:border-border"
                                >
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Play className="w-2.5 h-2.5 text-primary fill-primary" />
                                    </div>
                                    <span className="text-xs text-text-muted group-hover:text-text transition-colors leading-relaxed">
                                        {question}
                                    </span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Answer Panel */}
                    <Card className="lg:col-span-3 flex flex-col h-full border border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0 border-b border-border">
                            <h2 className="text-sm font-semibold text-text">Chat</h2>
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 rounded-md hover:bg-background transition-colors"
                                    aria-label="Open chat menu"
                                >
                                    <MoreVertical className="w-4 h-4 text-text-muted" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-9 w-44 bg-white border border-border rounded-lg shadow-lg py-1 z-10">
                                        <button
                                            onClick={handleStartNewChat}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-background transition-colors"
                                        >
                                            <MessageSquarePlus className="w-3.5 h-3.5" />
                                            Start new chat
                                        </button>
                                        <button
                                            onClick={handleClearHistory}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-background transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Clear history
                                        </button>
                                        <button
                                            onClick={handleExportChat}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-text hover:bg-background transition-colors"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Export chat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 overflow-hidden">
                            {/* Chat Messages - Scrollable Area */}
                            <div className="flex-1 space-y-4 overflow-y-auto py-4">
                                {messages.length === 0 && !activeAnswer && (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-sm text-text-muted">Start a conversation by asking a question</p>
                                    </div>
                                )}
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <User className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <div className="flex-1 py-2.5 px-3.5 bg-background rounded-lg">
                                            <p className="text-xs text-text leading-relaxed">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* AI Answer - Inside Chat Flow */}
                                {activeAnswer && (
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-[10px] font-semibold">AI</span>
                                        </div>
                                        <div className="flex-1 py-3 px-3.5 bg-primary/5 rounded-lg border border-primary/10">
                                            <p className="text-xs text-text leading-relaxed mb-2">
                                                {activeAnswer.text}
                                            </p>
                                            {activeAnswer.source && (
                                                <p className="text-[11px] text-text-muted mt-2 pt-2 border-t border-border">
                                                    📄 {activeAnswer.source}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-3">
                                                <button 
                                                    className="p-1.5 rounded-md hover:bg-success/10 text-text-muted hover:text-success transition-colors"
                                                    aria-label="Mark answer as helpful"
                                                >
                                                    <ThumbsUp className="w-3.5 h-3.5" />
                                                </button>
                                                <button 
                                                    className="p-1.5 rounded-md hover:bg-error/10 text-text-muted hover:text-error transition-colors"
                                                    aria-label="Mark answer as not helpful"
                                                >
                                                    <ThumbsDown className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input - Fixed at Bottom */}
                            <form onSubmit={handleSubmit} className="flex items-center gap-2.5 pt-4 border-t border-border flex-shrink-0">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 h-9 px-3.5 text-sm rounded-lg border border-border bg-white text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                                />
                                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white h-9 px-4 text-sm">
                                    <Send className="w-3.5 h-3.5 mr-1.5" />
                                    Send
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
