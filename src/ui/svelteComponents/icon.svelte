<script lang="ts">
    import { setIcon } from 'obsidian'
    export let name: string
    export let size: number | string = 24
    export let label: string | undefined = undefined

    function icon(el: HTMLElement, id: string) {
        setIcon(el, id)
        return { update(next: string) { setIcon(el, next) } }
    }
</script>

<span class="advanced-new-tab-icon" use:icon={name} style:--advanced-new-tab-icon-size={typeof size === 'number' ? `${size}px` : size}
    aria-label={label} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined}></span>

<style>
    .advanced-new-tab-icon { display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; }
    .advanced-new-tab-icon :global(svg) { width: var(--advanced-new-tab-icon-size); height: var(--advanced-new-tab-icon-size); }
</style>
