import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import {
    Users,
    Search,
    MessageSquare,
    Clock,
    User,
    Shield,
    Ban,
    CheckCircle
} from 'lucide-react'
import { clsx } from 'clsx'
import { UserDetailsModal } from '../../components/admin/UserDetailsModal'
import { UserActionMenu } from '../../components/admin/UserActionMenu'
import { SuspendUserModal } from '../../components/admin/SuspendUserModal'
import { DeleteUserModal } from '../../components/admin/DeleteUserModal'
import {
    getUserDetails,
    suspendUser as suspendUserAPI,
    updateUserRole as updateUserRoleAPI,
    deleteUser as deleteUserAPI,
    type FullUserProfile
} from '../../lib/adminUserManagement'

interface UserData {
    id: string
    email: string
    created_at: string
    last_sign_in_at: string | null
    queryCount: number
    role: 'admin' | 'student'
    suspended: boolean
    display_name: string | null
    phone_number: string | null
    student_id: string | null
    bio: string | null
    program: string | null
    department: string | null
    semester: number | null
    updated_at: string
}

export function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedUser, setSelectedUser] = useState<FullUserProfile | null>(null)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const toastTimeoutRef = useRef<any>(null)
    const [suspendModalOpen, setSuspendModalOpen] = useState(false)
    const [userToSuspend, setUserToSuspend] = useState<{ id: string; email: string; suspend: boolean } | null>(null)
    const [userToDelete, setUserToDelete] = useState<FullUserProfile | null>(null)
    const ITEMS_PER_PAGE = 10

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            setError(null)

            // Fetch profiles with role info and all user data
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (profileError) {
                throw profileError
            }

            // Fetch query counts per user
            const { data: queryCounts, error: queryError } = await supabase
                .from('user_queries')
                .select('user_id')

            if (queryError) {
                console.warn('Could not fetch query counts:', queryError)
            }

            // Count queries per user
            const queryCountMap: Record<string, number> = {}
            if (queryCounts) {
                queryCounts.forEach((q: { user_id: string }) => {
                    queryCountMap[q.user_id] = (queryCountMap[q.user_id] || 0) + 1
                })
            }

            // Map to UserData
            const userData: UserData[] = (profiles || []).map((profile: FullUserProfile) => ({
                id: profile.id,
                email: profile.email || 'No email',
                created_at: profile.created_at,
                last_sign_in_at: profile.last_sign_in_at || profile.updated_at,
                queryCount: queryCountMap[profile.id] || 0,
                role: profile.role || 'student',
                suspended: profile.suspended || false,
                display_name: profile.display_name,
                phone_number: profile.phone_number,
                student_id: profile.student_id,
                bio: profile.bio,
                program: profile.program,
                department: profile.department,
                semester: profile.semester,
                updated_at: profile.updated_at
            }))

            setUsers(userData)
        } catch (err) {
            console.error('Failed to load users:', err)
            setError('Failed to load users. Check console for details.')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery])

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never'
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return 'Never'
        const date = new Date(dateStr)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / 86400000)
        const hours = Math.floor(diff / 3600000)

        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        if (days < 30) return `${Math.floor(days / 7)}w ago`
        return formatDate(dateStr)
    }

    // Toast notification helper
    const showToast = (message: string, type: 'success' | 'error') => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current)
        }
        setToast({ message, type })
        toastTimeoutRef.current = setTimeout(() => setToast(null), 3000)
    }

    // Handler to view user details
    const handleViewDetails = async (user: UserData) => {
        try {
            setActionLoading(true)
            // Reset selected user to avoid showing stale data in modal
            setSelectedUser(null)
            const fullProfile = await getUserDetails(user.id)
            setSelectedUser(fullProfile)
            setIsDetailsModalOpen(true)
        } catch (err) {
            console.error('Error fetching user details:', err)
            showToast('Failed to load user details', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    // Handler to open suspend confirmation modal
    const handleSuspendUser = async (userId: string, suspend: boolean) => {
        const user = users.find(u => u.id === userId)
        if (user) {
            setUserToSuspend({ id: userId, email: user.email, suspend })
            setSuspendModalOpen(true)
        }
    }

    // Handler to confirm suspension/activation
    const confirmSuspendUser = async () => {
        if (!userToSuspend) return

        try {
            setActionLoading(true)
            await suspendUserAPI(userToSuspend.id, userToSuspend.suspend)

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userToSuspend.id ? { ...u, suspended: userToSuspend.suspend } : u
            ))

            // Update selected user if viewing details
            if (selectedUser?.id === userToSuspend.id) {
                setSelectedUser(prev => prev ? { ...prev, suspended: userToSuspend.suspend } : null)
            }

            showToast(
                `User ${userToSuspend.suspend ? 'suspended' : 'activated'} successfully`,
                'success'
            )

            setSuspendModalOpen(false)
            setUserToSuspend(null)
        } catch (err) {
            console.error('Error updating user suspension:', err)
            showToast(`Failed to ${userToSuspend.suspend ? 'suspend' : 'activate'} user`, 'error')
        } finally {
            setActionLoading(false)
        }
    }

    // Handler to change user role
    const handleChangeRole = async (userId: string, newRole: 'admin' | 'student') => {
        try {
            setActionLoading(true)
            await updateUserRoleAPI(userId, newRole)

            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, role: newRole } : u
            ))

            // Update selected user if viewing details
            if (selectedUser?.id === userId) {
                setSelectedUser(prev => prev ? { ...prev, role: newRole } : null)
            }

            showToast(`User role changed to ${newRole} successfully`, 'success')
        } catch (err) {
            console.error('Error updating user role:', err)
            showToast('Failed to change user role', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    // Handler to open delete confirmation modal
    const handleDeleteUser = async (userId: string) => {
        try {
            setActionLoading(true)
            const fullProfile = await getUserDetails(userId)
            setUserToDelete(fullProfile)
        } catch (err) {
            console.error('Error fetching user details for deletion:', err)
            showToast('Failed to load user details', 'error')
        } finally {
            setActionLoading(false)
        }
    }

    // Handler to confirm user deletion
    const confirmDeleteUser = async () => {
        if (!userToDelete) return

        try {
            await deleteUserAPI(userToDelete.id)

            // Remove user from local state
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id))

            // Close details modal if viewing the deleted user
            if (selectedUser?.id === userToDelete.id) {
                setIsDetailsModalOpen(false)
                setSelectedUser(null)
            }

            showToast('User deleted successfully', 'success')

            setUserToDelete(null)
        } catch (err) {
            console.error('Error deleting user:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
            throw new Error(errorMessage) // Re-throw to be caught by modal
        }
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full max-w-full space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">User Management</h1>
                            <p className="text-sm text-text-muted mt-1">View and manage enrolled users</p>
                        </div>
                    </div>
                    <button
                        onClick={loadUsers}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Total Users</p>
                                    <p className="text-2xl font-bold text-text mt-1">{users.length}</p>
                                </div>
                                <Users className="w-8 h-8 text-primary opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Admins</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {users.filter(u => u.role === 'admin').length}
                                    </p>
                                </div>
                                <Shield className="w-8 h-8 text-amber-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-text-muted">Active Today</p>
                                    <p className="text-2xl font-bold text-text mt-1">
                                        {users.filter(u => {
                                            if (!u.last_sign_in_at) return false
                                            const today = new Date().toISOString().split('T')[0]
                                            const signInDate = new Date(u.last_sign_in_at).toISOString().split('T')[0]
                                            return signInDate === today
                                        }).length}
                                    </p>
                                </div>
                                <Clock className="w-8 h-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search by email or user ID..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        aria-label="Search by email or user ID"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table/Cards */}
                <Card className="border border-border shadow-sm">
                    <CardContent className="!p-0">
                        {loading ? (
                            <div className="py-16 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p className="text-sm text-text-muted">Loading users...</p>
                            </div>
                        ) : error ? (
                            <div className="py-16 text-center">
                                <Users className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-text mb-2">Error Loading Users</h3>
                                <p className="text-sm text-text-muted max-w-md mx-auto">{error}</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="py-16 text-center">
                                <Users className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-text mb-2">No Users Yet</h3>
                                <p className="text-sm text-text-muted max-w-md mx-auto">
                                    Users will appear here once they sign up.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View - Hidden on Mobile */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/30 border-b border-border">
                                            <tr>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Queries
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Last Active
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th className="text-left px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="text-right px-2 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {paginatedUsers.map((user) => (
                                                <tr key={user.id}>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <User className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-text">{user.email}</p>
                                                                <p className="text-xs text-text-muted">{user.id.substring(0, 8)}...</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span className={clsx(
                                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                            user.role === 'admin'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        )}>
                                                            {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                            {user.role === 'admin' ? 'Admin' : 'Student'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-1.5 text-sm text-text">
                                                            <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                                                            {user.queryCount}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span className="text-sm text-text-muted">
                                                            {formatRelativeTime(user.last_sign_in_at)}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span className="text-sm text-text-muted">
                                                            {formatDate(user.created_at)}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span className={clsx(
                                                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                            user.suspended
                                                                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                                : 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                        )}>
                                                            {user.suspended ? (
                                                                <>
                                                                    <Ban className="w-3 h-3" />
                                                                    Suspended
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Active
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3 text-right">
                                                        <UserActionMenu
                                                            user={user as any}
                                                            onViewDetails={() => handleViewDetails(user)}
                                                            onSuspend={(suspend) => handleSuspendUser(user.id, suspend)}
                                                            onChangeRole={(role) => handleChangeRole(user.id, role)}
                                                            onDeleteUser={() => handleDeleteUser(user.id)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View - Shown on Mobile Only */}
                                <div className="md:hidden space-y-3 p-4">
                                    {paginatedUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="bg-surface border border-border rounded-lg p-4"
                                        >
                                            {/* User Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-text truncate">{user.email}</p>
                                                        <p className="text-xs text-text-muted">{user.id.substring(0, 12)}...</p>
                                                    </div>
                                                </div>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <UserActionMenu
                                                        user={user as any}
                                                        onViewDetails={() => handleViewDetails(user)}
                                                        onSuspend={(suspend) => handleSuspendUser(user.id, suspend)}
                                                        onChangeRole={(role) => handleChangeRole(user.id, role)}
                                                        onDeleteUser={() => handleDeleteUser(user.id)}
                                                    />
                                                </div>
                                            </div>

                                            {/* User Details Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Role */}
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Role</p>
                                                    <span className={clsx(
                                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                        user.role === 'admin'
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                    )}>
                                                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                        {user.role === 'admin' ? 'Admin' : 'Student'}
                                                    </span>
                                                </div>

                                                {/* Status */}
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Status</p>
                                                    <span className={clsx(
                                                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                                        user.suspended
                                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                            : 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    )}>
                                                        {user.suspended ? (
                                                            <>
                                                                <Ban className="w-3 h-3" />
                                                                Suspended
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-3 h-3" />
                                                                Active
                                                            </>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Queries */}
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Queries</p>
                                                    <div className="flex items-center gap-1.5 text-sm text-text">
                                                        <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                                                        <span className="font-medium">{user.queryCount}</span>
                                                    </div>
                                                </div>

                                                {/* Last Active */}
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Last Active</p>
                                                    <p className="text-sm text-text font-medium">
                                                        {formatRelativeTime(user.last_sign_in_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Joined Date */}
                                            <div className="mt-3 pt-3 border-t border-border">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-text-muted">Joined</span>
                                                    <span className="text-text font-medium">{formatDate(user.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )
                        }
                    </CardContent >
                    {
                        filteredUsers.length > ITEMS_PER_PAGE && (
                            <div className="px-5 py-4 border-t border-border flex items-center justify-between">
                                <p className="text-sm text-text-muted">
                                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="hidden md:flex items-center gap-1">
                                        {(() => {
                                            // Calculate dynamic window around currentPage
                                            let start = Math.max(1, currentPage - 2)
                                            let end = Math.min(totalPages, start + 4)
                                            start = Math.max(1, end - 4)

                                            return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={clsx(
                                                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                                                        currentPage === page
                                                            ? 'bg-primary text-white'
                                                            : 'text-text-muted hover:bg-background hover:text-text'
                                                    )}
                                                >
                                                    {page}
                                                </button>
                                            ))
                                        })()}
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )
                    }
                </Card >
            </div >

            {/* User Details Modal */}
            <UserDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                user={selectedUser}
                onSuspend={(suspend) => selectedUser && handleSuspendUser(selectedUser.id, suspend)}
                onChangeRole={(role) => selectedUser && handleChangeRole(selectedUser.id, role)}
                isLoading={actionLoading}
            />

            {/* Suspend User Confirmation Modal */}
            <SuspendUserModal
                isOpen={suspendModalOpen}
                onClose={() => {
                    setSuspendModalOpen(false)
                    setUserToSuspend(null)
                }}
                onConfirm={confirmSuspendUser}
                userEmail={userToSuspend?.email || ''}
                isSuspending={userToSuspend?.suspend || false}
                loading={actionLoading}
            />

            {/* Delete User Confirmation Modal */}
            {userToDelete && (
                <DeleteUserModal
                    user={userToDelete}
                    onClose={() => {
                        setUserToDelete(null)
                    }}
                    onConfirm={confirmDeleteUser}
                />
            )}

            {/* Toast Notification */}
            {
                toast && (
                    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-300">
                        <div className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md",
                            toast.type === 'success'
                                ? "bg-emerald-500/90 border-emerald-500/20 text-white"
                                : "bg-red-500/90 border-red-500/20 text-white"
                        )}>
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
