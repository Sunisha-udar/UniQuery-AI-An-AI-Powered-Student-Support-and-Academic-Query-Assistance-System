import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../ui/Modal'
import { Input } from '../ui/Input'
import { supabase } from '../../lib/supabase'
import { api } from '../../lib/api'

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
            const { data: { session } } = await supabase.auth.getSession()


            const token = session?.access_token

            const data = await api.checkManualAnswer(question, token)

            if (data.exists) {
                setAnswer(data.answer || '')
                setExistingDocId(data.doc_id || null)
                setCategory(data.category || 'Manual Answer')
                setProgram(data.program || 'All')
                setDepartment(data.department || 'All')
                setSemester(data.semester || 0)
            }
        } catch (err) {
            console.error('Error checking existing answer:', err)
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
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                throw new Error('Not authenticated')
            }

            await api.submitManualAnswer({
                question,
                answer: answer.trim(),
                category,
                program,
                department,
                semester
            }, existingDocId, session.access_token)

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

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <ModalHeader onClose={onClose}>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-text text-xl">
                            {existingDocId ? 'Modify Manual Answer' : 'Provide Manual Answer'}
                        </h2>
                        {existingDocId && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider rounded border border-green-500/20">
                                Answer Provided
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-text-muted mt-1">
                        {existingDocId
                            ? 'Update the existing authoritative answer'
                            : 'This will be stored for future queries'}
                    </p>
                </div>
            </ModalHeader>

            <ModalBody>
                <form id="manual-answer-form" onSubmit={handleSubmit} className="space-y-6">
                    {checkingExisting ? (
                        <div className="py-8 text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-sm text-text-muted mt-3">Checking for existing answers...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</span>
                                </div>
                            )}

                            {/* Question Context */}
                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 px-1">Question Context</p>
                                <p className="text-sm text-text italic leading-relaxed">"{question}"</p>
                            </div>

                            {/* Answer Input */}
                            <div className="space-y-2">
                                <label htmlFor="answer" className="block text-sm font-semibold text-text ml-1">
                                    Authoritative Answer <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="answer"
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="w-full min-h-[160px] sm:min-h-[220px] px-4 py-3 rounded-xl border border-border bg-surface text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-sm"
                                    placeholder="Enter the authoritative answer that will be shown to students..."
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                                <div className="space-y-2">
                                    <label htmlFor="program" className="block text-sm font-semibold text-text ml-1">
                                        Program
                                    </label>
                                    <select
                                        id="program"
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                                        disabled={isSubmitting}
                                    >
                                        <option value="All">All Programs</option>
                                        <option value="BTech">BTech</option>
                                        <option value="MTech">MTech</option>
                                        <option value="MBA">MBA</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="department" className="block text-sm font-semibold text-text ml-1">
                                        Department
                                    </label>
                                    <select
                                        id="department"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
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
                                    <label htmlFor="semester" className="block text-sm font-semibold text-text ml-1">
                                        Semester
                                    </label>
                                    <select
                                        id="semester"
                                        value={semester}
                                        onChange={(e) => setSemester(Number(e.target.value))}
                                        className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
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
                                    className="h-11 rounded-xl"
                                />
                            </div>
                        </>
                    )}
                </form>
            </ModalBody>

            <ModalFooter>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 w-full">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto h-11"
                    >
                        Cancel
                    </Button>
                    <Button
                        form="manual-answer-form"
                        type="submit"
                        variant="cta"
                        disabled={isSubmitting || !answer.trim()}
                        className="w-full sm:w-auto h-11 min-w-[140px]"
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
            </ModalFooter>
        </Modal>
    )
}
