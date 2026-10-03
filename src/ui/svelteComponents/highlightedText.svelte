<script lang="ts">
    import type { HighlightPart } from 'src/utils/highlightUtils'
    export let parts: HighlightPart[]
</script>

{#each parts as part}
    {#if part.match}<span class="suggestion-highlight">{part.text}</span>{:else}{part.text}{/if}
{/each}
