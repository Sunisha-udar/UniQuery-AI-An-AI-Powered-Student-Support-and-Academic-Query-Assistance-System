import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
    LayoutDashboard,
    FileText,
    HelpCircle,
    BarChart3,
    Settings,
    LogOut,
    GraduationCap
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
    { icon: FileText, label: 'Manage Documents', href: '/admin/documents' },
    { icon: HelpCircle, label: 'User Queries', href: '/admin/queries' },
    { icon: BarChart3, label: 'Statistics', href: '/admin/statistics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

const STUDENT_NAV: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
    { icon: FileText, label: 'Manage Documents', href: '/student/documents' },
    { icon: HelpCircle, label: 'FAQs', href: '/student/faqs' },
    { icon: Settings, label: 'Settings', href: '/student/settings' },
]

export function Sidebar({ variant }: SidebarProps) {
    const { logout } = useAuth()
    const location = useLocation()
    const navItems = variant === 'admin' ? ADMIN_NAV : STUDENT_NAV

    return (
        <aside className="w-[200px] bg-sidebar h-screen flex flex-col fixed left-0 top-0">
            {/* Logo */}
            <div className="p-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-2">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className={clsx(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150',
                                        isActive
                                            ? 'bg-sidebar-active text-white'
                                            : 'text-white/80 hover:bg-sidebar-hover hover:text-white'
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

            {/* Logout */}
            <div className="p-3">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors duration-150 text-sm font-medium cursor-pointer"
                >
                    <LogOut className="w-4 h-4" />
                    Logout
                </button>
            </div>
        </aside>
    )
}
