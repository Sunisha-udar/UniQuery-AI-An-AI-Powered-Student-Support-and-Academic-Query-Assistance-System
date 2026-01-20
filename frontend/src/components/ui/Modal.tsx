import { type ReactNode, useEffect } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={clsx(
                    'relative bg-surface rounded-xl border border-border shadow-2xl',
                    'w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto',
                    'animate-in fade-in zoom-in-95 duration-200',
                    className
                )}
                role="dialog"
                aria-modal="true"
            >
                {children}
            </div>
        </div>
    )
}

interface ModalHeaderProps {
    children: ReactNode
    onClose?: () => void
    className?: string
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
    return (
        <div className={clsx('flex items-center justify-between px-6 py-4 border-b border-border', className)}>
            <div className="flex-1">{children}</div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="ml-4 text-text-muted hover:text-text transition-colors rounded-md p-1 hover:bg-background"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    )
}

interface ModalBodyProps {
    children: ReactNode
    className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
    return (
        <div className={clsx('px-6 py-5', className)}>
            {children}
        </div>
    )
}

interface ModalFooterProps {
    children: ReactNode
    className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div className={clsx('flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-header', className)}>
            {children}
        </div>
    )
}
