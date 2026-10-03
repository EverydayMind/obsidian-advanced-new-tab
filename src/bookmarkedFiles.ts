import { getBookmarksApi, type BookmarkItem } from './integrations'
import { selectedBookmarks } from './utils/bookmarkUtils'
import { t } from './i18n'
import { Component, Notice, TAbstractFile, TFile, type App } from "obsidian";
import { get, type Writable } from "svelte/store";
import type HomeTab from "./main";
import type { LucideIcon } from "./utils/lucideIcons";

export interface bookmarkedFileStore{
    filepath: string
    iconId: LucideIcon | undefined
}
export interface bookmarkedFile{
    file: TFile
    iconId: LucideIcon | undefined
}

export class bookmarkedFilesManager extends Component{
    private app: App
    private plugin: HomeTab
    private bookmarkedFilesStore: Writable<bookmarkedFile[]>
    private active = false

    constructor(app: App, plugin: HomeTab, bookmarkedFilesStore: Writable<bookmarkedFile[]>){
        super()

        this.app = app
        this.plugin = plugin
        this.bookmarkedFilesStore = bookmarkedFilesStore
    }

    onload(): void{
        this.active = true
        // Load stored bookmarked files, then check if they've changed
        this.loadStoredBookmarkedFiles()
        this.updateBookmarkedFiles()
        // Update stored bookmarked files list when a file is bookmarked or unbookmarked
        const api = getBookmarksApi(this.app)
        if (api?.on) this.registerEvent(api.on('changed', () => this.updateBookmarkedFiles()))
        this.registerEvent(this.app.vault.on('rename', () => this.updateBookmarkedFiles()))
        this.registerEvent(this.app.vault.on('delete', () => this.updateBookmarkedFiles()))
    }

    onunload(): void { this.active = false }

    public updateBookmarkedFiles(): void{
        const bookmarkedFiles = this.getBookmarkedFiles()
        
        this.bookmarkedFilesStore.update((filesArray) => {
            const updatedArray: bookmarkedFile[] = []

            bookmarkedFiles.forEach((bookmarkedFile) => {
                updatedArray.push({
                    file: bookmarkedFile,
                    // Retrieve icon from stored array
                    iconId: filesArray.find((item) => item.file === bookmarkedFile)?.iconId ?? this.plugin.settings.bookmarkedFileStore?.find(item => item.filepath === bookmarkedFile.path)?.iconId
                })
            })
            
            return updatedArray
        })

        void this.storeBookmarkedFiles()
    }

    public updateFileIcon(file: TFile, iconId: LucideIcon): void{
        this.bookmarkedFilesStore.update((filesArray) => {
            const itemIndex = filesArray.findIndex((item) => item.file === file)
            if (itemIndex >= 0) filesArray[itemIndex].iconId = iconId
            return filesArray
        })

        void this.storeBookmarkedFiles()
    }

    private getBookmarkedFiles(): TFile[]{
        if(getBookmarksApi(this.app)){
            const bookmarkedItems = getBookmarksApi(this.app).getBookmarks()
            const bookmarkedFiles: TFile[] = []
    
            const visit = (item: BookmarkItem) => {
                item.items?.forEach(visit)
                if (item.type === 'file' && item.path){
                    const file = this.app.vault.getAbstractFileByPath(item.path)
                    if (file instanceof TFile && !bookmarkedFiles.includes(file)){
                        bookmarkedFiles.push(file)
                    }
                }
            }
            selectedBookmarks(bookmarkedItems, this.plugin.settings.bookmarkGroup).forEach(visit)
            return bookmarkedFiles
        }
        return []
    }

    private async storeBookmarkedFiles(): Promise<void>{
        if(getBookmarksApi(this.app)){
            let storeObj: bookmarkedFileStore[] = []
            get(this.bookmarkedFilesStore).forEach((item) => storeObj.push({
                filepath: item.file.path, // Store only the path instead of the entire TFile instance
                iconId: item.iconId
            }))
            const displayed = new Set(storeObj.map(item => item.filepath))
            this.plugin.settings.bookmarkedFileStore = [...(this.plugin.settings.bookmarkedFileStore ?? []).filter(item => !displayed.has(item.filepath)), ...storeObj]
            await this.plugin.saveData(this.plugin.settings)
        }
    }

    private loadStoredBookmarkedFiles(): void{
        if(getBookmarksApi(this.app)){
            let filesToLoad: bookmarkedFile[] = []
            this.app.workspace.onLayoutReady(() => {
                if (!this.active) return
                this.plugin.settings.bookmarkedFileStore.forEach((item) => {
                    let file: TAbstractFile | null = this.app.vault.getAbstractFileByPath(item.filepath)
                    if(file && file instanceof TFile && this.getBookmarkedFiles().includes(file)){
                        filesToLoad.push({
                            file: file,
                            iconId: item.iconId
                        })
                    }
                })
                this.bookmarkedFilesStore.set(filesToLoad)   
            })
        }
    }

    public removeBookmark = (file: TFile) => {
        const bookmarksPlugin = getBookmarksApi(this.app)
        if(bookmarksPlugin){
            const find = (items: BookmarkItem[]): BookmarkItem | undefined => {
                for (const item of items) {
                    if (item.type === 'file' && item.path === file.path) return item
                    const child = item.items ? find(item.items) : undefined
                    if (child) return child
                }
            }
            const item = find(selectedBookmarks(bookmarksPlugin.getBookmarks(), this.plugin.settings.bookmarkGroup))
            if(item) bookmarksPlugin.removeItem(item)
        }
        else{
            new Notice(t('notice.bookmarksUnavailable'))
        }
    }
}
