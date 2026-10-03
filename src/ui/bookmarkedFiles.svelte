<script lang="ts">
    import { onDestroy } from "svelte"
	import { type App, Menu, type TFile } from "obsidian";
    import { i18n } from '../i18n';
	import type { HomeTabSettings } from "src/settings";
	import { IconSelectionModal } from "src/iconSelectionModal";
	import FileDisplayItem from "./svelteComponents/fileDisplayItem.svelte";
	import type { bookmarkedFile, bookmarkedFilesManager } from "src/bookmarkedFiles";

    export let app: App
    export let bookmarkedFiles: bookmarkedFile[]
    export let pluginSettings: HomeTabSettings
    export let bookmarkedFileManager: bookmarkedFilesManager


    let selectedFile: TFile

    const selectIconModal: IconSelectionModal = new IconSelectionModal(app, undefined, (icon) => bookmarkedFileManager.updateFileIcon(selectedFile, icon))

    $: contextualMenu = new Menu()
            .addItem((item) => item
                .setTitle($i18n('menu.removeBookmark'))
                .setIcon('trash-2')
                .onClick(() => bookmarkedFileManager.removeBookmark(selectedFile)))
            .addSeparator()
            .addItem((item) => item
                .setTitle($i18n('menu.customIcon'))
                .setIcon('plus')
                .onClick(() => selectIconModal.open()))
    onDestroy(() => selectIconModal.close())
</script>

<div class="advanced-new-tab-bookmarked-section">
    <div class="advanced-new-tab-bookmarked-title">{$i18n('section.bookmarks')}</div>
    <div class="advanced-new-tab-bookmarked-files-container">
        {#each bookmarkedFiles as item (item.file.path)}
            <FileDisplayItem file={item.file} customIcon={item.iconId} {app} {pluginSettings} {contextualMenu}
            on:itemMenu={(e) => selectedFile = e.detail.file}/>
        {/each}
    </div>
</div>

<style>
    .advanced-new-tab-bookmarked-section{
        width: 65%;
        max-width: 900px;
        margin: 30px auto 0;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        border-radius: var(--radius-m);
        padding: 14px 16px;
    }
    .advanced-new-tab-bookmarked-title{
        text-align: center;
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 8px;
    }
    .advanced-new-tab-bookmarked-files-container{
        display: flex;
        align-items: baseline;
        justify-content: center;
        flex-wrap: wrap;
    }
</style>
