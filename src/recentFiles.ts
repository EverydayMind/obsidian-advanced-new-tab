import { Component, type App, TFile } from 'obsidian'
import type HomeTab from './main'
import { recentFiles } from './store'
import { excludedRecentPath } from './utils/recentUtils'

export interface recentFile { file: TFile; timestamp: number }
export interface recentFileStore { filepath: string; timestamp: number }

export class RecentFileManager extends Component {
    private openedHistory: recentFile[] = []
    private hiddenModified = new Set<string>()
    private saveTimer?: number
    private active = false

    constructor(private app: App, private plugin: HomeTab) { super() }

    onload(): void {
        this.active = true
        this.registerEvent(this.app.workspace.on('file-open', file => {
            if (!file) return
            this.openedHistory = [{ file, timestamp: Date.now() }, ...this.openedHistory.filter(item => item.file !== file)]
            this.refresh()
        }))
        this.registerEvent(this.app.vault.on('modify', file => {
            this.hiddenModified.delete(file.path)
            if (this.plugin.settings.recentFileMode === 'modified') this.refresh()
        }))
        this.registerEvent(this.app.vault.on('create', () => {
            if (this.plugin.settings.recentFileMode === 'modified') this.refresh()
        }))
        this.registerEvent(this.app.vault.on('delete', file => {
            if (file instanceof TFile) this.removeRecentFile(file)
        }))
        this.registerEvent(this.app.vault.on('rename', () => this.refresh()))
        this.app.workspace.onLayoutReady(() => {
            if (!this.active) return
            if (this.plugin.settings.storeRecentFile) {
                for (const item of this.plugin.settings.recentFilesStore) {
                    const file = this.app.vault.getFileByPath(item.filepath)
                    if (file && !this.openedHistory.some(entry => entry.file === file)) this.openedHistory.push({ file, timestamp: item.timestamp })
                }
            }
            this.refresh()
        })
    }

    refresh(): void {
        const s = this.plugin.settings
        this.openedHistory = this.openedHistory.filter(item => !excludedRecentPath(item.file.path, s.recentExcludedFolders ?? ''))
            .sort((a, b) => b.timestamp - a.timestamp).slice(0, s.maxRecentFiles)
        const entries = s.recentFileMode === 'modified'
            ? this.app.vault.getFiles().filter(file => !this.hiddenModified.has(file.path)).map(file => ({ file, timestamp: file.stat.mtime }))
            : this.openedHistory
        recentFiles.set(entries.filter(item => !excludedRecentPath(item.file.path, s.recentExcludedFolders ?? ''))
            .sort((a, b) => b.timestamp - a.timestamp).slice(0, s.maxRecentFiles))
        this.scheduleSave()
    }

    removeRecentFile(file: TFile): void {
        this.openedHistory = this.openedHistory.filter(item => item.file !== file)
        this.hiddenModified.add(file.path)
        recentFiles.update(entries => entries.filter(item => item.file !== file))
        this.scheduleSave()
    }

    clear(): void {
        this.openedHistory = []
        if (this.plugin.settings.recentFileMode === 'modified') this.app.vault.getFiles().forEach(file => this.hiddenModified.add(file.path))
        recentFiles.set([])
        this.scheduleSave()
    }

    private scheduleSave(): void {
        if (!this.active) return
        if (this.saveTimer) window.clearTimeout(this.saveTimer)
        this.saveTimer = window.setTimeout(() => { this.saveTimer = undefined; void this.storeRecentFiles() }, 250)
    }

    private async storeRecentFiles(): Promise<void> {
        this.plugin.settings.recentFilesStore = this.plugin.settings.storeRecentFile
            ? this.openedHistory.map(item => ({ filepath: item.file.path, timestamp: item.timestamp })) : []
        await this.plugin.saveData(this.plugin.settings)
    }

    onunload(): void {
        this.active = false
        if (this.saveTimer) { window.clearTimeout(this.saveTimer); this.saveTimer = undefined; void this.storeRecentFiles() }
    }
}
