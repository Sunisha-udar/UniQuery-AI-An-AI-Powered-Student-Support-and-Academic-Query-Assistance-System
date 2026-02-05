import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Input } from '../ui/Input'
import { supabase } from '../../lib/supabase'

interface ManualAnswerModalProps {
    isOpen: boolean
    onClose: () => void
    question: string
    onSuccess?: () => void
}

export function ManualAnswerModal({ isOpen, onClose, question, onSuccess }: ManualAnswerModalProps) {
    const [answer, setAnswer] = useState('')
    const [category, setCategory] = useState('Manual Answer')
    const [program, setProgram] = useState('All')
    const [department, setDepartment] = useState('All')
    const [semester, setSemester] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [checkingExisting, setCheckingExisting] = useState(false)
    const [existingDocId, setExistingDocId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Check for existing answer when modal opens
    useEffect(() => {
        if (isOpen && question) {
            checkExistingAnswer()
        } else if (!isOpen) {
            // Reset state when closed
            setAnswer('')
            setExistingDocId(null)
            setCheckingExisting(false)
        }
    }, [isOpen, question])

    const checkExistingAnswer = async () => {
        setCheckingExisting(true)
        setError(null)
        try {
            // Get auth token from Supabase
            const { data: { session } } = await supabase.auth.getSession()
            const authHeader: HeadersInit = session ? { 'Authorization': `Bearer ${session.access_token}` } : {}

            const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/documents/manual-answer/check?question=${encodeURIComponent(question)}`, {
                headers: authHeader
            })

            if (response.ok) {
                const data = await response.json()
                if (data.exists) {
                    setAnswer(data.answer || '')
                    setExistingDocId(data.doc_id)
                    setCategory(data.category || 'Manual Answer')
                    setProgram(data.program || 'All')
                    setDepartment(data.department || 'All')
                    setSemester(data.semester || 0)
                }
            }
        } catch (err) {
            console.error('Error checking existing answer:', err)
            // Don't set error state here, just proceed as if it doesn't exist
        } finally {
            setCheckingExisting(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!answer.trim()) {
            setError('Please provide an answer')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            // Get auth token from Supabase
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                throw new Error('Not authenticated')
            }

            const apiUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000'
            const response = await fetch(`${apiUrl}/api/documents/manual-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    question,
                    answer: answer.trim(),
                    category,
                    program,
                    department,
                    semester,
                    doc_id: existingDocId
                })
            })

            if (!response.ok) {
                // Safely parse error response
                const contentType = response.headers.get('content-type')
                let errorMessage = `Request failed with status ${response.status}`

                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json()
                    errorMessage = errorData.detail || errorMessage
                } else {
                    const errorText = await response.text()
                    errorMessage = errorText || errorMessage
                }

                throw new Error(errorMessage)
            }

            // Reset form and close modal
            setAnswer('')
            setCategory('Manual Answer')
            setProgram('All')
            setDepartment('All')
            setSemester(0)
            onClose()

            if (onSuccess) {
                onSuccess()
            }
        } catch (err) {
            console.error('Error submitting manual answer:', err)
            setError(err instanceof Error ? err.message : 'Failed to submit answer')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-semibold text-text text-xl">
                                    {existingDocId ? 'Modify Manual Answer' : 'Provide Manual Answer'}
                                </h2>
                                {existingDocId && (
                                    <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-bold uppercase tracking-wider rounded border border-success/20">
                                        Answer Already Provided
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-text-muted mt-0.5">
                                {existingDocId
                                    ? 'Update the existing authoritative answer'
                                    : 'This will be stored for future queries'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-background text-text-muted hover:text-text transition-colors cursor-pointer"
                            disabled={isSubmitting}
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Question:</p>
                        <p className="text-sm text-text italic line-clamp-3">"{question}"</p>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {checkingExisting ? (
                            <div className="py-4 text-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-xs text-text-muted mt-2">Checking for existing answers...</p>
                            </div>
                        ) : error && (
                            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                                <span className="text-sm text-error">{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="answer" className="block text-sm font-medium text-text mb-2">
                                Answer *
                            </label>
                            <textarea
                                id="answer"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="w-full h-48 px-4 py-3 rounded-lg border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                placeholder="Enter the authoritative answer to this question..."
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="program" className="block text-sm font-medium text-text">
                                    Program
                                </label>
                                <select
                                    id="program"
                                    value={program}
                                    onChange={(e) => setProgram(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmitting}
                                >
                                    <option value="All">All Programs</option>
                                    <option value="BTech">BTech</option>
                                    <option value="MTech">MTech</option>
                                    <option value="MBA">MBA</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="department" className="block text-sm font-medium text-text">
                                    Department
                                </label>
                                <select
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmitting}
                                >
                                    <option value="All">All Departments</option>
                                    <option value="CSE">Computer Science</option>
                                    <option value="ECE">Electronics</option>
                                    <option value="ME">Mechanical</option>
                                    <option value="CE">Civil</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="semester" className="block text-sm font-medium text-text">
                                    Semester
                                </label>
                                <select
                                    id="semester"
                                    value={semester}
                                    onChange={(e) => setSemester(Number(e.target.value))}
                                    className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                                    disabled={isSubmitting}
                                >
                                    <option value={0}>All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onClose}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="cta"
                                className="flex-1"
                                disabled={isSubmitting || !answer.trim()}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {existingDocId ? 'Updating...' : 'Submitting...'}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {existingDocId ? 'Update Answer' : 'Submit Answer'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
