/**
 * Chat History Management
 * Handles storing and retrieving chat sessions from Firestore
 * Each session is a document containing an array of messages
 */

import { db } from './firebase'
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    Timestamp,
    limit,
    deleteDoc,
    doc,
    updateDoc,
    arrayUnion,
    getDoc
} from 'firebase/firestore'

export interface ChatMessage {
    id: string
    type: 'user' | 'assistant'
    text: string
    citations?: {
        title: string
        page: number
        category: string
        snippet: string
        score: number
    }[]
    confidence?: number
    timestamp: Date
}

export interface ChatSession {
    id: string
    userId: string
    messages: ChatMessage[]
    title: string
    createdAt: Timestamp | Date
    updatedAt: Timestamp | Date
}

/**
 * Create a new chat session
 */
export async function createChatSession(userId: string, firstMessage?: string): Promise<string> {
    console.log('[ChatHistory] Creating new chat session for user:', userId)
    try {
        if (!userId) {
            throw new Error('UserId is required to create chat session')
        }
        
        const sessionsRef = collection(db, 'chatSessions')
        const sessionData = {
            userId,
            messages: [],
            title: firstMessage ? firstMessage.substring(0, 50) : 'New Chat',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }
        
        const docRef = await addDoc(sessionsRef, sessionData)
        console.log('[ChatHistory] Session created with ID:', docRef.id)
        return docRef.id
    } catch (error: any) {
        console.error('[ChatHistory] Error creating chat session:', error)
        throw error
    }
}

/**
 * Add a message to an existing chat session
 */
export async function addMessageToSession(
    sessionId: string,
    type: 'user' | 'assistant',
    text: string,
    citations?: ChatMessage['citations'],
    confidence?: number
): Promise<void> {
    console.log('[ChatHistory] Adding message to session:', sessionId)
    try {
        if (!sessionId) {
            throw new Error('SessionId is required to add message')
        }
        
        const sessionRef = doc(db, 'chatSessions', sessionId)
        const message: ChatMessage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type,
            text,
            citations: citations || [],
            timestamp: new Date()
        }
        
        // Only add confidence if it's defined (Firebase arrayUnion doesn't accept undefined values)
        if (confidence !== undefined) {
            message.confidence = confidence
        }
        
        await updateDoc(sessionRef, {
            messages: arrayUnion(message),
            updatedAt: serverTimestamp()
        })
        
        console.log('[ChatHistory] Message added to session')
    } catch (error: any) {
        console.error('[ChatHistory] Error adding message:', error)
        throw error
    }
}

/**
 * Load all chat sessions for a user
 */
export async function loadChatSessions(userId: string): Promise<ChatSession[]> {
    console.log('[ChatHistory] Loading chat sessions for user:', userId)
    try {
        if (!userId) {
            throw new Error('UserId is required to load chat sessions')
        }
        
        const sessionsRef = collection(db, 'chatSessions')
        const q = query(
            sessionsRef,
            where('userId', '==', userId),
            orderBy('updatedAt', 'desc'),
            limit(50)
        )
        
        const querySnapshot = await getDocs(q)
        const sessions: ChatSession[] = []
        
        console.log('[ChatHistory] Found', querySnapshot.size, 'sessions')
        
        querySnapshot.forEach((doc) => {
            const data = doc.data()
            sessions.push({
                id: doc.id,
                userId: data.userId,
                messages: data.messages || [],
                title: data.title || 'Untitled Chat',
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
            })
        })
        
        console.log('[ChatHistory] Loaded', sessions.length, 'sessions')
        return sessions
    } catch (error: any) {
        console.error('[ChatHistory] Error loading chat sessions:', error)
        throw error
    }
}

/**
 * Load a specific chat session
 */
export async function loadChatSession(sessionId: string): Promise<ChatSession | null> {
    console.log('[ChatHistory] Loading chat session:', sessionId)
    try {
        const sessionRef = doc(db, 'chatSessions', sessionId)
        const sessionDoc = await getDoc(sessionRef)
        
        if (!sessionDoc.exists()) {
            console.log('[ChatHistory] Session not found')
            return null
        }
        
        const data = sessionDoc.data()
        return {
            id: sessionDoc.id,
            userId: data.userId,
            messages: data.messages || [],
            title: data.title || 'Untitled Chat',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        }
    } catch (error: any) {
        console.error('[ChatHistory] Error loading chat session:', error)
        throw error
    }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
    console.log('[ChatHistory] Deleting chat session:', sessionId)
    try {
        const sessionRef = doc(db, 'chatSessions', sessionId)
        await deleteDoc(sessionRef)
        console.log('[ChatHistory] Session deleted')
    } catch (error: any) {
        console.error('[ChatHistory] Error deleting chat session:', error)
        throw error
    }
}

/**
 * Clear all chat sessions for a user
 */
export async function clearAllChatSessions(userId: string): Promise<void> {
    console.log('[ChatHistory] Clearing all sessions for user:', userId)
    try {
        const sessionsRef = collection(db, 'chatSessions')
        const q = query(sessionsRef, where('userId', '==', userId))
        
        const querySnapshot = await getDocs(q)
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref))
        
        await Promise.all(deletePromises)
        console.log('[ChatHistory] All sessions cleared')
    } catch (error: any) {
        console.error('[ChatHistory] Error clearing sessions:', error)
        throw error
    }
}
