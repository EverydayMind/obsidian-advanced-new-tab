import { getCommunityPlugin, getOmnisearchApi } from './integrations'
import { Notice, type TFile } from "obsidian";
import type HomeTab from "./main";
import { pluginSettingsStore } from "./store"
import { t } from "./i18n"
import { writable, type Writable, get } from "svelte/store";
import HomeTabFileSuggester from "src/suggester/homeTabSuggester";
import OmnisearchSuggester from "./suggester/omnisearchSuggester";
import SurfingSuggester from "./suggester/surfingSuggester";
import { fileTypes, type FileExtension, type FileType, fileExtensions } from "./utils/getFileTypeUtils";

export type SearchBarFilterType = 'fileExtension' | 'fileType' | 'webSearch' | 'omnisearch' | 'default'

const omnisearchKeys = ['omnisearch', 'omni'] as const
const webSearchKeys = ['surfing', 'web', 'internet'] as const

export type OmnisearchFilterKey = typeof omnisearchKeys[number]
export type WebsearchFilterKey = typeof webSearchKeys[number]
export type ExtensionsearchFilterKey = FileExtension
export type FileTypesearchFilterKey = FileType

type FilterKeyLookupTable = {[key in SearchBarFilterType]: string[]}
const filterKeysLookupTable: FilterKeyLookupTable = {
    default: [],
    omnisearch: [...omnisearchKeys],
    webSearch: [...webSearchKeys],
    fileType: [...fileTypes],
    fileExtension: [...fileExtensions],
}

export const filterKeys = [...filterKeysLookupTable.omnisearch, ...filterKeysLookupTable.webSearch, 
                    ...filterKeysLookupTable.fileType, ...filterKeysLookupTable.fileExtension]

export type FilterKey = typeof filterKeys[number]

export default class HomeTabSearchBar {
    public activeFilter: SearchBarFilterType = 'default'
    public fileSuggester: HomeTabFileSuggester | OmnisearchSuggester | SurfingSuggester
    public activeExtEl: Writable<HTMLElement> = writable()
    public searchBarEl: Writable<HTMLInputElement> = writable()
    public suggestionContainerEl: Writable<HTMLElement> = writable()
    private filterKey: FilterKey = 'default'
    private unsubscribe?: () => void
    private signature = ''

    constructor(private plugin: HomeTab, public openFile: (file: TFile, newTab?: boolean) => void, public sourcePath = '',
        public openUrl: (url: string, newTab?: boolean) => void = (url, newTab) => { void plugin.openWebUrl(url, newTab) }) {}

    focusSearchbar(): void { get(this.searchBarEl)?.focus() }
    load(): void {
        this.updateActiveSuggester('default', false)
        this.signature = this.settingsSignature()
        this.unsubscribe = pluginSettingsStore.subscribe(() => {
            const signature = this.settingsSignature()
            if (signature !== this.signature) { this.signature = signature; this.refresh() }
        })
    }
    private settingsSignature(): string {
        const s = this.plugin.settings
        return JSON.stringify([s.language, s.omnisearch, s.markdownOnly, s.unresolvedLinks, s.maxResults, s.searchDelay, s.showShortcuts, s.selectionHighlight, s.showPath, s.showOmnisearchExcerpt])
    }
    refresh(): void {
        const input = get(this.searchBarEl)
        const value = input.value
        this.updateActiveSuggester(this.filterKey, false)
        input.value = value
        if (input.ownerDocument.activeElement === input) void this.fileSuggester.onInput()
    }
    destroy(): void {
        this.unsubscribe?.()
        this.unsubscribe = undefined
        this.fileSuggester?.destroy()
    }
    updateActiveSuggester(key: FilterKey, query = true): void {
        this.fileSuggester?.destroy()
        const app = this.plugin.app
        const filterEl = get(this.activeExtEl)
        let filter: SearchBarFilterType = 'default'
        for (const type of Object.keys(filterKeysLookupTable) as SearchBarFilterType[]) {
            if (filterKeysLookupTable[type].includes(key)) filter = type
        }
        if (filter === 'omnisearch' && !getOmnisearchApi(app, get(this.searchBarEl).ownerDocument.defaultView)) {
            new Notice(t('notice.omnisearchUnavailable')); filter = 'default'; key = 'default'
        }
        if (filter === 'webSearch' && !getCommunityPlugin(app, 'surfing')) {
            new Notice(t('notice.surfingUnavailable')); filter = 'default'; key = 'default'
        }
        this.filterKey = key
        this.activeFilter = filter
        filterEl.toggleClass('hide', filter === 'default')
        filterEl.setText(filter === 'fileType' || filter === 'fileExtension' ? key : filter === 'webSearch' ? 'Surfing' : 'Omnisearch')
        if (filter === 'webSearch') this.fileSuggester = new SurfingSuggester(app, this.plugin, this)
        else if (filter === 'omnisearch' || filter === 'default' && this.plugin.settings.omnisearch && getOmnisearchApi(app, get(this.searchBarEl).ownerDocument.defaultView))
            this.fileSuggester = new OmnisearchSuggester(app, this.plugin, this)
        else {
            this.fileSuggester = new HomeTabFileSuggester(app, this.plugin, this)
            if (filter === 'fileExtension' || filter === 'fileType') this.fileSuggester.setFileFilter(key as FileType | FileExtension)
        }
        if (query) this.fileSuggester.setInput('')
    }
}
