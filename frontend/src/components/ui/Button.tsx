import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'cta'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2'

        const variants = {
            primary: 'bg-primary text-white hover:bg-primary-hover focus-visible:outline-primary',
            secondary: 'bg-surface text-text border border-border hover:bg-background focus-visible:outline-primary',
            ghost: 'text-text-muted hover:text-text hover:bg-background focus-visible:outline-primary',
            cta: 'bg-cta text-white hover:bg-cta-hover focus-visible:outline-cta',
        }

        const sizes = {
            sm: 'h-8 px-3 text-sm rounded-md',
            md: 'h-10 px-4 text-sm rounded-lg',
            lg: 'h-12 px-6 text-base rounded-lg',
        }

        return (
            <button
                ref={ref}
                className={clsx(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'
