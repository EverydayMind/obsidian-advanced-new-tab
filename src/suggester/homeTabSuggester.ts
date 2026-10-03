import type Fuse from 'fuse.js'
import { normalizePath, Platform, TFile, type App } from 'obsidian'
import { DEFAULT_FUSE_OPTIONS, FileFuzzySearch, type SearchFile } from './fuzzySearch'
import type HomeTab from '../main'
import type HomeTabSearchBar from "src/homeTabSearchbar"
import { getParentFolderFromPath,  getSearchFiles } from 'src/utils/getFilesUtils'
import { TextInputSuggester } from './suggester'
import { generateHotkeySuggestion } from 'src/utils/htmlUtils'
import { isValidExtension, type FileExtension, type FileType } from 'src/utils/getFileTypeUtils'
import { get } from 'svelte/store'
import HomeTabFileSuggestion from 'src/ui/svelteComponents/homeTabFileSuggestion.svelte'
import { parseWebUrl } from '../utils/urlUtils'
import { t } from '../i18n'

export default class HomeTabFileSuggester extends TextInputSuggester<Fuse.FuseResult<SearchFile>>{
    private files: SearchFile[]
    private fuzzySearch: FileFuzzySearch

    private plugin: HomeTab
    private searchBar: HomeTabSearchBar

    private activeFilter: FileType | FileExtension  | null
    private templateMode = false

    constructor(app: App, plugin: HomeTab, searchBar: HomeTabSearchBar) {
        super(app, get(searchBar.searchBarEl), get(searchBar.suggestionContainerEl), {
                                containerClass: `advanced-new-tab-suggestion-container ${Platform.isPhone ? 'is-phone' : ''}`,
                additionalClasses: `${plugin.settings.selectionHighlight === 'accentColor' ? 'use-accent-color' : ''}`,
                additionalModalInfo: plugin.settings.showShortcuts ? generateHotkeySuggestion([
                    {hotkey: '↑↓', action: t('hint.navigate')},
                    {hotkey: '↵', action: t('hint.open')},
                    {hotkey: 'shift ↵', action: t('hint.create')},
                    {hotkey: 'ctrl ↵', action: t('hint.newTab')},
                    {hotkey: 'esc', action: t('hint.dismiss')},],
                    'advanced-new-tab-hotkey-suggestions') : undefined
                }, plugin.settings.searchDelay)
        this.plugin = plugin
        this.searchBar = searchBar

        this.refreshIndex()

        // Open file in new tab
        this.scope.register(['Mod'], 'Enter', (e) => {
            e.preventDefault()
            const item = this.suggester.getSelectedItem()
            if (item) this.useSelectedItem(item, true)
        })
        // Create file
        this.scope.register(['Shift'], 'Enter', async(e) => {
            e.preventDefault()
            await this.handleFileCreation()
        })
        // Create file and open in new tab
        this.scope.register(['Shift', 'Mod'], 'Enter', async(e) => {
            e.preventDefault()
            await this.handleFileCreation(undefined, true)
        })

        this.trackEvent(this.app.vault, this.app.vault.on('create', () => this.refreshIndex()))
        this.trackEvent(this.app.vault, this.app.vault.on('delete', () => this.refreshIndex()))
        this.trackEvent(this.app.vault, this.app.vault.on('rename', () => this.refreshIndex()))
        this.trackEvent(this.app.metadataCache, this.app.metadataCache.on('resolved', () => this.refreshIndex()))
        this.trackEvent(this.app.metadataCache, this.app.metadataCache.on('changed', () => this.refreshIndex()))
    }

    updateSearchBarContainerElState(isActive: boolean){
        this.inputEl.parentElement?.toggleClass('is-active', isActive)
    }

    onOpen(): void {
        this.updateSearchBarContainerElState(this.suggester.getSuggestions().length > 0 ? true : false)
    }

    onClose(): void {
        this.updateSearchBarContainerElState(false)
    }

    filterSearchFileArray(filterKey: FileType | FileExtension, fileArray: SearchFile[]): SearchFile[]{
        const arrayToFilter = fileArray
        return arrayToFilter.filter(file => isValidExtension(filterKey) ? file.extension === filterKey : file.fileType === filterKey)
    }

    private refreshIndex(): void {
        this.files = this.templateMode
            ? (this.plugin.templateManager?.getTemplateFiles() ?? []).map(file => ({ name: file.name, basename: file.basename, path: file.path, file, isCreated: true, extension: 'md', fileType: 'markdown' }))
            : getSearchFiles(this.app, this.plugin.settings.unresolvedLinks, this.plugin.settings.searchHeadings)
        let indexed = this.plugin.settings.markdownOnly ? this.filterSearchFileArray('markdown', this.files) : this.files
        if (this.activeFilter) indexed = this.filterSearchFileArray(this.activeFilter, this.files)
        const options = { ...DEFAULT_FUSE_OPTIONS, ignoreLocation: true, fieldNormWeight: 1.65, keys: [{name: 'basename', weight: 1.5}, {name: 'aliases', weight: 0.1}] }
        if (this.fuzzySearch) this.fuzzySearch.updateSearchArray(indexed)
        else this.fuzzySearch = new FileFuzzySearch(indexed, options)
    }

    onNoSuggestion(): void {
        if (this.templateMode) { this.close(); return }
        if(!this.activeFilter || this.activeFilter === 'markdown' || this.activeFilter === 'md'){
            const input = this.inputEl.value
            if (input) {
                this.suggester.setSuggestions([{
                        item: {
                            name: `${input}.md`,
                            path: `${input}.md`,
                            basename: input,
                            isCreated: false,
                            fileType: 'markdown',
                            extension: 'md',
                        },
                        refIndex: 0,
                        score: 0,
                }])
                this.open()
            }
            else{
                this.close()
            }
        }
        else{
            this.close()
        }
    }

    getSuggestions(input: string): Fuse.FuseResult<SearchFile>[] {
        if (this.templateMode) this.refreshIndex()
        const results: Fuse.FuseResult<SearchFile>[] = this.templateMode && !input.trim()
            ? this.files.slice(0, this.plugin.settings.maxResults).map((item, refIndex) => ({ item, refIndex, score: 0 }))
            : this.fuzzySearch?.rawSearch(input, this.plugin.settings.maxResults) ?? []
        const url = parseWebUrl(input)
        if (url) results.unshift({ item: { name: url, basename: url, path: url,
            url, isCreated: true, extension: '', fileType: 'markdown' }, refIndex: -1, score: 0 })
        return results.slice(0, this.plugin.settings.maxResults)
    }

    useSelectedItem(selectedItem: Fuse.FuseResult<SearchFile>, newTab?: boolean): void {
        if (!selectedItem) return
        if (selectedItem.item.url) {
            this.close()
            this.searchBar.openUrl(selectedItem.item.url, newTab)
            return
        }
        if(selectedItem.item.isCreated && selectedItem.item.file){
            if (this.templateMode) {
                this.close()
                void this.plugin.templateManager?.createNoteFromTemplate(selectedItem.item.file, newTab)
            } else this.searchBar.openFile(selectedItem.item.file, newTab, selectedItem.item.heading)
        }
        else{
            void this.handleFileCreation(selectedItem.item, newTab)
        }
    }

    getDisplayElementProps(suggestion: Fuse.FuseResult<SearchFile>): {nameToDisplay: string, filePath?: string}{
        const nameToDisplay = suggestion.item.url ? t('action.openLink', { url: suggestion.item.url }) : suggestion.item.heading ? `${suggestion.item.heading} — ${suggestion.item.file.basename}` : this.fuzzySearch.getBestMatch(suggestion, this.inputEl.value)
        let filePath: string | undefined = undefined
        if(this.plugin.settings.showPath && !suggestion.item.url){
            filePath = suggestion.item.file ? suggestion.item.file.parent.name : getParentFolderFromPath(suggestion.item.path) // Parent folder
        }

        return {
            nameToDisplay: nameToDisplay,
            filePath: filePath
        }
    }

    getDisplayElementComponentType(): typeof HomeTabFileSuggestion{
        return HomeTabFileSuggestion
    }

    async handleFileCreation(selectedFile?: SearchFile, newTab?: boolean): Promise<void>{
        if (this.templateMode) return
        let newFile: TFile

        if(selectedFile?.isUnresolved){
            const folderPath = selectedFile.path.replace(selectedFile.name, '')
            if(!await this.app.vault.adapter.exists(folderPath)){
                await this.app.vault.createFolder(folderPath)
            }
            newFile = await this.app.vault.create(selectedFile.path, '')
        }
        else{
            const input = this.inputEl.value;
            // If a file with the same filename exists open it
            // Mimics the behaviour of the default quick switcher
            const files = this.files.filter(file => file.fileType === 'markdown')
            if(files.map(file => file.basename).includes(input)){
                const fileToOpen = files.find(f => f.basename === input)?.file
                if(fileToOpen){
                    return this.openFile(fileToOpen, newTab)
                }
            }
            newFile = await this.app.vault.create(normalizePath(`${this.app.fileManager.getNewFileParent(this.searchBar.sourcePath).path}/${input}.md`), '')
        }


        this.openFile(newFile, newTab)
    }

    openFile(file: TFile, newTab?: boolean): void {
        this.searchBar.openFile(file, newTab)
    }

    setFileFilter(filterKey: FileType | FileExtension): void{
        this.activeFilter = filterKey

        this.refreshIndex()

        this.suggester.setSuggestions([]) // Reset search suggestions
        this.close()
    }

    setTemplateFilter(): void {
        this.templateMode = true
        this.plugin.templateManager?.refreshTemplates()
        this.refreshIndex()
        this.close()
    }
}
