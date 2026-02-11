import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser, AuthChangeEvent, Session } from '@supabase/supabase-js'

export type UserRole = 'student' | 'admin'

interface User {
    uid: string
    email: string | null
    role: UserRole
    displayName?: string
    phoneNumber?: string
    studentId?: string
    bio?: string
    program?: string
    department?: string
    semester?: number
    suspended?: boolean
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, role: UserRole, profile?: Partial<User>) => Promise<void>
    updateUser: (data: Partial<User>) => Promise<void>
    logout: () => Promise<void>
    deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const userRef = useRef<User | null>(null)

    // Keep ref in sync with state to avoid stale closures in event listeners
    useEffect(() => {
        userRef.current = user
    }, [user])

    // Fetch user profile from Supabase profiles table
    const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User> => {
        const defaultUser = {
            uid: supabaseUser.id,
            email: supabaseUser.email ?? null,
            role: 'student' as UserRole,
        }

        try {
            console.log('[Auth] Fetching user profile for:', supabaseUser.id)

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            )

            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', supabaseUser.id)
                .single()

            const { data: profile, error } = await Promise.race([fetchPromise, timeoutPromise])

            if (error) {
                // Check specifically for "No rows found" error (Supabase/PostgREST code PGRST116)
                if (error.code === 'PGRST116') {
                    console.log('[Auth] No profile found, defaulting to student role')
                    return defaultUser
                }

                // For any other error (network, timeout, etc.), throw it to prevent partial state
                console.error('[Auth] Error fetching profile:', error)
                throw error
            }

            console.log('[Auth] Profile data:', profile)

            // Return user profile with suspended flag - let UI handle showing modal
            return {
                uid: supabaseUser.id,
                email: supabaseUser.email ?? null,
                role: profile.role || 'student',
                displayName: profile.display_name,
                phoneNumber: profile.phone_number,
                studentId: profile.student_id,
                bio: profile.bio,
                program: profile.program,
                department: profile.department,
                semester: profile.semester,
                suspended: profile.suspended || false,
            }
        } catch (error) {
            console.error('[Auth] Error in fetchUserProfile:', error)
            // Re-throw to be handled by caller
            throw error
        }
    }

    useEffect(() => {
        let mounted = true

        const initializeAuth = async () => {
            try {
                console.log('[Auth] Initializing authentication...')

                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('[Auth] Error getting session:', error)
                    if (mounted) {
                        setLoading(false)
                    }
                    return
                }

                if (session?.user && mounted) {
                    console.log('[Auth] Found existing session')
                    const userProfile = await fetchUserProfile(session.user)
                    if (mounted) {
                        // Always set user - UI will handle showing suspended modal
                        setUser(userProfile)
                    }
                } else {
                    console.log('[Auth] No existing session')
                }
            } catch (error) {
                console.error('[Auth] Error initializing auth:', error)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        initializeAuth()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                console.log('[Auth] Auth state changed:', event)

                if (!mounted) return

                try {
                    if (event === 'SIGNED_IN' && session?.user) {
                        const userProfile = await fetchUserProfile(session.user)
                        if (mounted) {
                            // Always set user - UI will handle showing suspended modal
                            setUser(userProfile)
                            setLoading(false)
                        }
                    } else if (event === 'SIGNED_OUT') {
                        if (mounted) {
                            setUser(null)
                            setLoading(false)
                        }
                    } else if (event === 'INITIAL_SESSION') {
                        if (session?.user && mounted) {
                            const userProfile = await fetchUserProfile(session.user)
                            if (mounted) {
                                // Always set user - UI will handle showing suspended modal
                                setUser(userProfile)
                                setLoading(false)
                            }
                        } else if (mounted) {
                            setLoading(false)
                        }
                    }
                } catch (error) {
                    console.error('[Auth] Error handling auth state change:', error);

                    // CRITICAL FIX: If fetch failed (e.g. timeout), but we have a valid session matching current user,
                    // DO NOT logout or downgrade. Keep existing state.
                    if (session?.user && userRef.current && userRef.current.uid === session.user.id) {
                        console.warn('[Auth] Keeping existing user state despite fetch error');
                        if (mounted) setLoading(false);
                        return;
                    }

                    // If we can't verify the user, fallback to safe state (or you could choose to keep loading)
                    // For now, if it's a new login that failed, we might want to let them stay on the "loading" screen or retry.
                    // But to avoid getting stuck, we might have to settle for current state or null.

                    if (mounted) setLoading(false);
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const login = async (email: string, password: string) => {
        console.log('[Auth] Starting login...')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            console.error('[Auth] Login error:', error)
            throw error
        }

        console.log('[Auth] Login successful')
    }

    const signup = async (email: string, password: string, role: UserRole, profile?: Partial<User>) => {
        console.log('[Auth] Starting signup...')

        try {
            // Create user in Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                console.error('[Auth] Signup error:', error)
                throw error
            }

            if (!data.user) {
                throw new Error('User creation failed')
            }

            // Create/update profile in profiles table
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: data.user.email,
                    role,
                    program: profile?.program || '',
                    department: profile?.department || '',
                    semester: profile?.semester ? Number(profile.semester) : 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })

            if (profileError) {
                console.error('[Auth] Profile creation error:', profileError)
                // Note: We can't easily rollback Auth user in Supabase like Firebase
                // The profile will be created on next login via trigger
                throw new Error('Failed to create user profile. Please try again.')
            }

            console.log('[Auth] Signup successful')
        } catch (error) {
            console.error('[Auth] Signup Error:', error)
            throw error
        }
    }

    const updateUser = async (data: Partial<User>) => {
        if (!user) return

        try {
            // Map camelCase to snake_case for Supabase
            const updateData: Record<string, unknown> = {
                updated_at: new Date().toISOString()
            }

            if (data.displayName !== undefined) updateData.display_name = data.displayName
            if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber
            if (data.studentId !== undefined) updateData.student_id = data.studentId
            if (data.bio !== undefined) updateData.bio = data.bio
            if (data.program !== undefined) updateData.program = data.program
            if (data.department !== undefined) updateData.department = data.department
            if (data.semester !== undefined) updateData.semester = data.semester
            if (data.role !== undefined) updateData.role = data.role

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.uid)

            if (error) {
                console.error('[Auth] Update profile error:', error)
                throw error
            }

            // Update local state
            setUser(prev => prev ? { ...prev, ...data } : null)
        } catch (error) {
            console.error('[Auth] Update Profile Error:', error)
            throw error
        }
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut({ scope: 'local' })
        if (error) {
            console.error('[Auth] Logout error:', error)
            throw error
        }
        setUser(null)
        // Clear all storage
        localStorage.clear()
        sessionStorage.clear()
    }

    const deleteAccount = async () => {
        if (!user) {
            throw new Error('No user logged in')
        }

        try {
            console.log('[Auth] Deleting account for user:', user.uid)

            // Delete user using Supabase Admin API
            // This will cascade delete all related data via database constraints
            const { error } = await supabase.auth.admin.deleteUser(user.uid)

            if (error) {
                console.error('[Auth] Error deleting user from auth:', error)
                
                // Fallback: Try deleting from profiles table directly
                const { error: dbError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.uid)

                if (dbError) {
                    console.error('[Auth] Error deleting user from database:', dbError)
                    throw new Error('Failed to delete account. Please try again.')
                }
            }

            console.log('[Auth] Account deleted successfully')

            // Sign out and clear state
            setUser(null)
            localStorage.clear()
            sessionStorage.clear()

            // Sign out to ensure clean state
            await supabase.auth.signOut({ scope: 'local' })
        } catch (error) {
            console.error('[Auth] Delete account error:', error)
            throw error
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, updateUser, logout, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    )
}
