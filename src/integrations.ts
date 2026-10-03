import type { App, EventRef, TFolder } from 'obsidian'
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

export function getDailyNoteOptions(app: App): { folder: string; format: string; template: string } | undefined {
    const plugin = getCorePlugin(app, 'daily-notes')
    if (!plugin) return undefined
    const instance = isRecord(plugin.instance) ? plugin.instance : undefined
    const options = isRecord(instance?.options) ? instance.options : isRecord(plugin.options) ? plugin.options : {}
    return {
        folder: typeof options.folder === 'string' ? options.folder : '',
        format: typeof options.format === 'string' && options.format ? options.format : 'YYYY-MM-DD',
        template: typeof options.template === 'string' ? options.template : '',
    }
}

export async function revealVaultFolder(app: App, folder: TFolder): Promise<boolean> {
    if (!getCorePlugin(app, 'file-explorer')) return false
    const leaf = app.workspace.getLeavesOfType('file-explorer')[0]
    const view = leaf?.view as unknown as { revealInFolder?: (folder: TFolder) => void | Promise<void> } | undefined
    if (typeof view?.revealInFolder !== 'function') return false
    await view.revealInFolder(folder)
    await app.workspace.revealLeaf(leaf)
    return true
}
