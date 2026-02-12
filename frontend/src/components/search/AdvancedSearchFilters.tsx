import { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import {
    Search,
    Filter,
    X,
    Calendar,
    FileType,
    Tag,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

export interface SearchFilters {
    searchQuery: string
    category?: string
    program?: string
    department?: string
    semester?: number
    dateFrom?: string
    dateTo?: string
    fileType?: string
    keywords?: string[]
}

interface AdvancedSearchFiltersProps {
    filters: SearchFilters
    onFiltersChange: (filters: SearchFilters) => void
    onSearch: () => void
    onClear: () => void
    availableCategories?: string[]
    availablePrograms?: string[]
    availableDepartments?: string[]
    showAdvanced?: boolean
}

export function AdvancedSearchFilters({
    filters,
    onFiltersChange,
    onSearch,
    onClear,
    availableCategories = [],
    availablePrograms = [],
    availableDepartments = [],
    showAdvanced = true
}: AdvancedSearchFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [keywordInput, setKeywordInput] = useState('')

    const handleAddKeyword = () => {
        if (keywordInput.trim() && !filters.keywords?.includes(keywordInput.trim())) {
            onFiltersChange({
                ...filters,
                keywords: [...(filters.keywords || []), keywordInput.trim()]
            })
            setKeywordInput('')
        }
    }

    const handleRemoveKeyword = (keyword: string) => {
        onFiltersChange({
            ...filters,
            keywords: filters.keywords?.filter(k => k !== keyword)
        })
    }

    const hasActiveFilters = () => {
        return !!(
            filters.category ||
            filters.program ||
            filters.department ||
            filters.semester ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.fileType ||
            (filters.keywords && filters.keywords.length > 0)
        )
    }

    const handleClearAll = () => {
        onClear()
        setKeywordInput('')
    }

    return (
        <Card className="border border-border shadow-sm">
            <CardContent className="p-4 space-y-4">
                {/* Main Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search documents, questions, or content..."
                            value={filters.searchQuery}
                            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch()
                                }
                            }}
                            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <Button onClick={onSearch}>
                        <Search className="w-4 h-4 mr-2" />
                        Search
                    </Button>
                    {showAdvanced && (
                        <Button
                            variant="secondary"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 ml-2" />
                            ) : (
                                <ChevronDown className="w-4 h-4 ml-2" />
                            )}
                        </Button>
                    )}
                </div>

                {/* Active Filters Display */}
                {hasActiveFilters() && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-text-muted">Active filters:</span>
                        {filters.category && (
                            <FilterBadge
                                label={`Category: ${filters.category}`}
                                onRemove={() => onFiltersChange({ ...filters, category: undefined })}
                            />
                        )}
                        {filters.program && (
                            <FilterBadge
                                label={`Program: ${filters.program}`}
                                onRemove={() => onFiltersChange({ ...filters, program: undefined })}
                            />
                        )}
                        {filters.department && (
                            <FilterBadge
                                label={`Department: ${filters.department}`}
                                onRemove={() => onFiltersChange({ ...filters, department: undefined })}
                            />
                        )}
                        {filters.semester && (
                            <FilterBadge
                                label={`Semester: ${filters.semester}`}
                                onRemove={() => onFiltersChange({ ...filters, semester: undefined })}
                            />
                        )}
                        {filters.fileType && (
                            <FilterBadge
                                label={`Type: ${filters.fileType}`}
                                onRemove={() => onFiltersChange({ ...filters, fileType: undefined })}
                            />
                        )}
                        {filters.dateFrom && (
                            <FilterBadge
                                label={`From: ${new Date(filters.dateFrom).toLocaleDateString()}`}
                                onRemove={() => onFiltersChange({ ...filters, dateFrom: undefined })}
                            />
                        )}
                        {filters.dateTo && (
                            <FilterBadge
                                label={`To: ${new Date(filters.dateTo).toLocaleDateString()}`}
                                onRemove={() => onFiltersChange({ ...filters, dateTo: undefined })}
                            />
                        )}
                        {filters.keywords?.map(keyword => (
                            <FilterBadge
                                key={keyword}
                                label={keyword}
                                onRemove={() => handleRemoveKeyword(keyword)}
                            />
                        ))}
                        <button
                            onClick={handleClearAll}
                            className="text-xs text-primary hover:underline"
                        >
                            Clear all
                        </button>
                    </div>
                )}

                {/* Advanced Filters */}
                {isExpanded && (
                    <div className="space-y-4 pt-4 border-t border-border">
                        {/* Row 1: Category, Program, Department */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Category
                                </label>
                                <select
                                    value={filters.category || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, category: e.target.value || undefined })}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">All Categories</option>
                                    {availableCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Program
                                </label>
                                <select
                                    value={filters.program || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, program: e.target.value || undefined })}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">All Programs</option>
                                    {availablePrograms.map(prog => (
                                        <option key={prog} value={prog}>{prog}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Department
                                </label>
                                <select
                                    value={filters.department || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, department: e.target.value || undefined })}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">All Departments</option>
                                    {availableDepartments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Semester, File Type, Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    Semester
                                </label>
                                <select
                                    value={filters.semester || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, semester: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    <FileType className="w-4 h-4 inline mr-1" />
                                    File Type
                                </label>
                                <select
                                    value={filters.fileType || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, fileType: e.target.value || undefined })}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">All Types</option>
                                    <option value="pdf">PDF</option>
                                    <option value="doc">Word Document</option>
                                    <option value="xls">Excel</option>
                                    <option value="ppt">PowerPoint</option>
                                    <option value="txt">Text</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Date From
                                </label>
                                <Input
                                    type="date"
                                    value={filters.dateFrom || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
                                />
                            </div>
                        </div>

                        {/* Row 3: Date To, Keywords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Date To
                                </label>
                                <Input
                                    type="date"
                                    value={filters.dateTo || ''}
                                    onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text mb-2">
                                    <Tag className="w-4 h-4 inline mr-1" />
                                    Keywords
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddKeyword()
                                            }
                                        }}
                                        placeholder="Add keyword and press Enter"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={handleAddKeyword}
                                        disabled={!keywordInput.trim()}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Filter Badge Component
function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
            {label}
            <button
                onClick={onRemove}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
            >
                <X className="w-3 h-3" />
            </button>
        </span>
    )
}
