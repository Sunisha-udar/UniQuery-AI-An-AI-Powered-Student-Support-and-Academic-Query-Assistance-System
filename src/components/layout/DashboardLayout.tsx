import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronDown } from 'lucide-react'

interface DashboardLayoutProps {
    children: ReactNode
    variant: 'admin' | 'student'
}

export function DashboardLayout({ children, variant }: DashboardLayoutProps) {
    const { user } = useAuth()
    const title = variant === 'admin' ? 'Admin Dashboard' : user?.email?.split('@')[0] || 'Student'

    return (
        <div className="min-h-screen bg-background">
            <Sidebar variant={variant} />

            {/* Main Content */}
            <div className="ml-[200px]">
                {/* Header */}
                <header className="h-14 bg-header border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-sidebar">
                        AI-Powered Student Support & Academic Query System
                    </h1>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-text-muted">{title}</span>
                        <ChevronDown className="w-4 h-4 text-text-muted" />
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                            <img
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
