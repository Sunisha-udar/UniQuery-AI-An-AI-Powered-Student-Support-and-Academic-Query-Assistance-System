import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-auth-token',
        storage: {
            getItem: (key) => {
                sessionStorage.removeItem(key)
                return localStorage.getItem(key)
            },
            setItem: (key, value) => {
                sessionStorage.removeItem(key)
                localStorage.setItem(key, value)
            },
            removeItem: (key) => {
                sessionStorage.removeItem(key)
                localStorage.removeItem(key)
            }
        }
    }
})

export default supabase
