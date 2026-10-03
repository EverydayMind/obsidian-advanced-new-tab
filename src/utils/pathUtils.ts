import { normalizePath, TFolder, type App } from 'obsidian'

export function vaultPath(value: string): string {
    if (/^[a-z]:/i.test(value) || value.replace(/\\/g, '/').split('/').some(part => part === '..' || part === '.') || /[\0\r\n]/.test(value)) throw new Error('Invalid vault path')
    return normalizePath(value)
}

export async function ensureParentFolders(app: App, filePath: string): Promise<void> {
    const parts = vaultPath(filePath).split('/').slice(0, -1)
    for (let i = 1; i <= parts.length; i++) {
        const path = parts.slice(0, i).join('/')
        if (!path) continue
        const existing = app.vault.getAbstractFileByPath(path)
        if (existing instanceof TFolder) continue
        if (existing) throw new Error('Parent path is a file')
        try { await app.vault.createFolder(path) }
        catch (error) { if (!(app.vault.getAbstractFileByPath(path) instanceof TFolder)) throw error }
    }
}

export function isWithinFolder(path: string, folder: string): boolean {
    const normalized = normalizePath(folder)
    return normalized === '/' || normalized === '' || path === normalized || path.startsWith(`${normalized}/`)
}
