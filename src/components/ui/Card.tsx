import { type ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
    children: ReactNode
    className?: string
    hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
    return (
        <div
            className={clsx(
                'bg-surface rounded-xl border border-border',
                hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-md',
                className
            )}
        >
            {children}
        </div>
    )
}

interface CardHeaderProps {
    children: ReactNode
    className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={clsx('px-5 py-4 border-b border-border', className)}>
            {children}
        </div>
    )
}

interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className }: CardContentProps) {
    return (
        <div className={clsx('px-5 py-4', className)}>
            {children}
        </div>
    )
}

interface CardFooterProps {
    children: ReactNode
    className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={clsx('px-5 py-4 border-t border-border', className)}>
            {children}
        </div>
    )
}
