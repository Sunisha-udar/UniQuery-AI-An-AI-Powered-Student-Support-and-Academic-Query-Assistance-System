import { supabase } from './supabase'

export interface FullUserProfile {
    id: string
    email: string | null
    role: 'admin' | 'student'
    display_name: string | null
    phone_number: string | null
    student_id: string | null
    bio: string | null
    program: string | null
    department: string | null
    semester: number | null
    suspended: boolean
    last_sign_in_at: string | null
    created_at: string
    updated_at: string
}

/**
 * Fetch full details for a specific user (admin only)
 */
export async function getUserDetails(userId: string): Promise<FullUserProfile> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching user details:', error)
        throw new Error(`Failed to fetch user details: ${error.message}`)
    }

    return data
}

/**
 * Fetch all users with full profile details (admin only)
 */
export async function getAllUsers(): Promise<FullUserProfile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all users:', error)
        throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data || []
}

/**
 * Suspend or activate a user account (admin only)
 */
export async function suspendUser(userId: string, suspend: boolean): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({
            suspended: suspend,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('Error updating user suspension status:', error)
        throw new Error(`Failed to ${suspend ? 'suspend' : 'activate'} user: ${error.message}`)
    }

    // If suspending, also sign out the user by invalidating their session
    if (suspend) {
        // Note: Supabase doesn't provide a way to sign out other users directly
        // The user will be prevented from making requests due to RLS policies
        console.log(`User ${userId} suspended. They will be blocked on next request.`)
    }
}

/**
 * Update a user's role (admin only)
 */
export async function updateUserRole(userId: string, role: 'admin' | 'student'): Promise<void> {
    // 1. Verify user exists and check current role
    const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (fetchError || !user) {
        console.error('User not found:', fetchError)
        throw new Error(`Failed to update user role: User not found`)
    }

    // 2. If demoting an admin, check if it's the last one
    if (user.role === 'admin' && role !== 'admin') {
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin')

        if (countError) {
            console.error('Error checking admin count:', countError)
            throw new Error(`Failed to update user role: Error checking admin count`)
        }

        if (count !== null && count <= 1) {
            console.error('Cannot demote the last administrator')
            throw new Error('Cannot demote the last administrator. There must be at least one admin.')
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            role,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('Error updating user role:', error)
        throw new Error(`Failed to update user role: ${error.message}`)
    }
}

/**
 * Get query count for a specific user
 */
export async function getUserQueryCount(userId: string): Promise<number> {
    const { count, error } = await supabase
        .from('user_queries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching user query count:', error)
        return 0
    }

    return count || 0
}
