/** Recognize deliberate HTTP(S) links without treating ordinary note titles as URLs. */
export function parseWebUrl(input: string): string | null {
    const value = input.trim()
    if (!value || /\s/.test(value)) return null
    const explicit = /^https?:\/\//i.test(value)
    if (!explicit && /\.(md|canvas|pdf|png|jpe?g|gif|svg|webp|mp4|mp3|wav|m4a|webm)$/i.test(value)) return null
    if (!explicit && !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:[/?#].*)?$/i.test(value)) return null
    try {
        const url = new URL(explicit ? value : `https://${value}`)
        return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password ? url.href : null
    } catch {
        return null
    }
}
