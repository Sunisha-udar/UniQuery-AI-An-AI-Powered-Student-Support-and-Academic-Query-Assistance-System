import { type ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { motion } from 'framer-motion'

interface DashboardLayoutProps {
    children: ReactNode
    variant: 'admin' | 'student'
    currentSessionId?: string | null
}

export function DashboardLayout({
    children,
    variant,
    currentSessionId,
}: DashboardLayoutProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded)
    }

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            <div
                style={{
                    width: isExpanded ? '260px' : '64px',
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="fixed left-0 top-0 h-screen z-30"
            >
                <Sidebar
                    variant={variant}
                    isExpanded={isExpanded}
                    onToggle={toggleSidebar}
                    currentSessionId={currentSessionId}
                />
            </div>

            {/* Main Content */}
            <motion.div
                initial={false}
                animate={{
                    marginLeft: isExpanded ? '260px' : '64px'
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1 min-w-0 flex flex-col overflow-hidden"
            >
                {/* Page Content */}
                <main className="w-full flex-1 overflow-hidden">
                    {children}
                </main>
            </motion.div>
        </div>
    )
}
