import { mount, unmount, flushSync } from 'svelte'
import { FileView, MarkdownRenderChild, WorkspaceLeaf } from "obsidian";
import type HomeTab from "./main";
import Homepage from './ui/homepage.svelte'
import HomeTabSearchBar from "./homeTabSearchbar";

export const VIEW_TYPE = "advanced-new-tab-view";
export const CODE_BLOCK_TYPE = "advanced-new-tab";

export class EmbeddedHomeTab extends MarkdownRenderChild{
    searchBar: HomeTabSearchBar
    homepage?: ReturnType<typeof mount>
    plugin: HomeTab
    recentFiles: boolean | undefined
    bookmarkedFiles: boolean | undefined
    private unregisterCleanup?: () => void
    searchbarOnly: boolean | undefined

    constructor(containerEl: HTMLElement, plugin: HomeTab, codeBlockContent: string, sourcePath: string){
        super(containerEl)
        this.plugin = plugin

        this.parseCodeBlockContent(codeBlockContent)
        this.searchBar = new HomeTabSearchBar(plugin, (file, newTab) => {
            let target: WorkspaceLeaf | undefined
            plugin.app.workspace.iterateAllLeaves(leaf => {
                if (leaf.view.containerEl.contains(containerEl)) target = leaf
            })
            if (newTab) void plugin.app.workspace.getLeaf('tab').openFile(file)
            else if (target) void target.openFile(file)
            else void plugin.app.workspace.openLinkText(file.path, sourcePath, false)
        }, sourcePath, (url, newTab) => {
            let target: WorkspaceLeaf | undefined
            plugin.app.workspace.iterateAllLeaves(leaf => {
                if (leaf.view.containerEl.contains(containerEl)) target = leaf
            })
            void plugin.openWebUrl(url, newTab, target)
        })
    }

    onload(): void{
        this.unregisterCleanup = this.plugin.registerEmbeddedCleanup(() => this.unload())
        this.homepage = flushSync(() => mount(Homepage, {
            target: this.containerEl,
            props: {
                plugin: this.plugin,
                HomeTabSearchBar: this.searchBar,
                embeddedView: this
            }
        }))

        this.searchBar.load()
    }

    onunload(): void {
        this.unregisterCleanup?.()
        this.unregisterCleanup = undefined
        this.searchBar.destroy()
        if (this.homepage) void unmount(this.homepage)
        this.homepage = undefined
    }

    private parseCodeBlockContent(codeBlockContent: string){
        codeBlockContent.split('\n')
        .map((line: string) => line.trim())
        .forEach((line: string) => {
            switch (true) {
                case line === '':
                    break
                case line === 'only search bar':
                    this.searchbarOnly = true
                    break
                case line === 'show recent files':
                    this.recentFiles = true
                    break
                case line === 'show bookmarked files':
                case line === 'show starred files':
                    this.bookmarkedFiles = true
                    break
            }
        });
    }
}

export class HomeTabView extends FileView{
    plugin: HomeTab
    homepage?: ReturnType<typeof mount>
    searchBar: HomeTabSearchBar
    containerEl: HTMLElement

    constructor(leaf: WorkspaceLeaf, plugin: HomeTab) {
        super(leaf);
        this.leaf = leaf
        this.plugin = plugin
        this.navigation = true
        this.allowNoFile = true
        this.icon = 'search'

        this.searchBar = new HomeTabSearchBar(this.plugin,
            (file, newTab) => { void (newTab ? this.app.workspace.getLeaf('tab') : this.leaf).openFile(file) }, '',
            (url, newTab) => { void plugin.openWebUrl(url, newTab, this.leaf) })
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.plugin.manifest.name
    }

    async onOpen(): Promise<void> {
        this.plugin.templateManager?.refreshTemplates()
        this.homepage = flushSync(() => mount(Homepage, {
            target: this.contentEl,
            props:{
                plugin: this.plugin,
                HomeTabSearchBar: this.searchBar
            }
        }));
        this.searchBar.load()
        this.searchBar.focusSearchbar()

        // this.fileSuggester = new HomeTabFileSuggester(this.app, this.plugin, this,
            // get(this.searchBarEl), get(this.suggestionContainerEl))
    }

    async onClose(): Promise<void>{
        this.searchBar.destroy()
        if (this.homepage) void unmount(this.homepage)
        this.homepage = undefined
    }
}
