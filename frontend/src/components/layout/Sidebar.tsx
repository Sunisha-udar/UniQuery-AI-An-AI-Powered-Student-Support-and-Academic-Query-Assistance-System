import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Badge } from '../ui/Badge'
import { LogoutModal } from '../ui/LogoutModal'
import {
    LayoutDashboard,
    FileText,
    HelpCircle,
    BarChart3,
    Settings,
    LogOut,
    GraduationCap,
    User,
    MessageSquare,
    Moon,
    Sun
} from 'lucide-react'
import { clsx } from 'clsx'

interface NavItem {
    icon: React.ElementType
    label: string
    href: string
}

interface SidebarProps {
    variant: 'admin' | 'student'
}

const ADMIN_NAV: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
    { icon: MessageSquare, label: 'Queries', href: '/admin/queries' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

const STUDENT_NAV: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
    // { icon: FileText, label: 'Manage Documents', href: '/student/documents' }, // Removed: Admin only
    { icon: HelpCircle, label: 'FAQs', href: '/student/faqs' },
    { icon: Settings, label: 'Settings', href: '/student/settings' },
]

export function Sidebar({ variant }: SidebarProps) {
    const { user } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const location = useLocation()
    const navItems = variant === 'admin' ? ADMIN_NAV : STUDENT_NAV
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

    return (
        <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-30">
            {/* Logo */}
            <div className="p-5 border-b border-border flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <span className="font-semibold text-text">UniQuery</span>
                    <Badge variant="primary" className="ml-2 text-xs">{variant === 'admin' ? 'Admin' : 'Student'}</Badge>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className={clsx(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'text-text-muted hover:text-text hover:bg-background'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-border flex-shrink-0">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                            {user?.displayName || user?.email || 'User'}
                        </p>
                        <p className="text-xs text-text-muted capitalize">{variant}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-background transition-colors"
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text hover:bg-background transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />
        </aside>
    )
}
