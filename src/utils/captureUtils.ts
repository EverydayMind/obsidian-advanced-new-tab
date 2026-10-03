/** Insert one bullet at the end of the selected section, preserving other sections. */
export function appendCapture(content: string, input: string, heading = ''): string {
    const text = input.trim().replace(/[\r\n]+/g, ' ')
    if (!text) return content
    const title = heading.trim().replace(/^#{1,6}\s+/, '')
    if (/[\r\n]/.test(title)) throw new Error('Capture heading must be a single line')
    const newline = content.includes('\r\n') ? '\r\n' : '\n'
    const line = `- ${text}`
    if (!title) return `${content}${content && !content.endsWith('\n') ? newline : ''}${line}${newline}`
    const lines = content.split(/\r?\n/)
    let frontmatter = lines[0] === '---'
    let fence = ''
    let fenceLength = 0
    let level = 0
    let insertion = lines.length
    for (let i = 0; i < lines.length; i++) {
        if (frontmatter) { if (i > 0 && /^(---|\.\.\.)\s*$/.test(lines[i])) frontmatter = false; continue }
        const marker = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/)
        if (marker) {
            if (!fence) { fence = marker[1][0]; fenceLength = marker[1].length }
            else if (marker[1][0] === fence && marker[1].length >= fenceLength) fence = ''
            continue
        }
        if (fence) continue
        const match = lines[i].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
        if (!match) continue
        if (level && match[1].length <= level) { insertion = i; break }
        if (!level && match[2] === title) level = match[1].length
    }
    if (!level) return `${content}${content && !content.endsWith('\n') ? newline : ''}${content ? newline : ''}## ${title}${newline}${line}${newline}`
    // Keep the blank separator before the next heading after the new bullet.
    while (insertion > 0 && lines[insertion - 1] === '') insertion--
    lines.splice(insertion, 0, line)
    const result = lines.join(newline)
    return result.endsWith('\n') ? result : result + newline
}
