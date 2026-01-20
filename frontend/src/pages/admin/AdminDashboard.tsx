import { useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import {
    FileText,
    Upload,
    Pencil,
    Trash2,
    ThumbsUp,
    ThumbsDown,
    LayoutDashboard
} from 'lucide-react'

const DEPARTMENTS = [
    { value: 'bca', label: 'BCA' },
    { value: 'btech', label: 'B.Tech' },
    { value: 'mca', label: 'MCA' },
    { value: 'mba', label: 'MBA' },
]

const DOCUMENTS = [
    { id: '1', name: 'BCA Syllabus.pdf', type: 'pdf' },
    { id: '2', name: 'Exam Schedule 2024.docx', type: 'docx' },
    { id: '3', name: 'Attendance Rules.pdf', type: 'pdf' },
    { id: '4', name: 'Academic Calendar 2024.pdf', type: 'pdf' },
    { id: '5', name: 'Reevaluation Guidelines.txt', type: 'txt' },
]

const RECENT_QUESTIONS = [
    { id: '1', text: 'What are the attendance requirements for BCA?', keyword: 'attendance' },
    { id: '2', text: 'When are the internal exams scheduled?', keyword: 'internal exams' },
    { id: '3', text: 'How can I apply for revaluation?', keyword: 'revaluation' },
    { id: '4', text: 'What electives are available in the 5th semester?', keyword: '5th semester' },
]

const TOP_DOCUMENTS = [
    'BCA Syllabus.pdf',
    'Exam Schedule 2024.docx',
    'Attendance Rules.pdf',
]

const CHART_DATA = [
    { day: 'Sat', value: 15 },
    { day: 'Sun', value: 8 },
    { day: 'Mon', value: 25 },
    { day: 'Tue', value: 18 },
    { day: 'Wed', value: 22 },
    { day: 'Nov', value: 12 },
    { day: 'May', value: 28 },
    { day: 'Jun', value: 35 },
    { day: 'Jul', value: 42 },
    { day: 'Oct', value: 58 },
]

export function AdminDashboard() {
    const [department, setDepartment] = useState('bca')

    const maxValue = Math.max(...CHART_DATA.map(d => d.value))

    return (
        <DashboardLayout variant="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
                        <p className="text-sm text-text-muted mt-1">Overview of system activity and performance</p>
                    </div>
                </div>

                {/* Row 1: Documents + Recent Questions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload & Manage Documents */}
                    <Card className="lg:col-span-2 border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Upload & Manage Documents</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Department Select */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-text-muted">Select Department:</span>
                                <Select
                                    options={DEPARTMENTS}
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-40"
                                />
                            </div>

                            {/* Uploaded Documents */}
                            <div>
                                <h3 className="text-xs font-semibold text-text-muted mb-3">Uploaded Documents</h3>
                                <div className="space-y-2">
                                    {DOCUMENTS.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between py-2.5 px-3 bg-background rounded-lg hover:bg-border/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-primary" />
                                                <span className="text-sm text-text">{doc.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="h-7 px-3 text-xs rounded-md bg-background border border-border hover:bg-surface transition-colors flex items-center gap-1">
                                                    <Pencil className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <button className="h-7 px-3 text-xs rounded-md bg-background border border-border hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upload Button */}
                            <div className="flex justify-center pt-2">
                                <Button className="bg-primary hover:bg-primary-hover text-white">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload New Document
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Questions */}
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Recent Questions</h2>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {RECENT_QUESTIONS.map((q) => (
                                <div key={q.id} className="flex items-start gap-3 p-2 hover:bg-background rounded-lg transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                    <p className="text-sm text-text leading-relaxed">
                                        {q.text.split(q.keyword).map((part, i, arr) => (
                                            <span key={i}>
                                                {part}
                                                {i < arr.length - 1 && <strong className="font-semibold text-primary">{q.keyword}</strong>}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            ))}
                            <div className="pt-2">
                                <Button className="w-full bg-primary hover:bg-primary-hover text-white">
                                    View All Queries
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Row 2: Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Query Activity */}
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Query Activity</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-4 mb-4">
                                <div>
                                    <span className="text-sm text-text-muted">Queries Today: </span>
                                    <span className="text-xl font-bold text-text">58</span>
                                </div>
                                <span className="text-xs text-text-muted">Total Queries 1,245</span>
                            </div>

                            {/* Bar Chart */}
                            <div className="h-32 flex items-end gap-1.5">
                                {CHART_DATA.map((item, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-primary/80 rounded-t-sm transition-all duration-300 hover:bg-primary"
                                            data-height={`${(item.value / maxValue) * 100}%`}
                                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                                        />
                                        <span className="text-[10px] text-text-muted">{item.day}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Documents Accessed */}
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Top Documents Accessed</h2>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-3">
                                {TOP_DOCUMENTS.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-3 p-2 hover:bg-background rounded-lg transition-colors">
                                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-semibold text-primary">{i + 1}</span>
                                        </div>
                                        <span className="text-sm text-text">{doc}</span>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>

                    {/* User Feedback */}
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">User Feedback</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center gap-8 py-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <ThumbsUp className="w-5 h-5 text-success" />
                                        <span className="text-2xl font-bold text-success">85%</span>
                                    </div>
                                    <span className="text-xs text-text-muted">Helpful</span>
                                </div>
                                <div className="w-px h-12 bg-border"></div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <ThumbsDown className="w-5 h-5 text-error" />
                                        <span className="text-2xl font-bold text-error">15%</span>
                                    </div>
                                    <span className="text-xs text-text-muted">Not Helpful</span>
                                </div>
                            </div>
                            <Button className="w-full bg-primary hover:bg-primary-hover text-white mt-4">
                                View Feedback
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
