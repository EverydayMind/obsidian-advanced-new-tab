import { Modal, Setting, getIconIds, type App } from 'obsidian'
import IconSuggester from './suggester/iconSuggester'
import type { LucideIcon } from './utils/lucideIcons'
import { t } from './i18n'

export class IconSelectionModal extends Modal {
    private icon: string
    private suggester?: IconSuggester

    constructor(app: App, defaultIcon: LucideIcon | undefined, private onSubmit: (icon: LucideIcon) => void) {
        super(app)
        this.icon = defaultIcon ?? ''
    }

    onOpen(): void {
        this.setTitle(t('modal.iconTitle'))
        const choice = new Setting(this.contentEl).setName(t('modal.chooseIcon')).setDesc(t('modal.iconDescription'))
        choice.addSearch(text => {
            text.setValue(this.icon).setPlaceholder(t('modal.search')).onChange(value => {
                this.icon = value
                text.inputEl.setCustomValidity(getIconIds().includes(value) ? '' : t('validation.icon'))
            })
            this.suggester = new IconSuggester(this.app, text.inputEl)
        })
        new Setting(this.contentEl)
            .addButton(button => button.setButtonText(t('modal.close')).onClick(() => this.close()))
            .addButton(button => button.setButtonText(t('modal.setIcon')).setCta().onClick(() => {
                if (!getIconIds().includes(this.icon)) return
                this.onSubmit(this.icon)
                this.close()
            }))
    }

    onClose(): void {
        this.suggester?.close()
        this.suggester = undefined
        this.contentEl.empty()
    }
}
