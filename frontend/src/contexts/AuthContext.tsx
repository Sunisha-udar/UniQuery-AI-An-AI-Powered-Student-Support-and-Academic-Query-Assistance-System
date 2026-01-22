import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
    type User as FirebaseUser,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

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
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, role: UserRole, profile?: Partial<User>) => Promise<void>
    updateUser: (data: Partial<User>) => Promise<void>
    logout: () => Promise<void>
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                    if (userDoc.exists()) {
                        const userData = userDoc.data()
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: userData.role || 'student',
                            displayName: userData.displayName,
                            phoneNumber: userData.phoneNumber,
                            studentId: userData.studentId,
                            bio: userData.bio,
                            program: userData.program,
                            department: userData.department,
                            semester: userData.semester,
                        })
                    } else {
                        // User exists in Auth but not in Firestore (edge case)
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'student',
                        })
                    }
                } catch {
                    // If Firestore fails, default to student role
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: 'student',
                    })
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password)
        // Force refresh user data after login
        const firebaseUser = auth.currentUser
        if (firebaseUser) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (userDoc.exists()) {
                const userData = userDoc.data()
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    role: userData.role || 'student',
                    displayName: userData.displayName,
                    phoneNumber: userData.phoneNumber,
                    studentId: userData.studentId,
                    bio: userData.bio,
                    program: userData.program,
                    department: userData.department,
                    semester: userData.semester,
                })
            }
        }
    }

    const signup = async (email: string, password: string, role: UserRole, profile?: Partial<User>) => {
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password)

            try {
                // Create user document in Firestore
                await setDoc(doc(db, 'users', credential.user.uid), {
                    uid: credential.user.uid,
                    email: credential.user.email,
                    role,
                    program: profile?.program || '',
                    department: profile?.department || '',
                    semester: profile?.semester ? Number(profile.semester) : 1,
                    createdAt: new Date().toISOString(),
                })
            } catch (firestoreError) {
                // ROLLBACK: If Firestore write fails, delete the Auth user
                // so the user is not left in a broken state (exists in Auth but no profile)
                console.error("Firestore Profile Creation Failed. Rolling back Auth user.", firestoreError);
                await credential.user.delete();
                throw new Error("Failed to create user profile. Please try again.");
            }
        } catch (error) {
            console.error("Signup Error:", error);
            throw error;
        }
    }

    const updateUser = async (data: Partial<User>) => {
        if (!user) return
        try {
            await setDoc(doc(db, 'users', user.uid), data, { merge: true })
            setUser(prev => prev ? { ...prev, ...data } : null)
        } catch (error) {
            console.error("Update Profile Error:", error)
            throw error
        }
    }

    const logout = async () => {
        await signOut(auth)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
