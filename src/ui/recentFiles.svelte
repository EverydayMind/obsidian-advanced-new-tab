<script lang="ts">
	import { Menu, View, type TFile } from "obsidian";
    import { i18n } from '../i18n';
	import type { RecentFileManager, recentFile } from "src/recentFiles";
	import type { HomeTabSettings } from "src/settings";
	import FileDisplayItem from "./svelteComponents/fileDisplayItem.svelte";

    export let view: View
    export let recentFileList: recentFile[]
    export let pluginSettings: HomeTabSettings
    export let recentFileManager: RecentFileManager
    const app = view.leaf.app

    let selectedFile: TFile

    let contextualMenu: Menu = new Menu()
            .addItem((item) => item
                .setTitle('Hide file')
                .setIcon('eye-off')
                .onClick(() => recentFileManager.removeRecentFile(selectedFile)))
            .setUseNativeMenu(app.vault.config.nativeMenus)
</script>

<div class="home-tab-recent-files-container">
    <div class="home-tab-recent-files-title">
        {$i18n('section.recent')}
    </div>
    <div class="home-tab-recent-files-wrapper">
        {#each recentFileList as recentFile (recentFile.file.path)}
            <FileDisplayItem file={recentFile.file} {app} {pluginSettings} {contextualMenu}
            on:itemMenu={(e) => selectedFile = e.detail.file}/>
        {/each}
    </div>
</div>

<style>
    .home-tab-recent-files-container{
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
    .home-tab-recent-files-title{
        text-align: center;
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 5px;
    }
    .home-tab-recent-files-wrapper{
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        margin: auto;
        width: 100%;
    }

    @media(max-width: 600px){
        .home-tab-recent-files-container{
            padding-bottom: 75px;
        }
    }
</style>
