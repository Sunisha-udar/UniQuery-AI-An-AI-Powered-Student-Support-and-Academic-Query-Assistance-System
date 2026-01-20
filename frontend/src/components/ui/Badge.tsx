import { clsx } from 'clsx'

interface BadgeProps {
    children: React.ReactNode
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
    className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    const variants = {
        default: 'bg-background text-text-muted',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
    }

    return (
        <span
            className={clsx(
                'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full',
                variants[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
