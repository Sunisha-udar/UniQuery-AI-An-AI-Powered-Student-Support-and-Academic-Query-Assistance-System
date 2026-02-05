import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'
import { getAllUserQueries, type UserQuery } from '../../lib/chatHistory'
import {
    FileText,
    LayoutDashboard,
    AlertCircle,
    MessageSquare,
    Activity,
    TrendingUp,
    Clock,
    ChevronRight,
    Users,
    Zap
} from 'lucide-react'

export function AdminDashboard() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalQueries: 0,
        queriesToday: 0,
        avgConfidenceToday: 0,
        lowConfidenceCount: 0
    })
    const [recentQueries, setRecentQueries] = useState<UserQuery[]>([])
    const [systemHealth, setSystemHealth] = useState<{
        backend: 'online' | 'offline' | 'checking'
        vectorDb: 'online' | 'offline' | 'checking'
        latency: number | null
    }>({
        backend: 'checking',
        vectorDb: 'checking',
        latency: null
    })

    useEffect(() => {
        loadDashboardData()
        checkSystemHealth()
    }, [])

    const loadDashboardData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch documents
            let docCount = 0
            try {
                const documents = await api.getDocuments()
                docCount = documents.length
            } catch {
                console.warn('Could not fetch documents')
            }

            // Fetch queries
            let queries: UserQuery[] = []
            try {
                queries = await getAllUserQueries(100)
            } catch {
                console.warn('Could not fetch queries')
            }

            // Calculate today's stats
            const today = new Date().toISOString().split('T')[0]
            const todayQueries = queries.filter(q => {
                const qDate = new Date(q.created_at).toISOString().split('T')[0]
                return qDate === today
            })

            const todayConfidences: number[] = todayQueries
                .filter(q => q.confidence !== undefined && q.confidence !== null)
                .map(q => q.confidence as number)

            const avgConfToday = todayConfidences.length > 0
                ? todayConfidences.reduce((a, b) => a + b, 0) / todayConfidences.length
                : 0

            const lowConfCount = queries.filter(q =>
                q.confidence !== undefined && q.confidence !== null && q.confidence < 0.7
            ).length

            setStats({
                totalDocuments: docCount,
                totalQueries: queries.length,
                queriesToday: todayQueries.length,
                avgConfidenceToday: avgConfToday,
                lowConfidenceCount: lowConfCount
            })

            setRecentQueries(queries.slice(0, 5))
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
            if (!errorMessage.includes('Failed to fetch')) {
                setError(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }

    const checkSystemHealth = async () => {
        const startTime = Date.now()
        try {
            const health = await api.checkHealth()
            const latency = Date.now() - startTime
            setSystemHealth({
                backend: 'online',
                vectorDb: health.qdrant_connected ? 'online' : 'offline',
                latency
            })
        } catch {
            setSystemHealth({
                backend: 'offline',
                vectorDb: 'offline',
                latency: null
            })
        }
    }

    const formatTimestamp = (dateStr: string) => {
        const date = new Date(dateStr)

        // Check for invalid date
        if (isNaN(date.getTime())) {
            return 'Invalid date'
        }

        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        return date.toLocaleDateString()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'text-green-500'
            case 'offline': return 'text-red-500'
            default: return 'text-yellow-500'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'online': return '● Online'
            case 'offline': return '● Offline'
            default: return '○ Checking...'
        }
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
                            <p className="text-sm text-text-muted mt-1">Overview of system activity and performance</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { loadDashboardData(); checkSystemHealth() }}
                        className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {error && (
                    <Card className="border border-error/20 bg-error/5">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-error" />
                                <span className="text-sm text-error">{error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Documents</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {loading ? '...' : stats.totalDocuments}
                                    </p>
                                </div>
                                <FileText className="w-8 h-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Total Queries</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {loading ? '...' : stats.totalQueries}
                                    </p>
                                </div>
                                <MessageSquare className="w-8 h-8 text-blue-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Today</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {loading ? '...' : stats.queriesToday}
                                    </p>
                                </div>
                                <Activity className="w-8 h-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-text-muted">Avg Conf. Today</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {loading ? '...' : stats.avgConfidenceToday > 0
                                            ? Math.round(stats.avgConfidenceToday * 100) + '%'
                                            : 'N/A'}
                                    </p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-emerald-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity Feed */}
                    <Card className="lg:col-span-2 border border-border shadow-sm">
                        <CardHeader className="border-b border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <h2 className="text-sm font-semibold text-text">Recent Activity</h2>
                                </div>
                                <Link
                                    to="/admin/queries"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    View all <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="py-12 text-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </div>
                            ) : recentQueries.length === 0 ? (
                                <div className="py-12 text-center">
                                    <MessageSquare className="w-10 h-10 text-text-muted mx-auto mb-2 opacity-50" />
                                    <p className="text-sm text-text-muted">No queries yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentQueries.map((query) => (
                                        <div key={query.id} className="p-4 hover:bg-muted/20 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-text line-clamp-2">{query.question}</p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-xs text-text-muted flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTimestamp(query.created_at)}
                                                        </span>
                                                        {query.confidence != null && (
                                                            <span className={`text-xs font-medium ${query.confidence >= 0.7 ? 'text-green-500' : 'text-red-500'
                                                                }`}>
                                                                {Math.round(query.confidence * 100)}% conf
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Pending Actions */}
                        {stats.lowConfidenceCount > 0 && (
                            <Card className="border border-amber-500/30 bg-amber-500/5 shadow-sm">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                            <AlertCircle className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-text">
                                                {stats.lowConfidenceCount} Low Confidence
                                            </p>
                                            <p className="text-xs text-text-muted mt-0.5">
                                                Queries need review
                                            </p>
                                        </div>
                                        <Link
                                            to="/admin/analytics"
                                            className="text-xs text-amber-600 hover:underline"
                                        >
                                            Review
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <h2 className="text-sm font-semibold text-text">Quick Actions</h2>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    className="w-full bg-primary hover:bg-primary-hover text-white justify-start"
                                    onClick={() => navigate('/admin/documents')}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Manage Documents
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full justify-start"
                                    onClick={() => navigate('/admin/queries')}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    View Queries
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full justify-start"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    User Management
                                </Button>
                            </CardContent>
                        </Card>

                        {/* System Status */}
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <h2 className="text-sm font-semibold text-text">System Health</h2>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-text-muted">Backend API</span>
                                        <span className={`text-xs font-medium ${getStatusColor(systemHealth.backend)}`}>
                                            {getStatusText(systemHealth.backend)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-text-muted">Vector DB</span>
                                        <span className={`text-xs font-medium ${getStatusColor(systemHealth.vectorDb)}`}>
                                            {getStatusText(systemHealth.vectorDb)}
                                        </span>
                                    </div>
                                    {systemHealth.latency !== null && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-text-muted">API Latency</span>
                                            <span className={`text-xs font-medium ${systemHealth.latency < 500 ? 'text-green-500' :
                                                systemHealth.latency < 1500 ? 'text-yellow-500' : 'text-red-500'
                                                }`}>
                                                {systemHealth.latency}ms
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
