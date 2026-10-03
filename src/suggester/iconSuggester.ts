import { AbstractInputSuggest, getIconIds, setIcon, type App } from 'obsidian'

export default class IconSuggester extends AbstractInputSuggest<string> {
    private readonly input: HTMLInputElement

    constructor(app: App, input: HTMLInputElement) {
        super(app, input)
        this.input = input
        this.limit = 20
    }

    getSuggestions(query: string): string[] {
        const term = query.trim().toLowerCase()
        return getIconIds().filter(id => id.includes(term)).slice(0, this.limit)
    }

    renderSuggestion(id: string, el: HTMLElement): void {
        setIcon(el.createSpan({ cls: 'advanced-new-tab-icon' }), id)
        el.createSpan({ text: id })
    }

    selectSuggestion(id: string): void {
        this.setValue(id)
        const InputEvent = this.input.ownerDocument.defaultView?.Event
        if (InputEvent) this.input.dispatchEvent(new InputEvent('input', { bubbles: true }))
        this.close()
    }
}
