<script lang="ts">
	import Icon from './icon.svelte'
    import HighlightedText from './highlightedText.svelte'
    import type { HighlightPart } from 'src/utils/highlightUtils'
    import { i18n } from 'src/i18n'
	import type { ResultNoteApi } from "src/suggester/omnisearchSuggester";
	import type { TextInputSuggester } from "src/suggester/suggester";
	import { getExtensionFromFilename } from "src/utils/getFileTypeUtils";
	import Suggestion from "./suggestion.svelte";

    export let index: number
    export let textInputSuggester: TextInputSuggester<ResultNoteApi>
    export let selectedItemIndex: number

    export let suggestion: ResultNoteApi

    export let basename: HighlightPart[]
    export let excerpt: HighlightPart[]

    let fileExtension = getExtensionFromFilename(suggestion.path)
    let folderPath = suggestion.path.replace(`${suggestion.basename}.${fileExtension}`, '').slice(0, -1)
</script>

<Suggestion {index} {textInputSuggester} {selectedItemIndex}
    suggestionItemClass={'suggestion-item omnisearch-result'}
    suggestionContentClass={''}
    suggestionTitleClass={'omnisearch-result__title-container'}>
    <svelte:fragment slot="suggestion-title">
        <span class="omnisearch-result__title">
            <span>
                <Icon name={suggestion.url ? 'globe' : 'file'} size={15}/>
            </span>
            <!-- <span>{suggestion.basename}</span> -->
            <span><HighlightedText parts={basename}/></span>
            {#if !suggestion.url}<span class="omnisearch-result__extension">{`.${fileExtension}`}</span>{/if}
            {#if suggestion.matches.length > 0}
                <span class="omnisearch-result__counter">{$i18n(suggestion.matches.length === 1 ? 'search.match' : 'search.matches', { count: suggestion.matches.length })}</span>
            {/if}
        </span>
    </svelte:fragment>
    <svelte:fragment slot="suggestion-extra-content">
        <!-- File path -->
        {#if !suggestion.url && folderPath.length > 0}
            <div class="omnisearch-result__folder-path">
                <Icon name="folder-open" size={15}/>
                <span>{folderPath}</span>
            </div>
        {/if}
        <!-- File content -->
        <div class="omnisearch-result__body">
            <HighlightedText parts={excerpt}/>
        </div>
    </svelte:fragment>
</Suggestion>
