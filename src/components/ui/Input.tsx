import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-text"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={clsx(
                        'h-10 px-3 rounded-lg border bg-surface text-text',
                        'placeholder:text-text-muted',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                        'transition-colors duration-200',
                        error ? 'border-error' : 'border-border',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-error">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
