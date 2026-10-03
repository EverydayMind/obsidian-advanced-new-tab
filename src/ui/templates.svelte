<script lang="ts">
    import { Keymap, type TFile } from "obsidian";
    import { i18n } from '../i18n';
    import type { TemplateManager } from "src/templates";

    export let templates: TFile[]
    export let status: string
    export let templateManager: TemplateManager

    function handleTemplateClick(event: MouseEvent, template: TFile): void {
        templateManager.createNoteFromTemplate(template, Keymap.isModEvent(event))
    }
</script>

<div class="home-tab-templates-container">
    <div class="home-tab-templates-title">
        {$i18n('section.templates')}
    </div>
    <div class="home-tab-templates-description">
        {$i18n('templates.description')}
    </div>
    <div class="home-tab-templates-links">
        {#if templates.length > 0}
            {#each templates as template (template.path)}
                <button class="home-tab-template-link" on:click={(event) => handleTemplateClick(event, template)}>
                    {template.basename}
                </button>
            {/each}
        {:else}
            <div class="home-tab-template-empty">
                {status || $i18n('templates.empty')}
            </div>
        {/if}
    </div>
</div>

<style>
    .home-tab-templates-container{
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

    .home-tab-templates-title{
        text-align: center;
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 8px;
    }

    .home-tab-templates-links{
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        margin: auto;
        max-width: 900px;
    }

    .home-tab-templates-description{
        color: var(--text-muted);
        font-size: var(--font-ui-small);
        text-align: center;
        padding-bottom: 10px;
    }

    .home-tab-template-link{
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        border-radius: var(--radius-m);
        padding: 6px 10px;
        cursor: pointer;
    }

    .home-tab-template-link:hover{
        background: var(--background-modifier-hover);
    }

    .home-tab-template-empty{
        color: var(--text-muted);
        font-size: var(--font-ui-small);
        text-align: center;
    }
 </style>
