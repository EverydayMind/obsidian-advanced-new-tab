import { getOmnisearchApi } from '../integrations'
import { parseWebUrl } from '../utils/urlUtils'
import { t } from '../i18n'
import { Platform, TFile, type App } from 'obsidian'
import type HomeTab from '../main'
import type HomeTabSearchBar from "src/homeTabSearchbar"
import { TextInputSuggester } from './suggester'
import { generateHotkeySuggestion } from 'src/utils/htmlUtils'
import { get } from 'svelte/store'
import OmnisearchSuggestion from 'src/ui/svelteComponents/omnisearchSuggestion.svelte'
import { highlightText, type HighlightPart } from '../utils/highlightUtils'

export type OmnisearchApi = {
    // Returns a promise that will contain the same results as the Vault modal
    search: (query: string) => Promise<ResultNoteApi[]>,
    // Refreshes the index
    refreshIndex: () => Promise<void>
    // Register a callback that will be called when the indexing is done
    registerOnIndexed: (callback: () => void) => void,
    // Unregister a callback that was previously registered
    unregisterOnIndexed: (callback: () => void) => void,
  }
export type ResultNoteApi = {
    url?: string
    score: number
    path: string
    excerpt: string
    basename: string
    foundWords: string[]
    matches: SearchMatchApi[]
}
export type SearchMatchApi = {
    match: string
    offset: number
}

export default class OmnisearchSuggester extends TextInputSuggester<ResultNoteApi>{
    // private files: SearchFile[]
    private omnisearch: OmnisearchApi

    private plugin: HomeTab
    private searchBar: HomeTabSearchBar

    constructor(app: App, plugin: HomeTab, searchBar: HomeTabSearchBar) {
        super(app, get(searchBar.searchBarEl), get(searchBar.suggestionContainerEl), {
                                containerClass: `advanced-new-tab-suggestion-container ${Platform.isPhone ? 'is-phone' : ''}`,
                // suggestionItemClass: 'suggestion-item omnisearch-result',
                additionalClasses: `${plugin.settings.selectionHighlight === 'accentColor' ? 'use-accent-color' : ''}`,
                additionalModalInfo: plugin.settings.showShortcuts ? generateHotkeySuggestion([
                    {hotkey: '↑↓', action: t('hint.navigate')},
                    {hotkey: '↵', action: t('hint.open')},
                    // {hotkey: 'shift ↵', action: t('hint.create')},
                    {hotkey: 'ctrl ↵', action: t('hint.newTab')},
                    {hotkey: 'esc', action: t('hint.dismiss')},],
                    'advanced-new-tab-hotkey-suggestions') : undefined
                }, plugin.settings.searchDelay)
        this.plugin = plugin
        this.searchBar = searchBar

        this.omnisearch = getOmnisearchApi(app, this.inputEl.ownerDocument.defaultView)

        // Open file in new tab
        this.scope.register(['Mod'], 'Enter', (e) => {
            e.preventDefault()
            const item = this.suggester.getSelectedItem()
            if (item) this.useSelectedItem(item, true)
        })
    }

    updateSearchBarContainerEl(isActive: boolean){
        this.inputEl.parentElement?.toggleClass('is-active', isActive)
    }

    onOpen(): void {
        this.updateSearchBarContainerEl(this.suggester.getSuggestions().length > 0 ? true : false)
    }

    onClose(): void {
        this.updateSearchBarContainerEl(false)
    }

    // onNoSuggestion(): void {
    //     const input = this.inputEl.value
    //     if (!!input) {}
    //     else{
    //         this.close()
    //     }
    // }

    async getSuggestions(input: string): Promise<ResultNoteApi[]> {
        const url = parseWebUrl(input)
        if (url) return [{ url, score: 0, path: url, basename: t('action.openLink', { url }), excerpt: '', foundWords: [], matches: [] }]
        const suggestions = (await this.omnisearch?.search(input) ?? []).splice(0, this.plugin.settings.maxResults)
        return suggestions
    }

    useSelectedItem(selectedItem: ResultNoteApi, newTab?: boolean): void {
        if (!selectedItem) return
        if (selectedItem.url) { this.close(); this.searchBar.openUrl(selectedItem.url, newTab); return }
        const file = this.app.vault.getAbstractFileByPath(selectedItem.path)
        if(file && file instanceof TFile){
            this.openFile(file, newTab)
        }
    }


    getDisplayElementProps(suggestion: ResultNoteApi): {basename: HighlightPart[], excerpt: HighlightPart[]} {
        return {
            basename: highlightText(suggestion.basename, suggestion.foundWords),
            excerpt: highlightText(this.plugin.settings.showOmnisearchExcerpt ? suggestion.excerpt : '', suggestion.foundWords),
        }
    }

    getDisplayElementComponentType(): typeof OmnisearchSuggestion{
        return OmnisearchSuggestion
    }

    openFile(file: TFile, newTab?: boolean): void {
        this.searchBar.openFile(file, newTab)
    }

}
