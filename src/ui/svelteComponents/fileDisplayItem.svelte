<script lang="ts">
    import Icon from './icon.svelte'
    import { type TFile, Keymap, type PaneType, type App, type Menu } from 'obsidian'
    import { getFileTypeFromExtension } from 'src/utils/getFileTypeUtils'
    import type { HomeTabSettings } from 'src/settings'
    import { createEventDispatcher } from 'svelte'
    import { i18n } from 'src/i18n'
    import { showHoverPreview } from '../../hoverPreview'
    export let app: App
    export let file: TFile
    export let pluginSettings: HomeTabSettings
    export let contextualMenu: Menu
    export let customIcon: string | undefined = undefined
    export let detail: string = ''
    const dispatch = createEventDispatcher<{ itemMenu: { file: TFile } }>()
    const icons: Record<string, string> = { markdown: 'file-text', image: 'file-image', video: 'file-video', audio: 'file-audio', pdf: 'file-chart-pie' }
    $: filename = file.basename
    $: icon = customIcon || icons[getFileTypeFromExtension(file.extension)] || 'file'
    function open(event: MouseEvent): void {
        const target: boolean | PaneType = event.button === 1 ? 'tab' : Keymap.isModEvent(event)
        void app.workspace.getLeaf(target).openFile(file)
    }
    function showMenu(event: MouseEvent): void {
        event.preventDefault()
        event.stopPropagation()
        dispatch('itemMenu', { file })
        contextualMenu.showAtMouseEvent(event)
    }
</script>

<div class="advanced-new-tab-file-item" class:use-accent-color={pluginSettings.selectionHighlight === 'accentColor'}>
    <button type="button" class="advanced-new-tab-file-item-open" on:mouseenter={event => showHoverPreview(app, file, event, pluginSettings.hoverPreview)} on:click={open} on:auxclick={event => { if (event.button === 1) open(event) }} on:contextmenu={showMenu}>
        <div class="advanced-new-tab-file-item-preview-icon"><Icon name={icon}/></div>
        <div class="advanced-new-tab-file-item-name">{filename}</div>
        {#if detail}<div class="advanced-new-tab-file-item-detail">{detail}</div>{/if}
    </button>
    <button type="button" class="advanced-new-tab-file-item-remove_btn" aria-label={$i18n('menu.fileOptions')} on:click={showMenu}>
        <Icon name="ellipsis"/>
    </button>
</div>

<style>
    .advanced-new-tab-file-item-detail { color: var(--text-muted); font-size: var(--font-ui-smaller); text-align: center; overflow-wrap: anywhere; }
    .advanced-new-tab-file-item{
        margin: 5px;
        padding: 5px;
        border-radius: var(--radius-m);
        /* height: 100px; */
        min-width: 75px;
        max-width: 125px;

        position: relative;
    }

    .advanced-new-tab-file-item-open {
        display: block; width: 100%; height: auto; padding: 0; border: 0;
        background: transparent; color: inherit; box-shadow: none;
    }
    .advanced-new-tab-file-item:focus-within .advanced-new-tab-file-item-remove_btn { opacity: 1; }
    .advanced-new-tab-file-item:hover{
        background-color: var(--background-modifier-hover);
    }
    .advanced-new-tab-file-item.use-accent-color:hover{
        color: var(--text-on-accent);
        background: var(--interactive-accent);
    }
    .advanced-new-tab-file-item-preview-icon{
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--size-2-3);
    }

    .advanced-new-tab-file-item-name{
        /* padding: var(--size-2-3); */
        text-align: center;
        font-size: var(--font-ui-small);

        /* Text trimming */
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
    }

    .advanced-new-tab-file-item-remove_btn{
        opacity: 0;
        position: absolute;
        top: 4px;
        right: 4px;
        border: 0;
        background: transparent;
        padding: 0;
    }

    .advanced-new-tab-file-item-remove_btn:hover,
    .advanced-new-tab-file-item-remove_btn:focus-visible{
        opacity: 1;
    }
</style>
