import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, LifeBuoy, RefreshCw, Search } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../contexts/AuthContext'
import { getAllSupportTickets, updateSupportTicket, type SupportTicket, type SupportTicketStatus } from '../../lib/supportTickets'
import { supabase } from '../../lib/supabase'

interface TicketDrafts {
    [ticketId: string]: {
        status: SupportTicketStatus
        adminNotes: string
    }
}

interface ProfileRecord {
    id: string
    email: string | null
    display_name: string | null
}

const STATUS_OPTIONS: SupportTicketStatus[] = ['open', 'in_review', 'resolved', 'rejected']

const STATUS_STYLES: Record<SupportTicketStatus, string> = {
    open: 'bg-red-500/10 text-red-600 dark:text-red-300',
    in_review: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    resolved: 'bg-green-500/10 text-green-600 dark:text-green-300',
    rejected: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
}

export function AdminSupport() {
    const { user } = useAuth()
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [profiles, setProfiles] = useState<Record<string, ProfileRecord>>({})
    const [drafts, setDrafts] = useState<TicketDrafts>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | SupportTicketStatus>('all')
    const [savingTicketId, setSavingTicketId] = useState<string | null>(null)

    useEffect(() => {
        loadTickets()
    }, [])

    const loadTickets = async () => {
        try {
            setLoading(true)
            setError(null)
            const ticketData = await getAllSupportTickets(250)
            setTickets(ticketData)
            setDrafts(
                Object.fromEntries(
                    ticketData.map(ticket => [
                        ticket.id,
                        {
                            status: ticket.status,
                            adminNotes: ticket.admin_notes || '',
                        }
                    ])
                )
            )

            const userIds = Array.from(new Set(ticketData.map(ticket => ticket.user_id)))
            if (userIds.length === 0) {
                setProfiles({})
                return
            }

            const { data, error: profileError } = await supabase
                .from('profiles')
                .select('id, email, display_name')
                .in('id', userIds)

            if (profileError) {
                throw profileError
            }

            const mappedProfiles = Object.fromEntries((data || []).map(profile => [profile.id, profile]))
            setProfiles(mappedProfiles)
        } catch (loadError) {
            console.error('Failed to load support tickets:', loadError)
            setError(loadError instanceof Error ? loadError.message : 'Failed to load support tickets')
        } finally {
            setLoading(false)
        }
    }

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const profile = profiles[ticket.user_id]
            const haystack = [
                ticket.subject,
                ticket.message,
                profile?.email || '',
                profile?.display_name || '',
                ticket.user_id,
            ].join(' ').toLowerCase()

            const matchesSearch = haystack.includes(search.toLowerCase())
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [profiles, search, statusFilter, tickets])

    const counts = useMemo(() => ({
        total: tickets.length,
        open: tickets.filter(ticket => ticket.status === 'open').length,
        inReview: tickets.filter(ticket => ticket.status === 'in_review').length,
        resolved: tickets.filter(ticket => ticket.status === 'resolved').length,
    }), [tickets])

    const handleDraftChange = (ticketId: string, updates: Partial<TicketDrafts[string]>) => {
        setDrafts(prev => ({
            ...prev,
            [ticketId]: {
                ...prev[ticketId],
                ...updates
            }
        }))
    }

    const handleSave = async (ticketId: string) => {
        const draft = drafts[ticketId]
        if (!draft || !user?.uid) return

        try {
            setSavingTicketId(ticketId)
            const isResolved = draft.status === 'resolved' || draft.status === 'rejected'
            const updatedTicket = await updateSupportTicket(ticketId, {
                status: draft.status,
                admin_notes: draft.adminNotes.trim() || null,
                resolved_by: isResolved ? user.uid : null,
                resolved_at: isResolved ? new Date().toISOString() : null,
            })

            setTickets(prev => prev.map(ticket => ticket.id === ticketId ? updatedTicket : ticket))
        } catch (saveError) {
            console.error('Failed to update support ticket:', saveError)
            setError(saveError instanceof Error ? saveError.message : 'Failed to update support ticket')
        } finally {
            setSavingTicketId(null)
        }
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-background p-4 md:p-6">
            <div className="w-full space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
                            <LifeBuoy className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">Support Requests</h1>
                            <p className="text-sm text-text-muted">Review student support tickets, reactivation appeals, and admin notes.</p>
                        </div>
                    </div>

                    <Button variant="secondary" onClick={loadTickets} className="w-full lg:w-auto">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard label="Total Requests" value={counts.total} accent="text-text" />
                    <StatCard label="Open" value={counts.open} accent="text-red-500" />
                    <StatCard label="In Review" value={counts.inReview} accent="text-amber-500" />
                    <StatCard label="Resolved" value={counts.resolved} accent="text-green-500" />
                </div>

                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-col gap-3 lg:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by subject, message, user, or email"
                                    className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-text placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value as 'all' | SupportTicketStatus)}
                                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All statuses</option>
                                {STATUS_OPTIONS.map(status => (
                                    <option key={status} value={status}>
                                        {status.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                        {error}
                    </div>
                )}

                <Card className="border border-border shadow-sm">
                    <CardContent className="p-4 md:p-5">
                        {loading ? (
                            <div className="py-16 text-center text-sm text-text-muted">Loading support tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="py-16 text-center">
                                <LifeBuoy className="mx-auto mb-4 h-12 w-12 text-text-muted/40" />
                                <h3 className="text-lg font-semibold text-text">No Support Requests Found</h3>
                                <p className="mt-2 text-sm text-text-muted">
                                    {tickets.length === 0
                                        ? 'Students have not submitted any support tickets yet.'
                                        : 'No tickets match the current search or filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredTickets.map(ticket => {
                                    const profile = profiles[ticket.user_id]
                                    const draft = drafts[ticket.id]

                                    return (
                                        <div key={ticket.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-semibold text-text">{ticket.subject}</h3>
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLES[ticket.status]}`}>
                                                            {ticket.status.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                                                        <span><strong className="text-text">Student:</strong> {profile?.display_name || 'Unnamed user'}</span>
                                                        <span><strong className="text-text">Email:</strong> {profile?.email || ticket.user_id}</span>
                                                        <span><strong className="text-text">Created:</strong> {new Date(ticket.created_at).toLocaleString()}</span>
                                                    </div>

                                                    <div className="rounded-xl border border-border bg-background/70 p-4 text-sm leading-relaxed text-text">
                                                        {ticket.message}
                                                    </div>
                                                </div>

                                                <div className="min-w-0 w-full max-w-xl space-y-3">
                                                    <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Status</label>
                                                            <select
                                                                value={draft?.status || ticket.status}
                                                                onChange={(event) => handleDraftChange(ticket.id, { status: event.target.value as SupportTicketStatus })}
                                                                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                                            >
                                                                {STATUS_OPTIONS.map(status => (
                                                                    <option key={status} value={status}>
                                                                        {status.replace('_', ' ')}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Admin Notes</label>
                                                            <textarea
                                                                value={draft?.adminNotes || ''}
                                                                onChange={(event) => handleDraftChange(ticket.id, { adminNotes: event.target.value })}
                                                                className="min-h-[110px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                                                                placeholder="Add internal notes, resolution details, or what the student must do next."
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div className="text-xs text-text-muted">
                                                            {ticket.resolved_at
                                                                ? `Resolved on ${new Date(ticket.resolved_at).toLocaleString()}`
                                                                : 'Ticket not resolved yet.'}
                                                        </div>
                                                        <Button
                                                            onClick={() => handleSave(ticket.id)}
                                                            loading={savingTicketId === ticket.id}
                                                            className="w-full sm:w-auto"
                                                        >
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            Save Update
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
    return (
        <Card>
            <CardContent className="p-4">
                <p className="text-sm text-text-muted">{label}</p>
                <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
            </CardContent>
        </Card>
    )
}
