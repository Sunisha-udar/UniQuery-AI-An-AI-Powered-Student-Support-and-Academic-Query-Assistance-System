import { useEffect, useState } from 'react'
import { AlertCircle, LifeBuoy, Send, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { createSupportTicket, getMySupportTickets, type SupportTicket } from '../../lib/supportTickets'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../ui/Modal'

interface SupportRequestModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    defaultSubject?: string
}

const STATUS_STYLES: Record<SupportTicket['status'], string> = {
    open: 'bg-red-500/10 text-red-600 dark:text-red-300',
    in_review: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    resolved: 'bg-green-500/10 text-green-600 dark:text-green-300',
    rejected: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
}

export function SupportRequestModal({
    isOpen,
    onClose,
    title = 'Contact Support',
    description = 'Describe the issue clearly so the admin team can review and respond faster.',
    defaultSubject = ''
}: SupportRequestModalProps) {
    const { user } = useAuth()
    const [subject, setSubject] = useState(defaultSubject)
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([])
    const [ticketsLoading, setTicketsLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        setSubject(defaultSubject)
        setMessage('')
        setError(null)
        setSuccess(null)

        if (!user?.uid) return

        setTicketsLoading(true)
        getMySupportTickets(user.uid, 4)
            .then(setRecentTickets)
            .catch((ticketError) => {
                console.error('Failed to load support tickets:', ticketError)
            })
            .finally(() => setTicketsLoading(false))
    }, [defaultSubject, isOpen, user?.uid])

    const handleSubmit = async () => {
        if (!user?.uid) {
            setError('You must be logged in to contact support.')
            return
        }

        if (!subject.trim() || !message.trim()) {
            setError('Subject and message are required.')
            return
        }

        try {
            setLoading(true)
            setError(null)
            const ticket = await createSupportTicket(user.uid, subject.trim(), message.trim())
            setRecentTickets(prev => [ticket, ...prev].slice(0, 4))
            setSuccess('Support request submitted. An administrator can now review it.')
            setSubject(defaultSubject)
            setMessage('')
        } catch (submitError) {
            console.error('Support ticket submission failed:', submitError)
            setError(submitError instanceof Error ? submitError.message : 'Failed to submit support request.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="mx-0 h-screen max-h-screen max-w-none rounded-none border-0 md:mx-4 md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl md:border"
        >
            <ModalHeader onClose={onClose} className="bg-linear-to-r from-red-500/8 via-transparent to-transparent">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/12">
                        <LifeBuoy className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-text">{title}</h2>
                        <p className="text-sm text-text-muted">{description}</p>
                    </div>
                </div>
            </ModalHeader>

            <ModalBody className="space-y-5">
                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
                        <div className="flex items-start gap-2">
                            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                        {success}
                    </div>
                )}

                <div className="grid gap-4">
                    <Input
                        label="Subject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="Account reactivation request"
                        maxLength={120}
                    />

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-text">Message</label>
                        <textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Explain what happened, why you believe the suspension or issue should be reviewed, and any details the admin should know."
                            className="min-h-[170px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-text-muted">
                            Be specific. Admins will see exactly what you write here.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-text-muted" />
                        <h3 className="text-sm font-semibold text-text">Recent Requests</h3>
                    </div>

                    {ticketsLoading ? (
                        <p className="text-sm text-text-muted">Loading your recent requests...</p>
                    ) : recentTickets.length === 0 ? (
                        <p className="text-sm text-text-muted">No support requests submitted yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTickets.map(ticket => (
                                <div key={ticket.id} className="rounded-xl border border-border bg-surface px-3 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-text">{ticket.subject}</p>
                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{ticket.message}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[ticket.status]}`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-[11px] text-text-muted">
                                        Submitted {new Date(ticket.created_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ModalBody>

            <ModalFooter className="flex-col-reverse sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
                    Close
                </Button>
                <Button onClick={handleSubmit} loading={loading} className="w-full sm:w-auto bg-red-600 hover:bg-red-700 focus-visible:outline-red-600">
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                </Button>
            </ModalFooter>
        </Modal>
    )
}
