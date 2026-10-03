<script lang="ts">
    import type Fuse from 'fuse.js'
	import type { TextInputSuggester } from "src/suggester/suggester";
	import type { SurfingItem } from 'src/suggester/surfingSuggester';
	import Suggestion from './suggestion.svelte';

    export let index: number
    export let textInputSuggester: TextInputSuggester<Fuse.FuseResult<SurfingItem>>
    export let selectedItemIndex: number
    export let suggestion: Fuse.FuseResult<SurfingItem>
    
    export let info: string

    let suggestionItem = suggestion.item
</script>

<Suggestion {index} {textInputSuggester} {selectedItemIndex}
    suggestionTitleClass={`suggestion-title advanced-new-tab-suggestion-title}`}>
    <!-- Site name -->
    <svelte:fragment slot="suggestion-title">
        <span>{suggestionItem.name}</span>
    </svelte:fragment>
    <svelte:fragment slot="suggestion-aux">
        <span class='advanced-new-tab-suggestion-tip'>{info}</span>
    </svelte:fragment>
    <!-- Site details -->
    <svelte:fragment slot="suggestion-extra-content">
        {#if suggestionItem.type != 'newUrl'}
            <span>{suggestionItem.url}</span>
        {/if}
    </svelte:fragment>
</Suggestion>
