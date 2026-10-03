// Inspired by Liam Cain's Periodic Notes suggester; see LICENSE.
import { Scope, type App, type EventRef, type Events } from 'obsidian'
import SuggesterView from '../ui/suggesterView.svelte'
import { get, writable, type Writable } from 'svelte/store'
import { mount, unmount, flushSync, type Component } from 'svelte'

export interface suggesterViewOptions {
    isScrollable?: boolean
    containerClass?: string
    suggestionClass?: string
    additionalClasses?: string
    additionalModalInfo?: HTMLElement
}

interface SuggestionController<T> {
    useSelectedItem(item: T): void
    scrollSelectedItemIntoView(): void
}

export class Suggester<T> {
    suggestionsContainer: Writable<HTMLElement> = writable()
    suggestionsStore = writable<T[]>([])
    selectedItemIndexStore = writable(0)

    constructor(controller: SuggestionController<T>, scope: Scope) {
        for (const [key, delta] of [['ArrowUp', -1], ['ArrowDown', 1]] as const) {
            scope.register([], key, event => {
                event.preventDefault()
                this.setSelectedItemIndex(this.getSelectedItemIndex() + delta)
                controller.scrollSelectedItemIntoView()
            })
        }
        scope.register([], 'Enter', event => {
            event.preventDefault()
            const item = this.getSelectedItem()
            if (item !== undefined) controller.useSelectedItem(item)
        })
    }

    setSuggestions(items: T[]): void { this.selectedItemIndexStore.set(0); this.suggestionsStore.set(items) }
    getSuggestions(): T[] { return get(this.suggestionsStore) }
    getSelectedItem(): T | undefined { return this.getSuggestions()[this.getSelectedItemIndex()] }
    getSelectedItemIndex(): number { return get(this.selectedItemIndexStore) }
    getSuggestionByIndex(index: number): T | undefined { return this.getSuggestions()[index] }
    setSelectedItemIndex(index: number): void {
        const length = this.getSuggestions().length
        this.selectedItemIndexStore.set(length ? (index % length + length) % length : 0)
    }
}

export abstract class TextInputSuggester<T> {
    protected scope: Scope
    protected suggester: Suggester<T>
    private view?: ReturnType<typeof mount>
    private requestId = 0
    private destroyed = false
    private timer?: number
    private readonly cleanups: (() => void)[] = []
    private readonly inputListener: () => void
    private readonly blurListener: () => void

    constructor(protected app: App, protected inputEl: HTMLInputElement,
        protected suggestionParentContainer: HTMLElement, protected viewOptions: suggesterViewOptions = {}, searchDelay = 0) {
        this.scope = new Scope(app.scope)
        this.suggester = new Suggester(this, this.scope)
        this.inputListener = () => {
            this.cancelTimer()
            // Invalidate an earlier request as soon as input changes, before debounce.
            this.requestId++
            if (searchDelay) this.timer = inputEl.ownerDocument.defaultView?.setTimeout(() => { void this.onInput() }, searchDelay)
            else void this.onInput()
        }
        this.blurListener = () => this.close()
        inputEl.addEventListener('input', this.inputListener)
        inputEl.addEventListener('focus', this.inputListener)
        inputEl.addEventListener('blur', this.blurListener)
        this.scope.register([], 'Escape', () => this.close())
    }

    protected trackEvent(emitter: Events, ref: EventRef): void { this.cleanups.push(() => emitter.offref(ref)) }
    protected onOpen(): void {}
    protected onClose(): void {}
    private cancelTimer(): void {
        if (this.timer !== undefined) this.inputEl.ownerDocument.defaultView?.clearTimeout(this.timer)
        this.timer = undefined
    }

    async onInput(): Promise<void> {
        if (this.destroyed) return
        const requestId = ++this.requestId
        try {
            const items = await this.getSuggestions(this.inputEl.value)
            if (this.destroyed || requestId !== this.requestId) return
            if (items.length) { this.suggester.setSuggestions(items); this.open() }
            else this.onNoSuggestion()
        } catch (error) {
            if (this.destroyed || requestId !== this.requestId) return
            console.error('[advanced-new-tab] Search failed', error)
            this.close()
        }
    }

    onNoSuggestion(): void { this.close() }
    open(): void {
        if (this.destroyed) return
        if (!this.view) {
            this.app.keymap.pushScope(this.scope)
            this.view = flushSync(() => mount(SuggesterView, { target: this.suggestionParentContainer, props: { textInputSuggester: this, options: this.viewOptions } }))
        }
        this.onOpen()
    }
    close(): void {
        this.requestId++
        this.cancelTimer()
        if (this.view) {
            this.app.keymap.popScope(this.scope)
            void unmount(this.view)
            this.view = undefined
        }
        this.suggester.setSuggestions([])
        this.onClose()
    }
    destroy(): void {
        if (this.destroyed) return
        this.destroyed = true
        this.close()
        this.inputEl.removeEventListener('input', this.inputListener)
        this.inputEl.removeEventListener('focus', this.inputListener)
        this.inputEl.removeEventListener('blur', this.blurListener)
        this.cleanups.splice(0).forEach(cleanup => cleanup())
    }
    scrollSelectedItemIntoView(): void {
        get(this.suggester.suggestionsContainer)?.children[this.suggester.getSelectedItemIndex()]?.scrollIntoView({ block: 'nearest' })
    }
    getSuggester(): Suggester<T> { return this.suggester }
    setInput(input: string): void {
        this.inputEl.value = input
        const InputEvent = this.inputEl.ownerDocument.defaultView?.Event
        if (InputEvent) this.inputEl.dispatchEvent(new InputEvent('input'))
    }
    abstract getSuggestions(input: string): T[] | Promise<T[]>
    abstract useSelectedItem(item: T, newTab?: boolean): void
    abstract getDisplayElementProps(item: T): object
    abstract getDisplayElementComponentType(): Component
}
