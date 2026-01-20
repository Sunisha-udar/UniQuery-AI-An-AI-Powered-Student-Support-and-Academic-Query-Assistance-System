import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { BarChart3, TrendingUp, Users, MessageSquare, FileText, Activity } from 'lucide-react'

const STATS = [
    { label: 'Total Queries', value: '2,547', change: '+12.5%', trend: 'up', icon: MessageSquare },
    { label: 'Active Users', value: '1,234', change: '+8.2%', trend: 'up', icon: Users },
    { label: 'Documents', value: '156', change: '+3.1%', trend: 'up', icon: FileText },
    { label: 'Avg Response Time', value: '1.2s', change: '-15.3%', trend: 'up', icon: Activity },
]

const WEEKLY_DATA = [
    { day: 'Mon', queries: 45, users: 32 },
    { day: 'Tue', queries: 52, users: 38 },
    { day: 'Wed', queries: 61, users: 45 },
    { day: 'Thu', queries: 48, users: 35 },
    { day: 'Fri', queries: 70, users: 52 },
    { day: 'Sat', queries: 38, users: 28 },
    { day: 'Sun', queries: 25, users: 18 },
]

const TOP_DOCUMENTS = [
    { name: 'BCA Syllabus 2024', queries: 342, percentage: 95 },
    { name: 'Attendance Policy', queries: 287, percentage: 80 },
    { name: 'Exam Rules 2024', queries: 254, percentage: 70 },
    { name: 'Academic Calendar', queries: 198, percentage: 55 },
    { name: 'Backlog Rules', queries: 156, percentage: 43 },
]

const POPULAR_TOPICS = [
    { topic: 'Attendance', count: 456, color: 'bg-blue-500' },
    { topic: 'Exams', count: 389, color: 'bg-green-500' },
    { topic: 'Syllabus', count: 342, color: 'bg-purple-500' },
    { topic: 'Fees', count: 287, color: 'bg-orange-500' },
    { topic: 'Results', count: 234, color: 'bg-pink-500' },
]

export function AdminAnalytics() {
    const maxQueries = Math.max(...WEEKLY_DATA.map(d => d.queries))
    const maxTopicCount = Math.max(...POPULAR_TOPICS.map(t => t.count))

    return (
        <DashboardLayout variant="admin">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Analytics</h1>
                        <p className="text-sm text-text-muted mt-1">Track performance and insights</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STATS.map((stat, index) => (
                        <Card key={index} className="border border-border shadow-sm">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-text-muted">{stat.label}</p>
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <stat.icon className="w-4 h-4 text-primary" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-text mb-1">{stat.value}</p>
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3 text-success" />
                                    <span className="text-xs text-success">{stat.change}</span>
                                    <span className="text-xs text-text-muted">vs last week</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Activity */}
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Weekly Activity</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {WEEKLY_DATA.map((data, index) => (
                                    <div key={index} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-text">{data.day}</span>
                                            <span className="text-xs font-semibold text-primary">{data.queries} queries</span>
                                        </div>
                                        <div className="relative w-full h-3 bg-background rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out group-hover:shadow-md"
                                                data-width={`${(data.queries / maxQueries) * 100}%`}
                                                style={{ width: `${(data.queries / maxQueries) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Popular Topics */}
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Popular Topics</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {POPULAR_TOPICS.map((topic, index) => (
                                    <div key={index} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${topic.color}`}></div>
                                                <span className="text-sm font-medium text-text">{topic.topic}</span>
                                            </div>
                                            <span className="text-xs font-semibold text-text-muted">{topic.count}</span>
                                        </div>
                                        <div className="relative w-full h-3 bg-background rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`absolute inset-y-0 left-0 ${topic.color} rounded-full transition-all duration-500 ease-out group-hover:opacity-90`}
                                                data-width={`${(topic.count / maxTopicCount) * 100}%`}
                                                style={{ width: `${(topic.count / maxTopicCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Documents */}
                <Card className="border border-border shadow-sm">
                    <CardHeader>
                        <h2 className="text-sm font-semibold text-text">Most Queried Documents</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {TOP_DOCUMENTS.map((doc, index) => (
                                <div key={index} className="flex items-center gap-4 group hover:bg-background/50 p-3 rounded-lg transition-colors -mx-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <span className="text-sm font-bold text-white">{index + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-text truncate">{doc.name}</span>
                                            <span className="text-xs font-bold text-primary ml-2">{doc.queries}</span>
                                        </div>
                                        <div className="relative w-full h-2.5 bg-background rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/70 rounded-full transition-all duration-500 ease-out"
                                                data-percentage={doc.percentage}
                                                style={{ width: `${doc.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
