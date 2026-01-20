import { useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { HelpCircle } from 'lucide-react'

export function FAQPage() {
    return (
        <DashboardLayout variant="student">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">FAQs</h1>
                        <p className="text-sm text-text-muted">Find answers to common questions</p>
                    </div>
                </div>

                <Card className="border border-border shadow-sm">
                    <div className="py-16 text-center px-4">
                        <HelpCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-text mb-2">Ask Your Questions</h3>
                        <p className="text-sm text-text-muted max-w-md mx-auto">
                            Use the Dashboard to ask any questions about your academic documents.
                            Our AI assistant will provide instant answers based on uploaded documents.
                        </p>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    )
}
