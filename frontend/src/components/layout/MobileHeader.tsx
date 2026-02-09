import { Menu } from 'lucide-react'
import { motion } from 'framer-motion'

interface MobileHeaderProps {
    onMenuToggle: () => void
    title?: string
    showRefresh?: boolean
    onRefresh?: () => void
}

export function MobileHeader({
    onMenuToggle,
    title = 'UniQuery AI',
    showRefresh = false,
    onRefresh
}: MobileHeaderProps) {
    return (
        <motion.header
            initial={false}
            className="h-14 bg-surface border-b border-border/50 flex items-center justify-between px-4 sticky top-0 z-20 backdrop-blur-sm"
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onClick={onMenuToggle}
                    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors flex-shrink-0 -ml-2"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-semibold text-text truncate">
                    {title}
                </h1>
            </div>

            {showRefresh && onRefresh && (
                <button
                    onClick={onRefresh}
                    className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-hover transition-colors flex-shrink-0 -mr-2"
                    aria-label="Refresh"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                </button>
            )}
        </motion.header>
    )
}
