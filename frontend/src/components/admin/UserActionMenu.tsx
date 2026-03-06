import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Eye, Ban, CheckCircle, Shield, MessageSquare, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { FullUserProfile } from '../../lib/adminUserManagement'

interface UserActionMenuProps {
    user: FullUserProfile
    onViewDetails: () => void
    onSuspend: (suspend: boolean) => void
    onChangeRole: (role: 'admin' | 'student') => void
    onViewQueries?: () => void
    onDeleteUser: () => void
}

export function UserActionMenu({
    user,
    onViewDetails,
    onSuspend,
    onChangeRole,
    onViewQueries,
    onDeleteUser
}: UserActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right
            })
        }
    }, [isOpen])

    const handleAction = (action: () => void) => {
        action()
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                aria-label="More actions"
            >
                <MoreVertical className="w-4 h-4 text-text-muted" />
            </button>

            {isOpen && (
                <div className="fixed w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-200" style={{
                    top: `${menuPosition.top}px`,
                    right: `${menuPosition.right}px`
                }}>
                    {/* View Details */}
                    <button
                        onClick={() => handleAction(onViewDetails)}
                        className="w-full px-4 py-2 text-left text-sm text-text hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4 text-text-muted" />
                        View Details
                    </button>

                    {/* View Queries */}
                    {onViewQueries && (
                        <button
                            onClick={() => handleAction(onViewQueries)}
                            className="w-full px-4 py-2 text-left text-sm text-text hover:bg-muted/50 transition-colors flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4 text-text-muted" />
                            View Queries
                        </button>
                    )}

                    <div className="h-px bg-border my-1" />

                    {/* Suspend/Activate */}
                    <button
                        onClick={() => handleAction(() => onSuspend(!user.suspended))}
                        className={clsx(
                            "w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2",
                            user.suspended
                                ? "text-green-600 hover:bg-green-500/10"
                                : "text-red-600 hover:bg-red-500/10"
                        )}
                    >
                        {user.suspended ? (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Activate Account
                            </>
                        ) : (
                            <>
                                <Ban className="w-4 h-4" />
                                Suspend Account
                            </>
                        )}
                    </button>

                    {/* Change Role */}
                    <button
                        onClick={() => handleAction(() => onChangeRole(user.role === 'admin' ? 'student' : 'admin'))}
                        className="w-full px-4 py-2 text-left text-sm text-text hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                        <Shield className="w-4 h-4 text-text-muted" />
                        Change to {user.role === 'admin' ? 'Student' : 'Admin'}
                    </button>

                    <div className="h-px bg-border my-1" />

                    {/* Delete User */}
                    <button
                        onClick={() => handleAction(onDeleteUser)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete User
                    </button>
                </div>
            )}
        </div>
    )
}
