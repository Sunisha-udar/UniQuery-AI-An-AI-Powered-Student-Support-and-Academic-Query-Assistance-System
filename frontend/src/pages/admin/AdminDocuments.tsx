import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { LogoutModal } from '../../components/ui/LogoutModal'
import {
    GraduationCap,
    LogOut,
    LayoutDashboard,
    FileText,
    MessageSquare,
    BarChart3,
    Settings,
    Users,
    Upload,
    Search,
    Eye,
    Trash2,
    Download,
    X,
    CheckCircle
} from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: FileText, label: 'Documents', href: '/admin/documents' },
    { icon: MessageSquare, label: 'Queries', href: '/admin/queries' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'exam_rules', label: 'Exam Rules' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'academic_calendar', label: 'Academic Calendar' },
    { value: 'backlog_rules', label: 'Backlog Rules' },
    { value: 'fees', label: 'Fees' },
]

const MOCK_DOCUMENTS = [
    { id: '1', title: 'CSE Syllabus 2024', category: 'syllabus', program: 'B.Tech', department: 'CSE', version: 2, uploadedAt: '2024-01-15', chunks: 162 },
    { id: '2', title: 'Attendance Policy', category: 'attendance', program: 'All', department: 'All', version: 1, uploadedAt: '2024-01-10', chunks: 24 },
    { id: '3', title: 'Exam Rules 2024', category: 'exam_rules', program: 'All', department: 'All', version: 3, uploadedAt: '2024-01-08', chunks: 48 },
    { id: '4', title: 'Academic Calendar 2024', category: 'academic_calendar', program: 'All', department: 'All', version: 1, uploadedAt: '2024-01-05', chunks: 12 },
    { id: '5', title: 'ECE Syllabus 2024', category: 'syllabus', program: 'B.Tech', department: 'ECE', version: 1, uploadedAt: '2024-01-12', chunks: 145 },
    { id: '6', title: 'Backlog Promotion Rules', category: 'backlog_rules', program: 'All', department: 'All', version: 2, uploadedAt: '2024-01-03', chunks: 18 },
]

export function AdminDocuments() {
    const { user } = useAuth()
    const location = useLocation()
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

    const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    const handleUpload = () => {
        // Simulate upload
        setTimeout(() => {
            setUploadSuccess(true)
            setTimeout(() => {
                setShowUploadModal(false)
                setUploadSuccess(false)
            }, 1500)
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 bg-surface border-r border-border flex flex-col fixed h-full">
                <div className="p-5 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-semibold text-text">UniQuery</span>
                            <Badge variant="primary" className="ml-2 text-xs">Admin</Badge>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
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

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{user?.email}</p>
                            <p className="text-xs text-text-muted">Administrator</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => setIsLogoutModalOpen(true)}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            <LogoutModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 ml-64 p-6">
                <div className="max-w-[1600px] mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-text">Documents</h1>
                                <p className="text-sm text-text-muted mt-1">Manage uploaded academic documents</p>
                            </div>
                        </div>
                        <Button variant="cta" onClick={() => setShowUploadModal(true)}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card className="mb-6">
                        <CardContent className="py-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex-1 min-w-[200px]">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Search documents..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <Select
                                    options={CATEGORIES}
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-48"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Document</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Category</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Program</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Dept</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Version</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Chunks</th>
                                            <th className="text-left text-sm font-medium text-text-muted px-5 py-4">Uploaded</th>
                                            <th className="text-right text-sm font-medium text-text-muted px-5 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDocs.map((doc) => (
                                            <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-background transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <span className="font-medium text-text">{doc.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge variant="default">{doc.category.replace('_', ' ')}</Badge>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.program}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.department}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">v{doc.version}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.chunks}</td>
                                                <td className="px-5 py-4 text-sm text-text-muted">{doc.uploadedAt}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button className="p-2 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-colors cursor-pointer">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-text">Upload Document</h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-1 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {uploadSuccess ? (
                                <div className="py-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-success" />
                                    </div>
                                    <p className="text-text font-medium">Document uploaded successfully!</p>
                                </div>
                            ) : (
                                <form className="space-y-4">
                                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                                        <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
                                        <p className="text-sm text-text-muted mb-1">Drag & drop PDF here, or click to browse</p>
                                        <p className="text-xs text-text-muted">Max file size: 10MB</p>
                                        <input type="file" className="hidden" accept=".pdf" />
                                    </div>

                                    <Input label="Document Title" placeholder="e.g., CSE Syllabus 2024" />

                                    <Select
                                        label="Category"
                                        options={CATEGORIES.filter(c => c.value !== 'all')}
                                        placeholder="Select category"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Select
                                            label="Program"
                                            options={[
                                                { value: 'all', label: 'All Programs' },
                                                { value: 'btech', label: 'B.Tech' },
                                                { value: 'mtech', label: 'M.Tech' },
                                                { value: 'mba', label: 'MBA' },
                                            ]}
                                            placeholder="Select"
                                        />
                                        <Select
                                            label="Department"
                                            options={[
                                                { value: 'all', label: 'All Depts' },
                                                { value: 'cse', label: 'CSE' },
                                                { value: 'ece', label: 'ECE' },
                                                { value: 'mech', label: 'MECH' },
                                            ]}
                                            placeholder="Select"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button type="button" variant="secondary" onClick={() => setShowUploadModal(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="button" variant="cta" className="flex-1" onClick={handleUpload}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Upload
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
