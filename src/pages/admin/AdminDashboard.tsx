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
    ThumbsDown
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
                {/* Row 1: Documents + Recent Questions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload & Manage Documents */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <h2 className="text-base font-semibold text-text">Upload & Manage Documents</h2>
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
                                <h3 className="text-sm font-semibold text-text mb-3">Uploaded Documents</h3>
                                <div className="space-y-2">
                                    {DOCUMENTS.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between py-2 px-3 bg-background rounded-md"
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-4 h-4 text-primary" />
                                                <span className="text-sm text-text">{doc.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
                                                    <Pencil className="w-3 h-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button variant="secondary" size="sm" className="h-7 px-3 text-xs">
                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upload Button */}
                            <div className="flex justify-center pt-2">
                                <Button className="bg-teal hover:bg-teal-hover text-white">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload New Document
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Questions */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-base font-semibold text-text">Recent Questions</h2>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {RECENT_QUESTIONS.map((q) => (
                                <div key={q.id} className="flex items-start gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    <p className="text-sm text-text">
                                        {q.text.split(q.keyword).map((part, i, arr) => (
                                            <span key={i}>
                                                {part}
                                                {i < arr.length - 1 && <strong className="font-semibold">{q.keyword}</strong>}
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            ))}
                            <div className="pt-2">
                                <Button variant="primary" size="sm" className="w-full">
                                    View All Queries
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Row 2: Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Query Activity */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-base font-semibold text-text">Query Activity</h2>
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
                                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                                        />
                                        <span className="text-[10px] text-text-muted">{item.day}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Documents Accessed */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-base font-semibold text-text">Top Documents Accessed</h2>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-3">
                                {TOP_DOCUMENTS.map((doc, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <span className="text-sm text-text-muted">{i + 1}.</span>
                                        <span className="text-sm text-text">{doc}</span>
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>

                    {/* User Feedback */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-base font-semibold text-text">User Feedback</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center gap-8 py-4">
                                <div className="flex items-center gap-2">
                                    <ThumbsUp className="w-5 h-5 text-success" />
                                    <span className="text-sm">
                                        <span className="font-medium text-text">Helpful:</span>{' '}
                                        <span className="text-success font-semibold">85%</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ThumbsDown className="w-5 h-5 text-error" />
                                    <span className="text-sm">
                                        <span className="font-medium text-text">Not Helpful:</span>{' '}
                                        <span className="text-error font-semibold">15%</span>
                                    </span>
                                </div>
                            </div>
                            <Button variant="primary" size="sm" className="w-full">
                                View Feedback
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
