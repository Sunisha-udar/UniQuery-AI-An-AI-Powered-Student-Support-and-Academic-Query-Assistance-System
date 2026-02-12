
import { Card } from '../../components/ui/Card'
import { HelpCircle, ChevronDown, ChevronUp, Search, TrendingUp, Pin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api, type FAQItem } from '../../lib/api'
import { clsx } from 'clsx'

export function FAQPage() {
    const [faqs, setFaqs] = useState<FAQItem[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadFAQs()
        loadCategories()
    }, [])

    const loadFAQs = async () => {
        try {
            setLoading(true)
            const data = await api.getFAQs({ limit: 100 })
            setFaqs(data)
            setError(null)
        } catch (err) {
            console.error('Failed to load FAQs:', err)
            setError('Failed to load FAQs. Please try again later.')
        } finally {
            setLoading(false)
        }
    }

    const loadCategories = async () => {
        try {
            const cats = await api.getFAQCategories()
            setCategories(cats)
        } catch (err) {
            console.error('Failed to load categories:', err)
        }
    }

    const toggleFAQ = async (faqId: string) => {
        const newExpanded = new Set(expandedFAQs)
        
        if (newExpanded.has(faqId)) {
            newExpanded.delete(faqId)
        } else {
            newExpanded.add(faqId)
            // Increment view count when expanding
            try {
                await api.incrementFAQView(faqId)
            } catch (err) {
                console.error('Failed to increment view count:', err)
            }
        }
        
        setExpandedFAQs(newExpanded)
    }

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = 
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesCategory = 
            selectedCategory === 'all' || 
            faq.category.toLowerCase() === selectedCategory.toLowerCase()
        
        return matchesSearch && matchesCategory
    })

    // Separate pinned and regular FAQs
    const pinnedFAQs = filteredFAQs.filter(faq => faq.is_pinned)
    const regularFAQs = filteredFAQs.filter(faq => !faq.is_pinned)

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text">Frequently Asked Questions</h1>
                        <p className="text-sm text-text-muted">Find quick answers to common questions</p>
                    </div>
                </div>

                {/* Search and Filter */}
                <Card className="border border-border shadow-sm">
                    <div className="p-4 space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search FAQs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                    selectedCategory === 'all'
                                        ? 'bg-primary text-white'
                                        : 'bg-surface text-text-muted hover:bg-muted hover:text-text'
                                )}
                            >
                                All
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={clsx(
                                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                                        selectedCategory === category
                                            ? 'bg-primary text-white'
                                            : 'bg-surface text-text-muted hover:bg-muted hover:text-text'
                                    )}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Loading State */}
                {loading && (
                    <Card className="border border-border shadow-sm">
                        <div className="py-16 text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-sm text-text-muted">Loading FAQs...</p>
                        </div>
                    </Card>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card className="border border-border shadow-sm">
                        <div className="py-16 text-center px-4">
                            <HelpCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-text mb-2">Error Loading FAQs</h3>
                            <p className="text-sm text-text-muted max-w-md mx-auto">{error}</p>
                            <button
                                onClick={loadFAQs}
                                className="mt-4 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </Card>
                )}

                {/* Empty State */}
                {!loading && !error && filteredFAQs.length === 0 && (
                    <Card className="border border-border shadow-sm">
                        <div className="py-16 text-center px-4">
                            <HelpCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-text mb-2">
                                {searchQuery || selectedCategory !== 'all' ? 'No FAQs Found' : 'No FAQs Available'}
                            </h3>
                            <p className="text-sm text-text-muted max-w-md mx-auto">
                                {searchQuery || selectedCategory !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'FAQs will appear here once they are added by administrators.'}
                            </p>
                        </div>
                    </Card>
                )}

                {/* Pinned FAQs */}
                {!loading && !error && pinnedFAQs.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
                            <Pin className="w-4 h-4" />
                            <span>Pinned Questions</span>
                        </div>
                        {pinnedFAQs.map(faq => (
                            <Card key={faq.id} className="border border-border shadow-sm overflow-hidden">
                                <button
                                    onClick={() => toggleFAQ(faq.id)}
                                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-base font-semibold text-text">
                                                    {faq.question}
                                                </h3>
                                                <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                    {faq.category}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span>{faq.view_count} views</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {expandedFAQs.has(faq.id) ? (
                                                <ChevronUp className="w-5 h-5 text-text-muted" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-text-muted" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                                {expandedFAQs.has(faq.id) && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="pl-0 border-l-2 border-primary/20">
                                            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Regular FAQs */}
                {!loading && !error && regularFAQs.length > 0 && (
                    <div className="space-y-3">
                        {pinnedFAQs.length > 0 && (
                            <div className="text-sm font-medium text-text-muted pt-4">
                                All Questions
                            </div>
                        )}
                        {regularFAQs.map(faq => (
                            <Card key={faq.id} className="border border-border shadow-sm overflow-hidden">
                                <button
                                    onClick={() => toggleFAQ(faq.id)}
                                    className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="text-base font-semibold text-text mb-1">
                                                {faq.question}
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                                <span className="px-2 py-0.5 rounded bg-muted text-text-muted">
                                                    {faq.category}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-3 h-3" />
                                                    <span>{faq.view_count} views</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {expandedFAQs.has(faq.id) ? (
                                                <ChevronUp className="w-5 h-5 text-text-muted" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-text-muted" />
                                            )}
                                        </div>
                                    </div>
                                </button>
                                {expandedFAQs.has(faq.id) && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="pl-4 border-l-2 border-border">
                                            <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Help Text */}
                {!loading && !error && filteredFAQs.length > 0 && (
                    <Card className="border border-border shadow-sm bg-primary/5">
                        <div className="p-4 text-center">
                            <p className="text-sm text-text-muted">
                                Can't find what you're looking for?{' '}
                                <a href="/student" className="text-primary hover:underline font-medium">
                                    Ask our AI assistant
                                </a>
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
