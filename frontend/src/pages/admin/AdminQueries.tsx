import { useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { MessageSquare, Search, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'answered', label: 'Answered' },
    { value: 'flagged', label: 'Flagged' },
]

const MOCK_QUERIES = [
    {
        id: '1',
        question: 'What is the attendance requirement for BCA students?',
        student: 'john.doe@university.edu',
        timestamp: '2024-01-15 10:30 AM',
        status: 'answered',
        answer: 'BCA students must maintain a minimum of 75% attendance.',
        confidence: 95
    },
    {
        id: '2',
        question: 'When are the internal assessment exams scheduled?',
        student: 'jane.smith@university.edu',
        timestamp: '2024-01-15 09:15 AM',
        status: 'answered',
        answer: 'Internal assessments are typically conducted in the 8th and 14th week of the semester.',
        confidence: 88
    },
    {
        id: '3',
        question: 'How can I apply for revaluation of my exam papers?',
        student: 'mike.wilson@university.edu',
        timestamp: '2024-01-15 08:45 AM',
        status: 'pending',
        answer: null,
        confidence: 0
    },
    {
        id: '4',
        question: 'What electives are available in the 5th semester for CSE?',
        student: 'sarah.jones@university.edu',
        timestamp: '2024-01-14 04:20 PM',
        status: 'answered',
        answer: 'Available electives include Machine Learning, Cloud Computing, Blockchain, and Cyber Security.',
        confidence: 92
    },
    {
        id: '5',
        question: 'Are there any rules regarding mobile phones in the examination hall?',
        student: 'tom.brown@university.edu',
        timestamp: '2024-01-14 02:10 PM',
        status: 'flagged',
        answer: 'Mobile phones and electronic devices are strictly prohibited in examination halls.',
        confidence: 65
    },
]

export function AdminQueries() {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [expandedQuery, setExpandedQuery] = useState<string | null>(null)

    const filteredQueries = MOCK_QUERIES.filter(query => {
        const matchesSearch = query.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             query.student.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || query.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'answered': return 'success'
            case 'pending': return 'warning'
            case 'flagged': return 'error'
            default: return 'default'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'answered': return <CheckCircle className="w-4 h-4" />
            case 'pending': return <Clock className="w-4 h-4" />
            case 'flagged': return <AlertCircle className="w-4 h-4" />
            default: return null
        }
    }

    return (
        <DashboardLayout variant="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">User Queries</h1>
                        <p className="text-sm text-text-muted mt-1">Monitor and manage student questions</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-border shadow-sm">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Total Queries</p>
                                    <p className="text-2xl font-bold text-text mt-1">{MOCK_QUERIES.length}</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-border shadow-sm">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Answered</p>
                                    <p className="text-2xl font-bold text-success mt-1">
                                        {MOCK_QUERIES.filter(q => q.status === 'answered').length}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-success" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-border shadow-sm">
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Pending</p>
                                    <p className="text-2xl font-bold text-warning mt-1">
                                        {MOCK_QUERIES.filter(q => q.status === 'pending').length}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-warning" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[250px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search queries or students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                                />
                            </div>
                            <Select
                                options={STATUS_OPTIONS}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-48"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Queries List */}
                <div className="space-y-3">
                    {filteredQueries.map((query) => (
                        <Card key={query.id} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="py-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={getStatusColor(query.status)} className="text-xs">
                                                    {getStatusIcon(query.status)}
                                                    <span className="ml-1 capitalize">{query.status}</span>
                                                </Badge>
                                                {query.confidence > 0 && (
                                                    <span className="text-xs text-text-muted">
                                                        Confidence: {query.confidence}%
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setExpandedQuery(expandedQuery === query.id ? null : query.id)}
                                                className="text-left w-full"
                                            >
                                                <p className="text-sm font-medium text-text hover:text-primary transition-colors">
                                                    {query.question}
                                                </p>
                                            </button>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                                                <div className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {query.student}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {query.timestamp}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {expandedQuery === query.id && query.answer && (
                                        <div className="pt-3 border-t border-border">
                                            <p className="text-xs font-medium text-text-muted mb-1">AI Response:</p>
                                            <p className="text-xs text-text leading-relaxed bg-background p-3 rounded-lg">
                                                {query.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredQueries.length === 0 && (
                    <Card className="border border-border shadow-sm">
                        <CardContent className="py-12 text-center">
                            <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-3" />
                            <p className="text-sm text-text-muted">No queries found matching your filters</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
