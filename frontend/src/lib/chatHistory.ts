/**
 * Chat History Management
 * Handles storing and retrieving chat sessions from Supabase PostgreSQL
 * Each session is a row containing a JSONB array of messages
 */

import { supabase } from './supabase'

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
    timestamp: Date | string
}

export interface ChatSession {
    id: string
    userId: string
    messages: ChatMessage[]
    title: string
    createdAt: Date | string
    updatedAt: Date | string
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

        const sessionData = {
            user_id: userId,
            messages: [],
            title: firstMessage ? firstMessage.substring(0, 50) : 'New Chat',
        }

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert(sessionData)
            .select('id')
            .single()

        if (error) {
            console.error('[ChatHistory] Error creating session:', error)
            throw error
        }

        console.log('[ChatHistory] Session created with ID:', data.id)
        return data.id
    } catch (error) {
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
    confidence?: number,
    id?: string
): Promise<void> {
    console.log('[ChatHistory] Adding message to session:', sessionId)
    try {
        if (!sessionId) {
            throw new Error('SessionId is required to add message')
        }

        // First, get the current messages
        const { data: session, error: fetchError } = await supabase
            .from('chat_sessions')
            .select('messages')
            .eq('id', sessionId)
            .single()

        if (fetchError) {
            console.error('[ChatHistory] Error fetching session:', fetchError)
            throw fetchError
        }

        const message: ChatMessage = {
            id: id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type,
            text,
            citations: citations || [],
            timestamp: new Date().toISOString()
        }

        // Only add confidence if it's defined
        if (confidence !== undefined) {
            message.confidence = confidence
        }

        // Append new message to existing messages array
        const updatedMessages = [...(session.messages || []), message]

        // Update the session with new messages
        const { error: updateError } = await supabase
            .from('chat_sessions')
            .update({
                messages: updatedMessages,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)

        if (updateError) {
            console.error('[ChatHistory] Error updating session:', updateError)
            throw updateError
        }

        console.log('[ChatHistory] Message added to session')
    } catch (error) {
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

        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('[ChatHistory] Error loading sessions:', error)
            throw error
        }

        console.log('[ChatHistory] Found', data.length, 'sessions')

        // Map to ChatSession format
        const sessions: ChatSession[] = data.map((row: { id: string; user_id: string; messages: ChatMessage[]; title: string; created_at: string; updated_at: string }) => ({
            id: row.id,
            userId: row.user_id,
            messages: row.messages || [],
            title: row.title || 'Untitled Chat',
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }))

        return sessions
    } catch (error) {
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
        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                console.log('[ChatHistory] Session not found')
                return null
            }
            console.error('[ChatHistory] Error loading session:', error)
            throw error
        }

        return {
            id: data.id,
            userId: data.user_id,
            messages: data.messages || [],
            title: data.title || 'Untitled Chat',
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }
    } catch (error) {
        console.error('[ChatHistory] Error loading chat session:', error)
        throw error
    }
}

/**
 * Update the title of a chat session
 */
export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
    console.log('[ChatHistory] Updating session title:', sessionId, title)
    try {
        if (!sessionId) {
            throw new Error('SessionId is required to update title')
        }

        const { error } = await supabase
            .from('chat_sessions')
            .update({
                title,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId)

        if (error) {
            console.error('[ChatHistory] Error updating title:', error)
            throw error
        }

        console.log('[ChatHistory] Session title updated')
    } catch (error) {
        console.error('[ChatHistory] Error updating session title:', error)
        throw error
    }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
    console.log('[ChatHistory] Deleting chat session:', sessionId)
    try {
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId)

        if (error) {
            console.error('[ChatHistory] Error deleting session:', error)
            throw error
        }

        console.log('[ChatHistory] Session deleted')
    } catch (error) {
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
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('user_id', userId)

        if (error) {
            console.error('[ChatHistory] Error clearing sessions:', error)
            throw error
        }

        console.log('[ChatHistory] All sessions cleared')
    } catch (error) {
        console.error('[ChatHistory] Error clearing sessions:', error)
        throw error
    }
}
// ... existing code ...

/**
 * Save a user query for analytics
 */
export async function saveUserQuery(
    userId: string,
    sessionId: string,
    question: string,
    answer: string,
    confidence: number,
    citations?: any[]
): Promise<void> {
    console.log('[ChatHistory] Saving user query for analytics')
    try {
        const { error } = await supabase
            .from('user_queries')
            .insert({
                user_id: userId,
                session_id: sessionId,
                question,
                answer,
                confidence,
                citations
            })

        if (error) {
            console.error('[ChatHistory] Error saving user query:', error)
            // Don't throw, just log. Analytics shouldn't break the user flow.
        } else {
            console.log('[ChatHistory] User query saved for analytics')
        }
    } catch (error) {
        console.error('[ChatHistory] Error in saveUserQuery:', error)
    }
}

export interface UserQuery {
    id: string
    user_id: string
    session_id: string
    question: string
    answer: string
    confidence: number
    citations: any
    created_at: string
}

/**
 * Get all user queries for admin analytics
 */
export async function getAllUserQueries(limit: number = 200): Promise<UserQuery[]> {
    console.log('[ChatHistory] Loading user queries for admin')
    try {
        const { data, error } = await supabase
            .from('user_queries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[ChatHistory] Error loading user queries:', error)
            throw error
        }

        return data as UserQuery[] || []
    } catch (error) {
        console.error('[ChatHistory] Error in getAllUserQueries:', error)
        throw error
    }
}
