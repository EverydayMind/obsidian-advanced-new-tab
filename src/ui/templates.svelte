<script lang="ts">
    import { Keymap, type TFile } from "obsidian";
    import { i18n } from '../i18n';
    import type { TemplateManager } from "src/templates";

    export let templates: TFile[]
    export let status: string
    export let templateManager: TemplateManager

    function handleTemplateClick(event: MouseEvent, template: TFile): void {
        templateManager.createNoteFromTemplate(template, !!Keymap.isModEvent(event))
    }
</script>

<div class="advanced-new-tab-templates-container">
    <div class="advanced-new-tab-templates-title">
        {$i18n('section.templates')}
    </div>
    <div class="advanced-new-tab-templates-description">
        {$i18n('templates.description')}
    </div>
    <div class="advanced-new-tab-templates-links">
        {#if templates.length > 0}
            {#each templates as template (template.path)}
                <button class="advanced-new-tab-template-link" on:click={(event) => handleTemplateClick(event, template)}>
                    {template.basename}
                </button>
            {/each}
        {:else}
            <div class="advanced-new-tab-template-empty">
                {status || $i18n('templates.empty')}
            </div>
        {/if}
    </div>
</div>

<style>
    .advanced-new-tab-templates-container{
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

    .advanced-new-tab-templates-title{
        text-align: center;
        font-weight: 600;
        font-size: var(--font-ui-large);
        padding-bottom: 8px;
    }

    .advanced-new-tab-templates-links{
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 8px;
        margin: auto;
        max-width: 900px;
    }

    .advanced-new-tab-templates-description{
        color: var(--text-muted);
        font-size: var(--font-ui-small);
        text-align: center;
        padding-bottom: 10px;
    }

    .advanced-new-tab-template-link{
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        border-radius: var(--radius-m);
        padding: 6px 10px;
        cursor: pointer;
    }

    .advanced-new-tab-template-link:hover{
        background: var(--background-modifier-hover);
    }

    .advanced-new-tab-template-empty{
        color: var(--text-muted);
        font-size: var(--font-ui-small);
        text-align: center;
    }
 </style>
