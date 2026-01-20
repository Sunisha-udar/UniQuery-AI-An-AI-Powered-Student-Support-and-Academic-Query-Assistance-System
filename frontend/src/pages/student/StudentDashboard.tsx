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
    Download
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
    const [course, setCourse] = useState(user?.program || '')
    const [semester, setSemester] = useState(user?.semester?.toString() || '')
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
        if (user?.program) setCourse(user.program)
        if (user?.semester) setSemester(user.semester.toString())
    }, [user])

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
                {/* Ask a Question Section */}
                <Card className="bg-gradient-to-r from-sidebar to-primary/90">
                    <CardContent className="py-5">
                        <h2 className="text-lg font-semibold text-white mb-4">Ask a question:</h2>

                        <div className="flex items-center gap-3 mb-3">
                            <Select
                                options={COURSES}
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                className="flex-1 bg-white"
                            />
                            <Select
                                options={SEMESTERS}
                                value={semester}
                                onChange={(e) => setSemester(e.target.value)}
                                className="flex-1 bg-white"
                            />
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Select Subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-white text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            </div>
                            <Button className="bg-primary hover:bg-primary-hover text-white px-6">
                                Ask
                            </Button>
                        </div>

                        <p className="text-sm text-white/70">
                            Hint: Ask questions like "What is the attendance requirement for BCA?" or "When are the internal exams scheduled?"
                        </p>
                    </CardContent>
                </Card>

                {/* Popular Questions + Answer Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: 'calc(100vh - 280px)' }}>
                    {/* Popular Questions */}
                    <Card className="h-fit">
                        <CardHeader>
                            <h2 className="text-base font-semibold text-text">Popular Questions</h2>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {POPULAR_QUESTIONS.map((question, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePopularQuestion(question)}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-border/50 transition-colors cursor-pointer text-left group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <Play className="w-3 h-3 text-white fill-white" />
                                    </div>
                                    <span className="text-sm text-text group-hover:text-primary transition-colors">
                                        {question}
                                    </span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Answer Panel */}
                    <Card className="lg:col-span-3 flex flex-col h-full">
                        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
                            <h2 className="text-base font-semibold text-text">Answer</h2>
                            <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 rounded hover:bg-border/50 transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5 text-text-muted" />
                                </button>

                                {showMenu && (
                                    <div className="absolute right-0 top-8 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-10">
                                        <button
                                            onClick={handleStartNewChat}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                                        >
                                            <MessageSquarePlus className="w-4 h-4" />
                                            Start new chat
                                        </button>
                                        <button
                                            onClick={handleClearHistory}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear history
                                        </button>
                                        <button
                                            onClick={handleExportChat}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-background transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Export chat
                                        </button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 overflow-hidden">
                            {/* Chat Messages - Scrollable Area */}
                            <div className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                            <User className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex-1 py-2 px-4 bg-background rounded-lg">
                                            <p className="text-sm text-text">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* AI Answer - Inside Chat Flow */}
                                {activeAnswer && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xs font-bold">AI</span>
                                        </div>
                                        <div className="flex-1 py-3 px-4 bg-teal/5 rounded-lg border border-teal/20">
                                            <p className="text-sm text-text font-medium mb-2">
                                                {activeAnswer.text}
                                            </p>
                                            {activeAnswer.source && (
                                                <p className="text-xs text-primary">
                                                    • Source: {activeAnswer.source}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-3">
                                                <button className="p-1.5 rounded hover:bg-success/10 text-text-muted hover:text-success transition-colors">
                                                    <ThumbsUp className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 rounded hover:bg-error/10 text-text-muted hover:text-error transition-colors">
                                                    <ThumbsDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input - Fixed at Bottom */}
                            <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-4 border-t border-border flex-shrink-0">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 h-10 px-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                                    <Send className="w-4 h-4 mr-2" />
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
