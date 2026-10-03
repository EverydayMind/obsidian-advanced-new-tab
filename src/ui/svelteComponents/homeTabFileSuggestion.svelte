<script lang="ts">
    import type Fuse from 'fuse.js'
	import Icon from './icon.svelte'
    import { i18n } from 'src/i18n'
    import type { SearchFile } from "src/suggester/fuzzySearch";
	import type { TextInputSuggester } from "src/suggester/suggester";
	import Suggestion from './suggestion.svelte';

    export let index: number
    export let textInputSuggester: TextInputSuggester<Fuse.FuseResult<SearchFile>>
    export let selectedItemIndex: number
    export let suggestion: Fuse.FuseResult<SearchFile>

    export let nameToDisplay: string
    export let filePath: string | undefined = undefined

    let suggestionItem = suggestion.item
</script>

<Suggestion {index} {textInputSuggester} {selectedItemIndex}
    suggestionTitleClass={`suggestion-title advanced-new-tab-suggestion-title ${suggestionItem.isUnresolved ? 'is-unresolved' : ''}`}>
    <!-- File name (or alias) -->
    <svelte:fragment slot="suggestion-title">
        <span>{nameToDisplay}</span>
        {#if suggestionItem.fileType != 'markdown'}
            <div class="nav-file-tag advanced-new-tab-suggestion-file-tag">
                {suggestionItem.extension}
            </div>
        {/if}
    </svelte:fragment>
    <!-- File details -->
    <svelte:fragment slot="suggestion-extra-content">
        {#if suggestionItem.isCreated}
            <!-- If the suggestion name is an alias display the actual filename under it -->
            {#if suggestionItem.aliases && suggestionItem.aliases?.includes(nameToDisplay)}
                <div class="advanced-new-tab-suggestion-description">
                    <Icon name="forward" size={15} label={$i18n('search.alias')}/>
                    <span>{suggestionItem.basename}</span>
                </div>
            {/if}
        {/if}
    </svelte:fragment>
    <svelte:fragment slot="suggestion-aux">
        <!-- Display if a file is not created -->
        {#if !suggestionItem.isCreated}
            <div class="advanced-new-tab-suggestion-tip">
                {#if suggestionItem.isUnresolved}
                    <Icon name="file-plus" size={15} label={$i18n('search.create')}/>
                {:else}
                    <Icon name="file-question" size={15} label={$i18n('search.create')}/>
                    <div class="suggestion-hotkey">
                        <span>{$i18n('search.enterCreate')}</span>
                    </div>
                {/if}
            </div>
        {/if}
        <!-- Add file path -->
        {#if (suggestionItem.isCreated || suggestionItem.isUnresolved) && filePath}
            <div class="advanced-new-tab-suggestion-filepath" aria-label={$i18n('search.filePath')}>
                <Icon name="folder" size={15}/>
                <span class="advanced-new-tab-file-path">{filePath}</span>
            </div>
        {/if}
    </svelte:fragment>
</Suggestion>
