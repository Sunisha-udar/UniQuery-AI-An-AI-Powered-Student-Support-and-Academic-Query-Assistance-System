/**
 * Generate a concise, ChatGPT-style title from a user query
 * @param userQuery - The first user message in a chat session
 * @returns A clean, truncated title suitable for display
 */
export function generateChatTitle(userQuery: string): string {
    if (!userQuery || userQuery.trim().length === 0) {
        return 'New Chat'
    }

    // Clean up the query
    let title = userQuery.trim()

    // If very short, use as-is (just capitalize)
    if (title.length <= 10) {
        return title.charAt(0).toUpperCase() + title.slice(1)
    }

    // Target length for title
    const maxLength = 45

    // If it's longer than max, truncate at word boundary
    if (title.length > maxLength) {
        // Find the last space before maxLength
        const truncated = title.substring(0, maxLength)
        const lastSpace = truncated.lastIndexOf(' ')

        if (lastSpace > 20) { // Only break at space if it's not too early
            title = truncated.substring(0, lastSpace) + '...'
        } else {
            title = truncated + '...'
        }
    }

    // Remove trailing punctuation (?, !, .) for cleaner titles
    title = title.replace(/[?!.]+$/, '')

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1)

    return title
}
