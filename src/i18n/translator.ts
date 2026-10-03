import { en, type MessageKey } from './locales/en'
import { ko } from './locales/ko'

const locales: Record<string, Partial<Record<MessageKey, string>>> = { en, ko }
export function resolveLocale(code: string): 'en' | 'ko' {
    return code.toLowerCase().split('-')[0] === 'ko' ? 'ko' : 'en'
}
export function createTranslator(code: string) {
    const locale = locales[resolveLocale(code)]
    return (key: MessageKey, vars?: Record<string, string | number>): string => {
        const text = locale[key] || en[key]
        return vars ? text.replace(/\{(\w+)\}/g, (token, name: string) => vars[name] === undefined ? token : String(vars[name])) : text
    }
}
