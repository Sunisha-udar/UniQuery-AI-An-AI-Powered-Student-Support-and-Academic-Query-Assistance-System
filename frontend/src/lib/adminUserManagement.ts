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
    if (suspend) {
        // Manual suspension by admin - use RPC to increment suspension count
        const { error } = await supabase.rpc('manual_suspend_user', {
            p_user_id: userId,
            p_reason: 'Admin manually suspended account'
        })

        if (error) {
            console.error('Error suspending user:', error)
            throw new Error(`Failed to suspend user: ${error.message}`)
        }

        console.log(`User ${userId} suspended with suspension count incremented`)
    } else {
        // Reactivation - use RPC function to reset warnings but preserve suspension count
        const { error } = await supabase.rpc('reactivate_user_account', {
            p_user_id: userId,
            p_reason: 'Admin manually reactivated account'
        })

        if (error) {
            console.error('Error reactivating user:', error)
            throw new Error(`Failed to activate user: ${error.message}`)
        }

        console.log(`User ${userId} reactivated with warnings reset to 0`)
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

/**
 * Delete a user account and all associated data (admin only)
 * This will cascade delete all related data: queries, chat history, etc.
 */
export async function deleteUser(userId: string): Promise<void> {
    // 1. Verify user exists and get their info
    const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', userId)
        .single()

    if (fetchError || !user) {
        console.error('User not found:', fetchError)
        throw new Error(`Failed to delete user: User not found`)
    }

    // 2. If deleting an admin, check if it's the last one
    if (user.role === 'admin') {
        const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin')

        if (countError) {
            console.error('Error checking admin count:', countError)
            throw new Error(`Failed to delete user: Error checking admin count`)
        }

        if (count !== null && count <= 1) {
            console.error('Cannot delete the last administrator')
            throw new Error('Cannot delete the last administrator. There must be at least one admin.')
        }
    }

    // 3. Delete the user using Supabase Admin API
    // This will trigger cascade deletion of all related data via database constraints
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
        console.error('Error deleting user from auth:', deleteError)
        
        // Fallback: Try deleting from profiles table directly
        // The cascade constraints should handle related data
        const { error: dbDeleteError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (dbDeleteError) {
            console.error('Error deleting user from database:', dbDeleteError)
            throw new Error(`Failed to delete user: ${dbDeleteError.message}`)
        }
        
        console.log(`User ${userId} (${user.email}) deleted from database`)
    } else {
        console.log(`User ${userId} (${user.email}) deleted successfully`)
    }
}
