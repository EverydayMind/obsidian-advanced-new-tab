import { Notice, Plugin, WorkspaceLeaf, normalizePath } from 'obsidian';
import { EmbeddedHomeTab, HomeTabView, VIEW_TYPE, CODE_BLOCK_TYPE } from 'src/homeView';
import { HomeTabSettingTab, DEFAULT_SETTINGS, type HomeTabSettings } from './settings'
import { pluginSettingsStore, bookmarkedFiles, templateFiles, templateStatus } from './store'
import { RecentFileManager } from './recentFiles';
import { bookmarkedFilesManager } from './bookmarkedFiles';
import { TemplateManager } from './templates';
import './styles.css';
import { mergeSettings } from './utils/settingsUtils';
import { sanitizeNoteName } from './utils/templateUtils';
import { initI18n, t } from './i18n';
import { getCorePlugin, getCommunityPlugin, executeAppCommand, isRecord } from './integrations'
import type { QuickAction } from './settingsData'
import { openInWebViewer } from './webViewer'
import { executeCoreAction, type CoreActionId } from './coreActions'

export default class HomeTab extends Plugin {
	settings: HomeTabSettings;
	recentFileManager: RecentFileManager
	bookmarkedFileManager: bookmarkedFilesManager
	templateManager: TemplateManager
	private embeddedCleanups = new Set<() => void>()
	private ribbonEl: HTMLElement
	
	async onload() {
		await this.loadSettings();
		initI18n(this.settings.language)
		this.addSettingTab(new HomeTabSettingTab(this.app, this))
		this.registerView(VIEW_TYPE, (leaf) => new HomeTabView(leaf, this));		
		this.ribbonEl = this.addRibbonIcon('search', t('command.open'), () => this.activateView(false, true))
		this.ribbonEl.toggle(this.settings.showRibbonIcon)

		// Replace new tabs with home tab view
		this.registerEvent(this.app.workspace.on('layout-change', () => this.onLayoutChange()))
		// Refocus search bar on leaf change
		this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf: WorkspaceLeaf | null) => {if(leaf?.view instanceof HomeTabView){leaf.view.searchBar.focusSearchbar()}}))

		pluginSettingsStore.set(this.settings) // Store the settings for the svelte components


		this.recentFileManager = this.addChild(new RecentFileManager(this.app, this))

		this.templateManager = this.addChild(new TemplateManager(this.app, this, templateFiles, templateStatus))

		this.addCommand({
			id: 'open-new-home-tab',
			name: t('command.open'),
			callback: () => this.activateView(false, true)})
		this.addCommand({
			id: 'open-home-tab',
			name: t('command.replace'),
			callback: () => this.activateView(true)})
        this.addCommand({
            id: 'focus-search', name: t('command.focus'),
            checkCallback: checking => {
                const leaf = this.app.workspace.getMostRecentLeaf()
                if (!(leaf?.view instanceof HomeTabView)) return false
                if (!checking) leaf.view.searchBar.focusSearchbar()
                return true
            },
        })
        this.addCommand({
            id: 'open-today-daily-note',
			name: t('action.dailyNote'),
			callback: () => this.openTodayDailyNote()})

		// Wait for all plugins to load before check if the bookmarked plugin is enabled
		this.app.workspace.onLayoutReady(() => {
            if (!getCommunityPlugin(this.app, 'home-tab') && !getCommunityPlugin(this.app, 'harbor-tab')) {
                for (const leaf of this.app.workspace.getLeavesOfType('home-tab-view')) {
                    void leaf.setViewState({ ...leaf.getViewState(), type: VIEW_TYPE })
                }
            }
            const bookmarksPlugin = getCorePlugin(this.app, 'bookmarks')
			if(bookmarksPlugin && bookmarksPlugin.enabled !== false){
				this.bookmarkedFileManager = this.addChild(new bookmarkedFilesManager(this.app, this, bookmarkedFiles))
			}

            this.registerMarkdownCodeBlockProcessor(CODE_BLOCK_TYPE, (source, el, ctx) => {
                const embedded = new EmbeddedHomeTab(el, this, source, ctx.sourcePath)
                ctx.addChild(embedded)
            })

			if(this.settings.newTabOnStart){
				// If an Advanced New Tab leaf is already open focus it
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE)
				if(leaves.length > 0){
					void this.app.workspace.revealLeaf(leaves[0])
					// If more than one home tab leaf is open close them
					leaves.forEach((leaf, index) => {
						if(index < 1) return
						leaf.detach()
					})
				}
				else{
					this.activateView(false, true)
				}
				// Close all other open leaves
				if(this.settings.closePreviousSessionTabs){
					// Get open leaves type
					const leafTypes: string[] = []
					this.app.workspace.iterateRootLeaves((leaf) => {
						const leafType = leaf.view.getViewType()
						if(leafTypes.indexOf(leafType) === -1 && leafType != VIEW_TYPE){
							leafTypes.push(leafType)
						}
					})
					leafTypes.forEach((type) => this.app.workspace.detachLeavesOfType(type))
				}
			}
		})
	}

	onunload(): void {
		for (const cleanup of this.embeddedCleanups) cleanup()
        this.embeddedCleanups.clear()
	}

    registerEmbeddedCleanup(cleanup: () => void): () => void {
        this.embeddedCleanups.add(cleanup)
        return () => this.embeddedCleanups.delete(cleanup)
    }

	async loadSettings(): Promise<void> {
		const loaded: unknown = await this.loadData()
        const loadedSettings = isRecord(loaded) ? loaded : undefined
		this.settings = mergeSettings(DEFAULT_SETTINGS, loadedSettings)
		if(loadedSettings?.showbookmarkedFiles === undefined){
			const bookmarks = getCorePlugin(this.app, 'bookmarks')
			this.settings.showbookmarkedFiles = !!bookmarks && bookmarks.enabled !== false
		}

		// One-time migration for existing users: when the new templates section setting
		// is absent, default it to enabled if the Templates core plugin is available.
		if(loadedSettings?.showTemplates === undefined){
			const templates = getCorePlugin(this.app, 'templates')
			this.settings.showTemplates = !!templates && templates.enabled !== false
		}
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)
		initI18n(this.settings.language)
		pluginSettingsStore.update(() => this.settings)
		this.ribbonEl?.toggle(this.settings.showRibbonIcon)
	}

	private onLayoutChange(): void{
		if(this.settings.replaceNewTabs){
			this.activateView()
		}
	}

	public activateView(overrideView?: boolean, openNewTab?: boolean):void {
		const leaf = openNewTab ? this.app.workspace.getLeaf('tab') : this.app.workspace.getMostRecentLeaf()
		// const leaf = newTab ? app.workspace.getLeaf() : app.workspace.getMostRecentLeaf()
		if(leaf && (overrideView || leaf.getViewState().type === 'empty')){
			void leaf.setViewState({
				type: VIEW_TYPE,
			})
			// Focus newly opened tab
			if(openNewTab){void this.app.workspace.revealLeaf(leaf)}
		}
	}

	public refreshOpenViews(): void {
		pluginSettingsStore.set(this.settings)
	}

	public async openTodayDailyNote(): Promise<void> {
		const dailyNotesPlugin = getCorePlugin(this.app, 'daily-notes')
		if (!dailyNotesPlugin || dailyNotesPlugin.enabled === false) {
			new Notice(t('notice.dailyUnavailable'))
			return
		}

		const executed = executeAppCommand(this.app, 'daily-notes')
		if (!executed) {
			new Notice(t('notice.dailyFailed'))
		}
	}

    async runQuickAction(action: QuickAction): Promise<void> {
        if (action.kind === 'command') {
            if (!executeAppCommand(this.app, action.target)) new Notice(t('notice.actionUnavailable'))
            return
        }
        const file = this.app.vault.getFileByPath(action.target)
        if (!file) { new Notice(t('notice.actionUnavailable')); return }
        await this.app.workspace.getLeaf(action.newTab ? 'tab' : false).openFile(file)
    }

    runCoreAction(id: CoreActionId, event?: Event): void {
        try {
            if (!executeCoreAction(this.app, id, event)) new Notice(t('notice.actionUnavailable'))
        } catch (error) {
            console.error('[advanced-new-tab] Core action failed', error)
            new Notice(t('notice.actionUnavailable'))
        }
    }

    async openWebUrl(url: string, newTab = false, currentLeaf?: WorkspaceLeaf): Promise<void> {
        try {
            const result = await openInWebViewer(this.app, url, newTab, currentLeaf)
            if (result === 'unavailable') new Notice(t('notice.webViewerUnavailable'))
            else if (result === 'invalid') new Notice(t('validation.url'))
        } catch (error) {
            console.error('[advanced-new-tab] Web viewer failed', error)
            new Notice(t('notice.webViewerFailed'))
        }
    }

	public async createNewNote(): Promise<void> {
		try {
			const folder = this.app.fileManager.getNewFileParent('').path
			const name = sanitizeNoteName('Untitled')
			let counter = 0
			let path: string
			do {
				path = normalizePath(`${folder}/${name}${counter ? ` ${counter}` : ''}.md`)
				counter += 1
			} while (this.app.vault.getAbstractFileByPath(path))
			const file = await this.app.vault.create(path, '')
			await this.app.workspace.getLeaf(false).openFile(file)
		} catch (error) {
			console.error('[advanced-new-tab] Unable to create a new note', error)
			new Notice(t('notice.newNoteFailed'))
		}
	}
}
