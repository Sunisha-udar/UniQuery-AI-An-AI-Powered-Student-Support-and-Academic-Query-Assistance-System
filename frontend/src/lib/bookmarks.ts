/**
 * Bookmark/Favorite Queries Management
 * Stores user's bookmarked queries and answers
 */

import { supabase } from './supabase'

export interface Bookmark {
    id: string
    user_id: string
    session_id: string
    message_id: string
    question: string
    answer: string
    citations?: any[]
    created_at: string
    notes?: string
    tags?: string[]
}

/**
 * Add a query to bookmarks
 */
export async function addBookmark(
    userId: string,
    sessionId: string,
    messageId: string,
    question: string,
    answer: string,
    citations?: any[],
    notes?: string,
    tags?: string[]
): Promise<Bookmark> {
    const bookmark: Omit<Bookmark, 'id' | 'created_at'> = {
        user_id: userId,
        session_id: sessionId,
        message_id: messageId,
        question,
        answer,
        citations,
        notes,
        tags
    }

    const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmark)
        .select()
        .single()

    if (error) {
        console.error('Failed to add bookmark:', error)
        throw new Error('Failed to add bookmark')
    }

    return data
}

/**
 * Remove a bookmark
 */
export async function removeBookmark(bookmarkId: string): Promise<void> {
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)

    if (error) {
        console.error('Failed to remove bookmark:', error)
        throw new Error('Failed to remove bookmark')
    }
}

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(userId: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to load bookmarks:', error)
        throw new Error('Failed to load bookmarks')
    }

    return data || []
}

/**
 * Check if a message is bookmarked
 */
export async function isBookmarked(userId: string, messageId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Failed to check bookmark:', error)
        return false
    }

    return !!data
}

/**
 * Get bookmark by message ID
 */
export async function getBookmarkByMessageId(userId: string, messageId: string): Promise<Bookmark | null> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error('Failed to get bookmark:', error)
        return null
    }

    return data
}

/**
 * Update bookmark notes
 */
export async function updateBookmarkNotes(bookmarkId: string, notes: string): Promise<void> {
    const { error } = await supabase
        .from('bookmarks')
        .update({ notes })
        .eq('id', bookmarkId)

    if (error) {
        console.error('Failed to update bookmark notes:', error)
        throw new Error('Failed to update bookmark notes')
    }
}

/**
 * Update bookmark tags
 */
export async function updateBookmarkTags(bookmarkId: string, tags: string[]): Promise<void> {
    const { error } = await supabase
        .from('bookmarks')
        .update({ tags })
        .eq('id', bookmarkId)

    if (error) {
        console.error('Failed to update bookmark tags:', error)
        throw new Error('Failed to update bookmark tags')
    }
}

/**
 * Search bookmarks
 */
export async function searchBookmarks(userId: string, query: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%,notes.ilike.%${query}%`)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to search bookmarks:', error)
        throw new Error('Failed to search bookmarks')
    }

    return data || []
}

/**
 * Get bookmarks by tag
 */
export async function getBookmarksByTag(userId: string, tag: string): Promise<Bookmark[]> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .contains('tags', [tag])
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Failed to get bookmarks by tag:', error)
        throw new Error('Failed to get bookmarks by tag')
    }

    return data || []
}
