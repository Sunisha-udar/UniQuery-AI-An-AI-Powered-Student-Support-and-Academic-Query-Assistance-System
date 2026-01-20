import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface DashboardLayoutProps {
    children: ReactNode
    variant: 'admin' | 'student'
}

export function DashboardLayout({ children, variant }: DashboardLayoutProps) {

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            <Sidebar variant={variant} />

            {/* Main Content */}
            <div className="ml-64 flex-1 min-w-0 flex flex-col">
                {/* Page Content */}
                <main className="p-6 w-full flex-1 overflow-auto">
                    <div className="max-w-[1600px] mx-auto h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
