import type { App, EventRef } from 'obsidian'
import type { OmnisearchApi } from './suggester/omnisearchSuggester'

type RecordValue = Record<string, unknown>
export function isRecord(value: unknown): value is RecordValue {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Obsidian does not expose core/community plugin discovery or command execution
// in its public SDK. Keep these guarded compatibility boundaries in one module.
interface AppInternals {
    internalPlugins?: { getPluginById?: (id: string) => unknown }
    plugins?: { getPlugin?: (id: string) => unknown }
    commands?: { executeCommandById?: (id: string, event?: Event) => boolean; listCommands?: () => { id: string; name: string }[] }
}
export function getCorePlugin(app: App, id: string): RecordValue | undefined {
    const value = (app as unknown as AppInternals).internalPlugins?.getPluginById?.(id)
    return isRecord(value) && value.enabled === true ? value : undefined
}
export function getCommunityPlugin(app: App, id: string): RecordValue | undefined {
    const value = (app as unknown as AppInternals).plugins?.getPlugin?.(id)
    return isRecord(value) ? value : undefined
}
export function executeAppCommand(app: App, id: string, event?: Event): boolean {
    return (app as unknown as AppInternals).commands?.executeCommandById?.(id, event) ?? false
}
export function listAppCommands(app: App): { id: string; name: string }[] {
    return (app as unknown as AppInternals).commands?.listCommands?.() ?? []
}

export interface BookmarkItem { type: string; path?: string; title?: string; items?: BookmarkItem[] }
export interface BookmarksApi {
    getBookmarks: () => BookmarkItem[]
    removeItem: (item: BookmarkItem) => void
    on?: (name: string, callback: () => void) => EventRef
}
export function getBookmarksApi(app: App): BookmarksApi | undefined {
    const instance = getCorePlugin(app, 'bookmarks')?.instance
    if (!isRecord(instance) || typeof instance.getBookmarks !== 'function' || typeof instance.removeItem !== 'function') return undefined
    return instance as unknown as BookmarksApi
}

export function getOmnisearchApi(app: App, host: Window): OmnisearchApi | undefined {
    const plugin = getCommunityPlugin(app, 'omnisearch')
    if (!plugin) return undefined
    // Omnisearch publishes window.omnisearch; plugin.api supports compatible forks.
    const candidates = [plugin.api, (host as unknown as { omnisearch?: unknown }).omnisearch]
    for (const api of candidates) {
        if (isRecord(api) && typeof api.search === 'function') return api as unknown as OmnisearchApi
    }
    return undefined
}
