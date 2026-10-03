import { en, type MessageKey } from './locales/en'
import { ko } from './locales/ko'

const locales: Record<string, Partial<Record<MessageKey, string>>> = { en, ko }
export function createTranslator(code: string) {
    const normalized = code.toLowerCase()
    const locale = locales[normalized] ?? locales[normalized.split('-')[0]] ?? en
    return (key: MessageKey, vars?: Record<string, string | number>): string => {
        const text = locale[key] || en[key]
        return vars ? text.replace(/\{(\w+)\}/g, (token, name: string) => vars[name] === undefined ? token : String(vars[name])) : text
    }
}
