<script lang="ts">
	import { Platform } from "obsidian";
    import { i18n } from '../i18n';
	import { filterKeys, type FilterKey } from "src/homeTabSearchbar";
    import type SearchBarController from "src/homeTabSearchbar";
    
    export let HomeTabSearchBar: SearchBarController
    export let embedded: boolean = false
    const searchBarEl = HomeTabSearchBar.searchBarEl
    const activeExtEl = HomeTabSearchBar.activeExtEl
    const container = HomeTabSearchBar.suggestionContainerEl
    const isPhone = Platform.isPhone

    let inputValue = ''

    function handleKeydown(e: KeyboardEvent): void{
        if (e.key === 'Enter' && e.altKey && HomeTabSearchBar.captureEnabled) {
            e.preventDefault()
            e.stopImmediatePropagation()
            void HomeTabSearchBar.captureInput()
            return
        }
        // If the input field is empty and a filter is active remove it
        if(e.key === 'Backspace'){
            if(inputValue != '') return
            if(HomeTabSearchBar.activeFilter){
                HomeTabSearchBar.updateActiveSuggester('default')
                // this.fileSuggester = new HomeTabFileSuggester(this.plugin.app, this.plugin, this.view, this)
                // this.fuzzySearch.updateSearchArray(this.files)
                // this.activeFilterEl.toggleClass('hide', true)
            }
        }

        if(e.key === 'Tab'){
            e.preventDefault()
            const key = inputValue.toLowerCase()
            // Activate search filter with tab
            if(filterKeys.find(item => item === key)){
                HomeTabSearchBar.updateActiveSuggester(key as FilterKey)
            }
        }
    }

</script>

<div class="advanced-new-tab-searchbar-container" bind:this={$container}>
    <div class="advanced-new-tab-searchbar"
        class:embedded={embedded}
        style:width={embedded || isPhone ? "90%" : "50%"}>
        <div class='nav-file-tag advanced-new-tab-suggestion-file-tag hide' bind:this={$activeExtEl}></div>
        <input type="search" spellcheck="false" placeholder={$i18n('search.placeholder')} bind:value={inputValue} bind:this={$searchBarEl}
        on:keydown={(e) => handleKeydown(e)}>
    </div>
</div>

<style>
    .advanced-new-tab-searchbar-container{
        display: flex;
        align-items: center;
        flex-direction: column;
    }
    
    .advanced-new-tab-searchbar{
        display: flex;
        /* width: 50%; */
        min-width: 250px;
        max-width: 700px;
        margin: 0 auto;

        height: calc(var(--input-height)*1.25);

        background-color: var(--background-modifier-form-field);
        border: var(--input-border-width) solid var(--background-modifier-border);
        padding: var(--size-2-3);
        border-radius: var(--input-radius);
        outline: none;
    }

    .advanced-new-tab-searchbar input{
        width: 100%;
        height: 100%;
        box-shadow: none;
        font-size: var(--font-ui-medium);
        background: none;
        border: none;
        padding-left: 12px;
    }
    .advanced-new-tab-searchbar input:hover{
        background: none;
        border: none;
    }

    .advanced-new-tab-suggestion-file-tag.hide{
        display: none;
    }
</style>

<!--     .advanced-new-tab-searchbar{
        display: flex;
        align-items: center;
        justify-content: center;
        height: calc(var(--input-height)*1.25);
    }

    .advanced-new-tab-searchbar input{
        width: 50%;
        min-width: 250px;
        max-width: 700px;
        display: inline-block;
        margin: 0 auto;
        height: 100%;
        box-shadow: none;
        padding: 6px 18px;
        font-size: var(--font-ui-medium);
    }

    .advanced-new-tab-searchbar input:focus, .advanced-new-tab-searchbar input:active{
        border-color: var(--background-modifier-border);
    }
 -->
