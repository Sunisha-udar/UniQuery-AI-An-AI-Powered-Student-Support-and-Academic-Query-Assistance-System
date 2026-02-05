
import { Card, CardContent } from '../../components/ui/Card'
import { BarChart3 } from 'lucide-react'

export function AdminAnalytics() {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
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

                {/* Coming Soon Message */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="py-16 text-center">
                        <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-text mb-2">Analytics Coming Soon</h3>
                        <p className="text-sm text-text-muted max-w-md mx-auto">
                            Detailed analytics and insights will be available once you start uploading documents and receiving queries.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
