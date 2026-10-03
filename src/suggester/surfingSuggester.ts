import { getCommunityPlugin } from '../integrations'
import { parseWebUrl } from '../utils/urlUtils'
import { t } from '../i18n'
import type Fuse from 'fuse.js'
import { Platform, Plugin, View, WorkspaceLeaf, type App } from 'obsidian'
import type HomeTab from '../main'
import type HomeTabSearchBar from "src/homeTabSearchbar"
import { TextInputSuggester } from './suggester'
import { generateHotkeySuggestion } from 'src/utils/htmlUtils'
import { get } from 'svelte/store'
import SurfingSuggestion from 'src/ui/svelteComponents/surfingSuggestion.svelte'
import { SurfingItemFuzzySearch } from './fuzzySearch'

interface SurfingPlugin extends Plugin{
    settings: SurfingSettings
}
interface SurfingSettings{
	defaultSearchEngine: string;
}
interface SurfingView extends View{
    navigate: (url: string, addToHistory?: boolean, updateWebView?: boolean) => void
}
interface WebBrowserViewState{
	url: string
	active?: boolean
}
export interface SurfingItem{
    type: 'bookmark' | 'history' | 'open' | 'newUrl'
    name: string
    url: string
    description?: string
}

export default class SurfingSuggester extends TextInputSuggester<Fuse.FuseResult<SurfingItem>>{
    // private files: SearchFile[]
    private surfingPlugin: SurfingPlugin
    private surfingJSONfile: string = 'surfing-bookmark.json'

    private fuzzySearch: SurfingItemFuzzySearch

    private plugin: HomeTab
    private searchBar: HomeTabSearchBar

    constructor(app: App, plugin: HomeTab, searchBar: HomeTabSearchBar) {
        super(app, get(searchBar.searchBarEl), get(searchBar.suggestionContainerEl), {
                                containerClass: `advanced-new-tab-suggestion-container ${Platform.isPhone ? 'is-phone' : ''}`,
                additionalClasses: `${plugin.settings.selectionHighlight === 'accentColor' ? 'use-accent-color' : ''}`,
                additionalModalInfo: plugin.settings.showShortcuts ? generateHotkeySuggestion([
                    {hotkey: '↑↓', action: t('hint.navigate')},
                    {hotkey: '↵', action: t('hint.open')},
                    {hotkey: 'ctrl ↵', action: t('hint.newTab')},
                    {hotkey: 'esc', action: t('hint.dismiss')},],
                    'advanced-new-tab-hotkey-suggestions') : undefined
                }, plugin.settings.searchDelay)

        this.plugin = plugin
        this.searchBar = searchBar

        this.surfingPlugin = getCommunityPlugin(this.app, 'surfing') as unknown as SurfingPlugin

        this.fuzzySearch = new SurfingItemFuzzySearch([])

        // Open url in new tab
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

    onNoSuggestion(): void {
        const input = this.inputEl.value
        if (input){
            this.suggester.setSuggestions([{
                item: {
                    type: 'newUrl',
                    name: input,
                    url: input,
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

    async getSuggestions(input: string): Promise<Fuse.FuseResult<SurfingItem>[]> {
        return this.fuzzySearch.rawSearch(input, this.plugin.settings.maxResults)
    }

    useSelectedItem(selectedItem: Fuse.FuseResult<SurfingItem>, newTab?: boolean): void {
        if (!selectedItem) return
        const input = selectedItem.item.url
        const url = parseWebUrl(input)
        if (url) { this.close(); this.searchBar.openUrl(url, newTab); return }
        if (/^[a-z][a-z\d+.-]*:/i.test(input) && !parseWebUrl(input)) return
        const leaf = newTab ? this.app.workspace.getLeaf('tab') : this.app.workspace.getMostRecentLeaf()
        if (leaf) void this.patchLeaf(leaf, input).catch(error => console.error('[advanced-new-tab] Surfing failed', error))
    }

    private async patchLeaf(leaf: WorkspaceLeaf, url: string): Promise<SurfingView>{
        const state: WebBrowserViewState = {
            url: url,
            active: true,
        }

        await leaf.setViewState({
            type: 'surfing-view',
            state: state as unknown as Record<string, unknown>
        })

        return leaf.view as SurfingView
    }


    getDisplayElementProps(suggestion: Fuse.FuseResult<SurfingItem>): {info: string}{
        let info: string = ''

        if(suggestion.item.type === 'newUrl'){
            info = t('search.webEngine', { engine: this.surfingPlugin?.settings?.defaultSearchEngine || 'Surfing' })
        }

        return {info: info}
    }

    getDisplayElementComponentType(): typeof SurfingSuggestion{
        return SurfingSuggestion
    }

}
