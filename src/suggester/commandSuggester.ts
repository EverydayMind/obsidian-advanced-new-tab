import { AbstractInputSuggest, type App } from 'obsidian'
import { listAppCommands } from '../integrations'

type CommandChoice = { id: string; name: string }
export default class CommandSuggester extends AbstractInputSuggest<CommandChoice> {
    constructor(private commandApp: App, private input: HTMLInputElement) {
        super(commandApp, input)
        this.limit = 20
    }
    getSuggestions(query: string): CommandChoice[] {
        const term = query.trim().toLowerCase()
        return listAppCommands(this.commandApp).filter(command => `${command.name} ${command.id}`.toLowerCase().includes(term)).slice(0, this.limit)
    }
    renderSuggestion(command: CommandChoice, el: HTMLElement): void {
        el.createSpan({ text: command.name })
        el.createDiv({ text: command.id, cls: 'setting-item-description' })
    }
    selectSuggestion(command: CommandChoice): void {
        this.setValue(command.id)
        const InputEvent = this.input.ownerDocument.defaultView?.Event
        if (InputEvent) this.input.dispatchEvent(new InputEvent('input', { bubbles: true }))
        this.close()
    }
}
