export interface HighlightPart { text: string; match: boolean }

/** Return literal text segments. No user content is interpreted as markup. */
export function highlightText(text: string, words: readonly string[]): HighlightPart[] {
    const unique = [...new Set(words.filter(Boolean))].sort((a, b) => b.length - a.length)
    if (!unique.length) return [{ text, match: false }]
    const escaped = unique.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(escaped.join('|'), 'gi')
    const parts: HighlightPart[] = []
    let offset = 0
    for (const result of text.matchAll(regex)) {
        const index = result.index
        if (index > offset) parts.push({ text: text.slice(offset, index), match: false })
        parts.push({ text: result[0], match: true })
        offset = index + result[0].length
    }
    if (offset < text.length) parts.push({ text: text.slice(offset), match: false })
    return parts
}
