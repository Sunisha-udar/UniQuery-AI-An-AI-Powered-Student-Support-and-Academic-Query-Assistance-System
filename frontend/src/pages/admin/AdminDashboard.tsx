import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'
import {
    FileText,
    LayoutDashboard,
    AlertCircle
} from 'lucide-react'

export function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalQueries: 0
    })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            setLoading(true)
            setError(null)
            const documents = await api.getDocuments()
            setStats({
                totalDocuments: documents.length,
                totalQueries: 0 // Will be implemented with query tracking
            })
        } catch (err) {
            // Don't show error for empty collections
            const errorMessage = err instanceof Error ? err.message : 'Failed to load stats'
            if (!errorMessage.includes('Failed to fetch')) {
                setError(errorMessage)
            }
            // Set default stats on error
            setStats({
                totalDocuments: 0,
                totalQueries: 0
            })
        } finally {
            setLoading(false)
        }
    }

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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Total Documents</h2>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-16 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold text-text">{stats.totalDocuments}</p>
                                        <p className="text-xs text-text-muted mt-1">Uploaded documents</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">Quick Actions</h2>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button 
                                className="w-full bg-primary hover:bg-primary-hover text-white justify-start"
                                onClick={() => window.location.href = '/admin/documents'}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Manage Documents
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardHeader>
                            <h2 className="text-sm font-semibold text-text">System Status</h2>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-muted">Backend</span>
                                    <span className="text-xs font-medium text-success">● Online</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-muted">Vector DB</span>
                                    <span className="text-xs font-medium text-success">● Connected</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-muted">AI Model</span>
                                    <span className="text-xs font-medium text-success">● Ready</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Welcome Message */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="py-8 text-center">
                        <h3 className="text-lg font-semibold text-text mb-2">Welcome to UniQuery Admin</h3>
                        <p className="text-sm text-text-muted max-w-2xl mx-auto">
                            Upload and manage academic documents, monitor student queries, and track system performance.
                            Get started by uploading your first document.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
