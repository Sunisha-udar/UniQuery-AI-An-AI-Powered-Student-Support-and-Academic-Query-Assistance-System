import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
    children: ReactNode
    variant: 'admin' | 'student'
}

export function DashboardLayout({ children, variant }: DashboardLayoutProps) {

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar variant={variant} />

            {/* Main Content */}
            <div className="ml-64 flex-1 min-w-0">
                {/* Page Content */}
                <main className="p-6 w-full">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
