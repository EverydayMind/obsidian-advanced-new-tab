<script lang="ts">
	import type { Suggester, TextInputSuggester, suggesterViewOptions } from '../suggester/suggester';

    export let options: suggesterViewOptions
    export let textInputSuggester: TextInputSuggester<unknown>

    let suggester: Suggester<unknown> = textInputSuggester.getSuggester()

    const suggestions = suggester.suggestionsStore
    const selectedItemIndex = suggester.selectedItemIndexStore
    function appendInfo(el: HTMLElement, node: HTMLElement) {
        el.appendChild(node)
        return { destroy() { node.remove() } }
    }

    const suggestionWrapper = suggester.suggestionsContainer

</script>

{#if $suggestions && $suggestions.length > 0}
    <div class="{options.containerClass ?? 'suggestion-container popover suggestion-popover'}" 
        role="listbox" tabindex="-1"
        on:mousedown="{(e) => e.preventDefault()}"
        >
        <div class="{options.suggestionClass ?? 'suggestion'} {options.additionalClasses ?? ''}" class:scrollable="{options.isScrollable}"
            bind:this={$suggestionWrapper}>
            {#each $suggestions as suggestion, index (suggestion)}
                <svelte:component this={textInputSuggester.getDisplayElementComponentType()}
                                {index} {suggestion} {textInputSuggester} selectedItemIndex={$selectedItemIndex}
                                {... textInputSuggester.getDisplayElementProps(suggestion)}/>
            {/each}
        </div>
        {#if options.additionalModalInfo}
            <div class="advanced-new-tab-suggester-additional-info" use:appendInfo={options.additionalModalInfo}></div>
        {/if}
    </div>
{/if}
    

<style>
    .scrollable{
        overflow-y: auto;
    }
</style>
