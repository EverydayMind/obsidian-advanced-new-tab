import { Component, Notice, TFile, TFolder, Vault, moment, normalizePath, type App } from "obsidian";
import { generateTemplateNoteName, renderTemplateContent } from './utils/templateUtils';
import type momentFactory from 'moment';
import { t } from './i18n';
import { getCorePlugin } from './integrations'
import { get, type Writable } from "svelte/store";
import { vaultPath } from './utils/pathUtils';
import type HomeTab from "./main";

type TemplatePluginInstance = {
    options?: {
        folder?: string
        templateFolder?: string
        dateFormat?: string
        timeFormat?: string
    }
    [key: string]: unknown
}

type TemplateInternalPlugin = {
    enabled?: boolean
    options?: {
        folder?: string
        templateFolder?: string
        dateFormat?: string
        timeFormat?: string
    }
    instance?: TemplatePluginInstance
}

export class TemplateManager extends Component {
    private app: App
    private plugin: HomeTab
    private templatesStore: Writable<TFile[]>
    private templateStatusStore: Writable<string>
    private creationQueue: Promise<void> = Promise.resolve()

    constructor(app: App, plugin: HomeTab, templatesStore: Writable<TFile[]>, templateStatusStore: Writable<string>) {
        super()
        this.app = app
        this.plugin = plugin
        this.templatesStore = templatesStore
        this.templateStatusStore = templateStatusStore
    }

    private log(message: string, details?: unknown): void {
        if (!this.plugin.settings.debugLogging) {
            return
        }
        if (details !== undefined) {
            console.debug(`[advanced-new-tab][templates] ${message}`, details)
            return
        }
        console.debug(`[advanced-new-tab][templates] ${message}`)
    }

    private updateStatus(message: string): void {
        this.templateStatusStore.set(message)
    }

    onload(): void {
        this.refreshTemplates()
        this.registerEvent(this.app.vault.on('create', (file) => this.onVaultChange(file.path)))
        this.registerEvent(this.app.vault.on('delete', (file) => this.onVaultChange(file.path)))
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.onVaultChange(file.path, oldPath)))
    }

    // Refresh only when the change touches the template folder; open views also
    // refresh on their own (homeView.ts), so unrelated vault events can be ignored.
    private onVaultChange(path: string, oldPath?: string): void {
        const folderPath = this.getTemplateFolderPath()
        if (!folderPath) {
            return
        }
        if (this.isInTemplateFolder(folderPath, path) || (oldPath !== undefined && this.isInTemplateFolder(folderPath, oldPath))) {
            this.refreshTemplates()
        }
    }

    private isInTemplateFolder(folderPath: string, path: string): boolean {
        return folderPath === '/' || path === folderPath || path.startsWith(`${folderPath}/`)
    }

    private getTemplatesPlugin(): TemplateInternalPlugin | undefined {
        return getCorePlugin(this.app, 'templates')
    }

    public isTemplatesPluginEnabled(): boolean {
        const plugin = this.getTemplatesPlugin()
        return !!plugin && plugin.enabled !== false
    }

    public getTemplateFolderPath(): string | null {
        const override = this.plugin.settings.templateFolderOverride?.trim()
        if (override) return normalizePath(override)
        const plugin = this.getTemplatesPlugin()
        if (!this.isTemplatesPluginEnabled()) {
            this.log('Templates core plugin is not enabled.')
            return null
        }
        const folder = plugin?.instance?.options?.folder?.trim()
            ?? plugin?.instance?.options?.templateFolder?.trim()
            ?? plugin?.options?.folder?.trim()
            ?? plugin?.options?.templateFolder?.trim()

        if (!folder) {
            this.log('Unable to resolve template folder from Templates core plugin.', {
                pluginKeys: plugin ? Object.keys(plugin) : [],
                instanceKeys: plugin?.instance ? Object.keys(plugin.instance) : [],
                instanceOptions: plugin?.instance?.options,
                pluginOptions: plugin?.options,
            })
            return null
        }
        return normalizePath(folder)
    }

    public refreshTemplates(): void {
        this.log('Refreshing templates section.')
        const folderPath = this.getTemplateFolderPath()
        if (!folderPath) {
            this.templatesStore.set([])
            this.updateStatus(t('templates.unconfigured'))
            return
        }

        this.log(`Resolved template folder: ${folderPath}`)
        const templates: TFile[] = []
        const folder = folderPath === '/' ? this.app.vault.getRoot() : this.app.vault.getAbstractFileByPath(folderPath)
        if (folder instanceof TFolder) {
            Vault.recurseChildren(folder, (file) => {
                if (file instanceof TFile && file.extension === 'md') templates.push(file)
            })
        }
        templates.sort((a, b) => a.path.localeCompare(b.path))

        this.templatesStore.set(templates)
        this.updateStatus(templates.length > 0 ? '' : t('templates.notFound', { folder: folderPath }))
        this.log(`Loaded ${templates.length} template(s).`, templates.map((file) => file.path))
    }

    public async createNoteFromTemplate(template: TFile, newTab?: boolean): Promise<void> {
        const create = () => this.createNote(template, newTab)
        this.creationQueue = this.creationQueue.then(create, create)
        await this.creationQueue
    }

    public getTemplateFiles(): TFile[] { return get(this.templatesStore) }

    private async createNote(template: TFile, newTab?: boolean): Promise<void> {
        try {
            const mappedFolder = this.plugin.settings.templateTargets?.find(item => item.template === template.path)?.folder.trim()
            const targetFolder = mappedFolder ? vaultPath(mappedFolder) : this.app.fileManager.getNewFileParent('').path
            if (mappedFolder && mappedFolder !== '/' && !(this.app.vault.getAbstractFileByPath(targetFolder) instanceof TFolder)) throw new Error('Template target folder does not exist')
            const now = (moment as unknown as typeof momentFactory)()
            const baseName = generateTemplateNoteName(template.basename, now,
                this.plugin.settings.newNoteNameFormat, this.plugin.settings.templateWordsToStrip)
            let counter = 0
            let filePath: string
            do {
                const suffix = counter === 0 ? '' : ` ${counter}`
                filePath = normalizePath(`${targetFolder}/${baseName}${suffix}.md`)
                counter += 1
            } while (this.app.vault.getAbstractFileByPath(filePath))

            const options = this.getTemplatesPlugin()
            const content = renderTemplateContent(await this.app.vault.cachedRead(template),
                filePath.split('/').pop().slice(0, -3), now,
                options?.instance?.options?.dateFormat?.trim() || options?.options?.dateFormat?.trim() || 'YYYY-MM-DD',
                options?.instance?.options?.timeFormat?.trim() || options?.options?.timeFormat?.trim() || 'HH:mm')
            const created = await this.app.vault.create(filePath, content)
            await this.app.workspace.getLeaf(newTab ? 'tab' : false).openFile(created)
        }
        catch (error) {
            console.error('[advanced-new-tab] Failed to create note from template', error)
            new Notice(t('notice.templateFailed'))
        }
    }
}
