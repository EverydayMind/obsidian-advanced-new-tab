import { getLanguage } from 'obsidian'
import { get, writable } from 'svelte/store'
import { createTranslator } from './translator'
import type { MessageKey } from './locales/en'
export type { MessageKey } from './locales/en'

export const i18n = writable(createTranslator('en'))
export function initI18n(preference: string): void {
    i18n.set(createTranslator(preference === 'auto' ? getLanguage() : preference))
}
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
    return get(i18n)(key, vars)
}
