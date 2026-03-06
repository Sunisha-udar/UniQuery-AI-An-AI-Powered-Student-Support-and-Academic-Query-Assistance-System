import { supabase } from './supabase'

export type SupportTicketStatus = 'open' | 'in_review' | 'resolved' | 'rejected'

export interface SupportTicket {
    id: string
    user_id: string
    subject: string
    message: string
    status: SupportTicketStatus
    admin_notes: string | null
    resolved_by: string | null
    resolved_at: string | null
    created_at: string
    updated_at: string
}

async function requireAdminRole(): Promise<void> {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
        throw new Error('Authentication required')
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

    if (profileError || profile?.role !== 'admin') {
        throw new Error('Admin access required')
    }
}

export async function createSupportTicket(userId: string, subject: string, message: string): Promise<SupportTicket> {
    const { data, error } = await supabase
        .from('support_tickets')
        .insert({
            user_id: userId,
            subject,
            message,
            status: 'open',
            updated_at: new Date().toISOString()
        })
        .select('*')
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Failed to create support ticket')
    }

    return data as SupportTicket
}

export async function getMySupportTickets(userId: string, limit: number = 5): Promise<SupportTicket[]> {
    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw new Error(error.message)
    }

    return (data || []) as SupportTicket[]
}

export async function getAllSupportTickets(limit: number = 200): Promise<SupportTicket[]> {
    await requireAdminRole()

    const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        throw new Error(error.message)
    }

    return (data || []) as SupportTicket[]
}

export async function updateSupportTicket(
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'admin_notes' | 'resolved_by' | 'resolved_at'>>
): Promise<SupportTicket> {
    await requireAdminRole()

    const { data, error } = await supabase
        .from('support_tickets')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select('*')
        .single()

    if (error || !data) {
        throw new Error(error?.message || 'Failed to update support ticket')
    }

    return data as SupportTicket
}
