import { MarkdownView, Notice, Plugin, WorkspaceLeaf, normalizePath } from 'obsidian';
import { EmbeddedHomeTab, HomeTabView, VIEW_TYPE } from 'src/homeView';
import { HomeTabSettingTab, DEFAULT_SETTINGS, type HomeTabSettings } from './settings'
import { pluginSettingsStore, bookmarkedFiles, templateFiles, templateStatus } from './store'
import { RecentFileManager } from './recentFiles';
import { bookmarkedFilesManager } from './bookmarkedFiles';
import { TemplateManager } from './templates';
import './styles.css';
import { mergeSettings } from './utils/settingsUtils';
import { sanitizeNoteName } from './utils/templateUtils';
import { initI18n, t } from './i18n';

declare module 'obsidian'{
	interface App{
		internalPlugins: InternalPlugins
		plugins: Plugins
		commands: {
			executeCommandById: (id: string) => boolean
		}
		dom: any
		isMobile: boolean
	}
	interface InternalPlugins{
		getPluginById: Function
		plugins: {
			bookmarks: BookmarksPlugin
		}
	}
	interface Plugins{
		getPlugin: (id: string) => Plugin_2
	}
	interface BookmarksPlugin extends Plugin_2{
		instance: {
			items: BookmarkItem[]
			getBookmarks: () => BookmarkItem[]
			removeItem: (item: BookmarkItem) => void
		}
	}
	interface BookmarkItem{
		type: string,
		title: string | undefined,
		path: string
	}
	interface config{
		nativeMenus: boolean
	}
	interface Vault{
		config: config
	}
	interface Workspace{
		createLeafInTabGroup: Function
	}
	interface WorkspaceLeaf{
		rebuildView: Function
		activeTime: number
		app: App
	}
	interface TFile{
		deleted: boolean
	}
}

export default class HomeTab extends Plugin {
	settings: HomeTabSettings;
	recentFileManager: RecentFileManager
	bookmarkedFileManager: bookmarkedFilesManager
	templateManager: TemplateManager
	activeEmbeddedHomeTabViews: EmbeddedHomeTab[]
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

		this.activeEmbeddedHomeTabViews = []

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
			id: 'open-today-daily-note',
			name: "Open today's daily note",
			callback: () => this.openTodayDailyNote()})

		// Wait for all plugins to load before check if the bookmarked plugin is enabled
		this.app.workspace.onLayoutReady(() => {
			const bookmarksPlugin = this.app.internalPlugins.getPluginById('bookmarks')
			if(bookmarksPlugin && bookmarksPlugin.enabled !== false){
				this.bookmarkedFileManager = this.addChild(new bookmarkedFilesManager(this.app, this, bookmarkedFiles))
			}

			this.registerMarkdownCodeBlockProcessor('search-bar', (source, el, ctx) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView)
				if(view){
					let embeddedHomeTab = new EmbeddedHomeTab(el, view, this, source)
					this.activeEmbeddedHomeTabViews.push(embeddedHomeTab)
					ctx.addChild(embeddedHomeTab)
				}
			})

			if(this.settings.newTabOnStart){
				// If an Advanced New Tab leaf is already open focus it
				const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE)
				if(leaves.length > 0){
					this.app.workspace.revealLeaf(leaves[0])
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
		this.activeEmbeddedHomeTabViews.slice().forEach(view => view.unload())
	}

	async loadSettings(): Promise<void> {
		const loadedSettings = await this.loadData()
		this.settings = mergeSettings(DEFAULT_SETTINGS, loadedSettings)
		if(loadedSettings?.showbookmarkedFiles === undefined){
			const bookmarks = this.app.internalPlugins.getPluginById('bookmarks')
			this.settings.showbookmarkedFiles = !!bookmarks && bookmarks.enabled !== false
		}

		// One-time migration for existing users: when the new templates section setting
		// is absent, default it to enabled if the Templates core plugin is available.
		if(loadedSettings?.showTemplates === undefined){
			const templates = this.app.internalPlugins.getPluginById('templates')
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
			leaf.setViewState({
				type: VIEW_TYPE,
			})
			// Focus newly opened tab
			if(openNewTab){this.app.workspace.revealLeaf(leaf)}
		}
	}

	public refreshOpenViews(): void {
		this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.rebuildView())
	}

	public async openTodayDailyNote(): Promise<void> {
		const dailyNotesPlugin = this.app.internalPlugins.getPluginById('daily-notes')
		if (!dailyNotesPlugin || dailyNotesPlugin.enabled === false) {
			new Notice('Daily Notes core plugin is not enabled.')
			return
		}

		const executed = this.app.commands.executeCommandById('daily-notes')
		if (!executed) {
			new Notice('Unable to open today\'s daily note.')
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
			new Notice('Unable to create a new note.')
		}
	}
}
