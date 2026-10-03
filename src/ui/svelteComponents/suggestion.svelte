<script lang="ts">
	import type { Suggester, TextInputSuggester } from "src/suggester/suggester";

    export let index: number
    // export let suggester: Suggester<any>
    export let textInputSuggester: TextInputSuggester<any>
    export let selectedItemIndex: number

    let suggester: Suggester<any> = textInputSuggester.getSuggester()

    export let suggestionItemClass: string | undefined = undefined
    export let suggestionContentClass: string | undefined = undefined
    export let suggestionTitleClass: string | undefined = undefined
    export let suggestionAuxClass: string | undefined = undefined

    function handlePrimaryAction(): void{
        textInputSuggester.useSelectedItem(suggester.getSelectedItem())
    }

    function handleSecondaryAction(): void{
        textInputSuggester.useSelectedItem(suggester.getSelectedItem(), true)
    }

    function handleKeydown(event: KeyboardEvent): void{
        if(event.key === 'Enter' || event.key === ' '){
            event.preventDefault()
            handlePrimaryAction()
        }
    }
</script>

<div class="{suggestionItemClass ?? 'suggestion-item mod-complex'}" 
    class:is-selected="{selectedItemIndex === index}"
    role="button"
    tabindex="0"
    on:mousemove="{() => suggester.setSelectedItemIndex(index)}"
    on:click="{handlePrimaryAction}"
    on:keydown="{handleKeydown}"
    on:auxclick="{(e) => {if(e.button === 1){handleSecondaryAction()}}}">
    <div class="{suggestionContentClass ?? 'suggestion-content'}">
        <div class="{suggestionTitleClass ?? 'suggestion-title'}">
            <slot name="suggestion-title"/>
        </div>
        <slot name="suggestion-extra-content"/>
    </div>
    <div class="{suggestionAuxClass ?? 'suggestion-aux'}">
        <slot name="suggestion-aux"/>
    </div>
</div>
