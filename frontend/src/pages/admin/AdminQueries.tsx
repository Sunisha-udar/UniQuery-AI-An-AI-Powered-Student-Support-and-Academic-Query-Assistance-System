
import { Card, CardContent } from '../../components/ui/Card'
import { MessageSquare } from 'lucide-react'

export function AdminQueries() {
    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
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

                {/* Coming Soon Message */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="py-16 text-center">
                        <MessageSquare className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-text mb-2">Query Monitoring Coming Soon</h3>
                        <p className="text-sm text-text-muted max-w-md mx-auto">
                            Query tracking and monitoring will be available once students start asking questions.
                            All queries will be logged and displayed here for review.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
