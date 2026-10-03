import type { Moment } from 'moment'

export const DEFAULT_NOTE_NAME_FORMAT = '{{template}} 이름 ({{date:YYMMDD HHmm}})'

export function sanitizeNoteName(name: string): string {
    return Array.from(name, char => char.charCodeAt(0) < 32 ? '-' : char).join('').replace(/[\\/:*?"<>|]/g, '-').replace(/[. ]+$/g, '').trim() || '노트'
}

export function renderTemplateContent(content: string, title: string, now: Moment, dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm'): string {
    return content.replace(/{{\s*(title|date|time)(?::([^}]+))?\s*}}/gi, (token, kind: string, format?: string) => {
        if (kind.toLowerCase() === 'title') return format ? token : title
        return now.format(format?.trim() || (kind.toLowerCase() === 'date' ? dateFormat : timeFormat))
    })
}

export function generateTemplateNoteName(templateName: string, now: Moment, format = '', words = 'template, 템플릿'): string {
    let cleaned = templateName
    for (const word of words.split(',').map(value => value.trim()).filter(Boolean)) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        cleaned = cleaned.replace(new RegExp(escaped, 'gi'), '')
    }
    cleaned = cleaned.trim() || '노트'
    const templateFormat = format.trim() || DEFAULT_NOTE_NAME_FORMAT
    const rendered = renderTemplateContent(templateFormat, cleaned, now)
        .replace(/{{\s*template\s*}}/gi, () => cleaned)
    return sanitizeNoteName(rendered)
}
