
import { Card, CardContent } from '../../components/ui/Card'
import { BarChart3, MessageSquare, TrendingUp, AlertCircle, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAllChatSessionsForAdmin, type ChatMessage } from '../../lib/chatHistory'
import { api } from '../../lib/api'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'

interface AnalyticsData {
    totalQueries: number
    avgConfidence: number
    lowConfidenceCount: number
    totalDocuments: number
    volumeByDay: { date: string; queries: number }[]
    confidenceDistribution: { name: string; value: number }[]
    topLowConfidenceQuestions: { question: string; confidence: number }[]
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1']

export function AdminAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData>({
        totalQueries: 0,
        avgConfidence: 0,
        lowConfidenceCount: 0,
        totalDocuments: 0,
        volumeByDay: [],
        confidenceDistribution: [],
        topLowConfidenceQuestions: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadAnalytics()
    }, [])

    const loadAnalytics = async () => {
        try {
            setLoading(true)

            // Fetch chat sessions
            const sessions = await getAllChatSessionsForAdmin(200)

            // Fetch documents count
            let documentCount = 0
            try {
                const documents = await api.getDocuments()
                documentCount = documents.length
            } catch (err) {
                console.warn('Could not fetch documents:', err)
            }

            // Process analytics
            const allMessages: (ChatMessage & { sessionId: string })[] = []
            sessions.forEach(session => {
                session.messages.forEach(msg => {
                    allMessages.push({ ...msg, sessionId: session.id })
                })
            })

            const userQueries = allMessages.filter(m => m.type === 'user')
            const assistantResponses = allMessages.filter(m => m.type === 'assistant')

            // Calculate confidence stats
            const confidenceScores = assistantResponses
                .filter(m => m.confidence !== undefined)
                .map(m => m.confidence!)

            const avgConfidence = confidenceScores.length > 0
                ? confidenceScores.reduce((acc, val) => acc + val, 0) / confidenceScores.length
                : 0

            const lowConfidenceCount = confidenceScores.filter(c => c < 0.7).length

            // Volume by day (last 7 days)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (6 - i))
                return d.toISOString().split('T')[0]
            })

            const volumeByDay = last7Days.map(date => {
                const count = userQueries.filter(q => {
                    const qDate = new Date(q.timestamp).toISOString().split('T')[0]
                    return qDate === date
                }).length
                return {
                    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    queries: count
                }
            })

            // Confidence distribution
            const highConf = confidenceScores.filter(c => c >= 0.9).length
            const medConf = confidenceScores.filter(c => c >= 0.7 && c < 0.9).length
            const lowConf = confidenceScores.filter(c => c < 0.7).length
            const noConf = assistantResponses.length - confidenceScores.length

            const confidenceDistribution = [
                { name: 'High (>90%)', value: highConf },
                { name: 'Medium (70-90%)', value: medConf },
                { name: 'Low (<70%)', value: lowConf },
                { name: 'N/A', value: noConf }
            ].filter(d => d.value > 0)

            // Top low confidence questions
            const lowConfQuestions = assistantResponses
                .filter(m => m.confidence !== undefined && m.confidence < 0.7)
                .map(m => {
                    // Find the corresponding user question
                    const msgIndex = allMessages.findIndex(msg =>
                        msg.sessionId === m.sessionId && msg.id === m.id
                    )
                    const userMsg = msgIndex > 0 ? allMessages[msgIndex - 1] : null

                    return {
                        question: userMsg?.text || 'Unknown question',
                        confidence: m.confidence!
                    }
                })
                .slice(0, 5) // Top 5

            setAnalytics({
                totalQueries: userQueries.length,
                avgConfidence,
                lowConfidenceCount,
                totalDocuments: documentCount,
                volumeByDay,
                confidenceDistribution,
                topLowConfidenceQuestions: lowConfQuestions
            })

            setError(null)
        } catch (err) {
            console.error('Failed to load analytics:', err)
            setError('Failed to load analytics. Check console for details.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">Analytics</h1>
                            <p className="text-sm text-text-muted mt-1">Track performance and insights</p>
                        </div>
                    </div>
                    <button
                        onClick={loadAnalytics}
                        className="px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="py-16 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-sm text-text-muted">Loading analytics...</p>
                    </div>
                ) : error ? (
                    <div className="py-16 text-center">
                        <BarChart3 className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-text mb-2">Error Loading Analytics</h3>
                        <p className="text-sm text-text-muted max-w-md mx-auto">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-text-muted">Total Queries</p>
                                            <p className="text-3xl font-bold text-text mt-1">{analytics.totalQueries}</p>
                                        </div>
                                        <MessageSquare className="w-10 h-10 text-primary opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-text-muted">Avg Confidence</p>
                                            <p className="text-3xl font-bold text-text mt-1">
                                                {analytics.avgConfidence > 0
                                                    ? Math.round(analytics.avgConfidence * 100) + '%'
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-text-muted">Low Confidence</p>
                                            <p className="text-3xl font-bold text-text mt-1">{analytics.lowConfidenceCount}</p>
                                        </div>
                                        <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-text-muted">Total Documents</p>
                                            <p className="text-3xl font-bold text-text mt-1">{analytics.totalDocuments}</p>
                                        </div>
                                        <FileText className="w-10 h-10 text-blue-500 opacity-50" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Volume Over Time */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-text mb-4">Query Volume (Last 7 Days)</h3>
                                    {analytics.volumeByDay.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={analytics.volumeByDay}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#888"
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <YAxis
                                                    stroke="#888"
                                                    style={{ fontSize: '12px' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1a1a1a',
                                                        border: '1px solid #333',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Bar dataKey="queries" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-text-muted">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Confidence Distribution */}
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-text mb-4">Confidence Distribution</h3>
                                    {analytics.confidenceDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={analytics.confidenceDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }: { name?: string, percent?: number }) => `${name || 'Unknown'}: ${((percent || 0) * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {analytics.confidenceDistribution.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1a1a1a',
                                                        border: '1px solid #333',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-[250px] flex items-center justify-center text-text-muted">
                                            No data available
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Low Confidence Questions */}
                        {analytics.topLowConfidenceQuestions.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                        Top Low-Confidence Questions
                                    </h3>
                                    <p className="text-sm text-text-muted mb-4">
                                        These questions received low-confidence answers. Consider uploading more documents on these topics.
                                    </p>
                                    <div className="space-y-3">
                                        {analytics.topLowConfidenceQuestions.map((q, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-lg bg-red-500/5 border border-red-500/20"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <p className="text-sm text-text flex-1">{q.question}</p>
                                                    <span className="text-xs font-semibold text-red-500 whitespace-nowrap">
                                                        {Math.round(q.confidence * 100)}% conf
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {analytics.totalQueries === 0 && (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-semibold text-text mb-2">No Data Yet</h3>
                                    <p className="text-sm text-text-muted max-w-md mx-auto">
                                        Analytics will populate once students start asking questions and interacting with your knowledge base.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
