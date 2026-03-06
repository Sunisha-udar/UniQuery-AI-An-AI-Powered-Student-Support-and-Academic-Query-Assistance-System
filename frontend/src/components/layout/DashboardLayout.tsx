import { type ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'
import { NavigationDrawer } from './NavigationDrawer'
import { motion } from 'framer-motion'
import { LayoutDashboard, FileText, MessageSquare, BarChart3, Users, LifeBuoy } from 'lucide-react'

interface NavItem {
    icon: React.ElementType
    label: string
    href: string
}

interface DashboardLayoutProps {
    children: ReactNode
    variant: 'admin' | 'student'
    currentSessionId?: string | null
}

const ADMIN_NAV_ITEMS: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
    { icon: MessageSquare, label: 'Queries', href: '/admin/queries' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: LifeBuoy, label: 'Support', href: '/admin/support' },
]

export function DashboardLayout({
    children,
    variant,
    currentSessionId,
}: DashboardLayoutProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded)
    }

    const toggleMobileDrawer = () => {
        setIsMobileDrawerOpen(!isMobileDrawerOpen)
    }

    return (
        <div className="h-screen bg-background flex overflow-hidden flex-col md:flex-row">
            {/* Desktop Sidebar - Hidden on mobile */}
            <div
                style={{
                    width: isExpanded ? '260px' : '64px',
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="hidden md:block fixed left-0 top-0 h-screen z-30"
            >
                <Sidebar
                    variant={variant}
                    isExpanded={isExpanded}
                    onToggle={toggleSidebar}
                    currentSessionId={currentSessionId}
                />
            </div>

            {/* Mobile Header - Visible only on mobile */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-20">
                <MobileHeader
                    onMenuToggle={toggleMobileDrawer}
                    title={variant === 'student' ? 'UniQuery AI' : 'UniQuery Admin'}
                    showRefresh={variant === 'admin'}
                />
            </div>

            {/* Mobile Navigation Drawer */}
            <NavigationDrawer
                isOpen={isMobileDrawerOpen}
                onClose={() => setIsMobileDrawerOpen(false)}
                variant={variant}
                adminNavItems={variant === 'admin' ? ADMIN_NAV_ITEMS : undefined}
            />

            {/* Main Content */}
            <motion.div
                initial={false}
                animate={{
                    marginLeft: isExpanded ? '260px' : '64px'
                }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="hidden md:flex flex-1 min-w-0 flex-col overflow-hidden"
            >
                {/* Page Content */}
                <main className="w-full flex-1 overflow-hidden">
                    {children}
                </main>
            </motion.div>

            {/* Mobile Content - Full width without sidebar offset */}
            <div className="md:hidden flex flex-col flex-1 min-w-0 w-full pt-14 overflow-hidden">
                {/* Page Content */}
                <main className="w-full flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}
