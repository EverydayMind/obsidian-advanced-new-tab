<script lang="ts">
	import { Menu, type App, type TFile } from "obsidian";
    import { i18n } from '../i18n';
	import type { RecentFileManager, recentFile } from "src/recentFiles";
	import type { HomeTabSettings } from "src/settings";
	import FileDisplayItem from "./svelteComponents/fileDisplayItem.svelte";

    export let app: App
    export let recentFileList: recentFile[]
    export let pluginSettings: HomeTabSettings
    export let recentFileManager: RecentFileManager

    let selectedFile: TFile

    $: contextualMenu = new Menu()
            .addItem((item) => item
                .setTitle($i18n('menu.hideFile'))
                .setIcon('eye-off')
                .onClick(() => recentFileManager.removeRecentFile(selectedFile)))
</script>

<div class="advanced-new-tab-recent-files-container">
    <div class="advanced-new-tab-recent-files-title">
        {$i18n('section.recent')}
    </div>
    <div class="advanced-new-tab-recent-files-wrapper">
        {#each recentFileList as recentFile (recentFile.file.path)}
            <FileDisplayItem file={recentFile.file} {app} {pluginSettings} {contextualMenu}
            on:itemMenu={(e) => selectedFile = e.detail.file}/>
        {/each}
    </div>
</div>

<style>
    .advanced-new-tab-recent-files-container{
        width: 65%;
        max-width: 900px;
        display: flex;
        flex-direction: column;

        margin: 20px auto 0;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        border-radius: var(--radius-m);
        padding: 14px 16px;
    }
    .advanced-new-tab-recent-files-title{
        text-align: center;
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 5px;
    }
    .advanced-new-tab-recent-files-wrapper{
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        margin: auto;
        width: 100%;
    }

    @media(max-width: 600px){
        .advanced-new-tab-recent-files-container{
            padding-bottom: 75px;
        }
    }
</style>
