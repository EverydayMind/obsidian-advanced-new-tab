import { getCommunityPlugin } from './integrations'
import { PluginSettingTab, getIconIds, type SettingControl, type SettingDefinition, type SettingDefinitionItem } from 'obsidian'
import type HomeTab from './main'
import { DEFAULT_SETTINGS } from './settingsData'
import { t, type MessageKey } from './i18n'
import IconSuggester from './suggester/iconSuggester'
import { parseWebUrl } from './utils/urlUtils'
import { MIT_LICENSE_TEXT } from './licenses'
import CommandSuggester from './suggester/commandSuggester'
import { moveItem, sectionOrder } from './utils/sectionUtils'
import { listAppCommands } from './integrations'

export { DEFAULT_SETTINGS, type HomeTabSettings } from './settingsData'

const structuralKeys = new Set(['language', 'newTabOnStart', 'omnisearch', 'showRecentFiles', 'logoType', 'iconColorType', 'customFont', 'fontColorType'])
const searchKeys = new Set(['omnisearch', 'markdownOnly', 'unresolvedLinks', 'maxResults', 'searchDelay', 'showShortcuts', 'selectionHighlight', 'showPath', 'showOmnisearchExcerpt'])

export class HomeTabSettingTab extends PluginSettingTab {
    declare plugin: HomeTab

    getControlValue(key: string): unknown {
        if (key.startsWith('quickActions.')) {
            const [, index, field] = key.split('.')
            return this.plugin.settings.quickActions[Number(index)]?.[field]
        }
        if (key.startsWith('logo.')) return this.plugin.settings.logo[key.slice(5)]
        return this.plugin.settings[key]
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        // Nested controls must never replace or mutate DEFAULT_SETTINGS.logo.
        if (key.startsWith('quickActions.')) {
            const [, index, field] = key.split('.')
            const action = this.plugin.settings.quickActions[Number(index)]
            if (!action) return
            action[field] = value
            if (field === 'kind') { action.target = ''; this.update() }
        }
        else if (key.startsWith('logo.')) this.plugin.settings.logo[key.slice(5)] = value
        else this.plugin.settings[key] = value
        if (key === 'maxRecentFiles') this.plugin.recentFileManager?.onNewMaxListLenght(value as number)
        await this.plugin.saveSettings()
        if (key === 'templateFolderOverride' || key === 'language') this.plugin.templateManager?.refreshTemplates()
        if (searchKeys.has(key)) this.plugin.refreshOpenViews()
        if (structuralKeys.has(key)) this.update()
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        const s = this.plugin.settings
        const control = (key: string, type: SettingControl['type'], extra: Record<string, unknown> = {}, visible?: () => boolean): SettingDefinition => ({
            name: t(`settings.${key}` as MessageKey),
            desc: t(`settings.${key}.desc` as MessageKey),
            visible,
            control: { type, key, defaultValue: key.startsWith('logo.') ? DEFAULT_SETTINGS.logo[key.slice(5)] : DEFAULT_SETTINGS[key], ...extra } as SettingControl,
        })
        const toggle = (key: string, visible?: () => boolean) => control(key, 'toggle', {}, visible)
        const slider = (key: string, min: number, max: number, step: number, visible?: () => boolean) => control(key, 'slider', { min, max, step }, visible)
        const options = (items: string[]) => Object.fromEntries(items.map(item => [item, t(`option.${item}` as MessageKey)]))
        const colors = options(['default', 'accentColor', 'custom'])
        const group = (name: string, items: SettingDefinition[]): SettingDefinitionItem => ({ type: 'group', heading: t(`group.${name}` as MessageKey), items })
        return [
            group('general', [
                control('language', 'dropdown', { options: options(['auto', 'en', 'ko']) }),
                toggle('replaceNewTabs'), toggle('newTabOnStart'),
                toggle('closePreviousSessionTabs', () => s.newTabOnStart), toggle('showRibbonIcon'), toggle('debugLogging'),
            ]),
            group('search', [
                toggle('omnisearch', () => !!getCommunityPlugin(this.app, 'omnisearch')),
                toggle('markdownOnly', () => !s.omnisearch), toggle('unresolvedLinks', () => !s.omnisearch),
                toggle('showPath'), toggle('showShortcuts'), slider('maxResults', 1, 25, 1), slider('searchDelay', 0, 500, 10),
                toggle('showOmnisearchExcerpt', () => !!getCommunityPlugin(this.app, 'omnisearch')),
            ]),
            group('sections', [
                toggle('showbookmarkedFiles'), toggle('showRecentFiles'), toggle('showTemplates'), toggle('showQuickActions'), toggle('showGuide'),
                toggle('storeRecentFile', () => s.showRecentFiles), slider('maxRecentFiles', 1, 25, 1, () => s.showRecentFiles),
            ]),
            {
                type: 'list', heading: t('settings.sectionOrder'),
                items: sectionOrder(s.sectionOrder).map(section => ({ name: t(`section.${section}` as MessageKey) })),
                onReorder: (from, to) => { void this.setControlValue('sectionOrder', moveItem(sectionOrder(s.sectionOrder), from, to).join(',')).then(() => this.update()) },
            },
            {
                type: 'list', heading: t('group.quickActions'), emptyState: t('actions.empty'),
                onReorder: (from, to) => { s.quickActions = moveItem(s.quickActions, from, to); void this.plugin.saveSettings().then(() => this.update()) },
                onDelete: index => { s.quickActions.splice(index, 1); void this.plugin.saveSettings().then(() => this.update()) },
                addItem: { name: t('actions.add'), action: () => {
                    s.quickActions.push({ kind: 'command', label: '', target: '', icon: '', newTab: false })
                    void this.plugin.saveSettings().then(() => this.update())
                } },
                items: s.quickActions.map((action, index) => ({
                    type: 'page', name: action.label || t('actions.number', { number: index + 1 }),
                    items: [
                        { name: t('actions.kind'), control: { type: 'dropdown', key: `quickActions.${index}.kind`, options: { command: t('actions.command'), file: t('actions.file') } } },
                        { name: t('actions.label'), control: { type: 'text', key: `quickActions.${index}.label` } },
                        { name: t('actions.icon'), control: { type: 'text', key: `quickActions.${index}.icon`, validate: value => !value || getIconIds().includes(value) ? undefined : t('validation.icon') } },
                        action.kind === 'file'
                            ? { name: t('actions.target'), control: { type: 'file', key: `quickActions.${index}.target`, validate: value => !value || this.app.vault.getFileByPath(value) ? undefined : t('validation.file') } }
                            : { name: t('actions.target'), desc: t('actions.commandHint'), render: setting => {
                                let suggester: CommandSuggester
                                setting.addSearch(text => {
                                    text.setValue(action.target).onChange(value => {
                                        text.inputEl.setCustomValidity(!value || listAppCommands(this.app).some(command => command.id === value) ? '' : t('validation.command'))
                                        if (text.inputEl.validity.valid) void this.setControlValue(`quickActions.${index}.target`, value)
                                    })
                                    suggester = new CommandSuggester(this.app, text.inputEl)
                                })
                                return () => suggester?.close()
                            } },
                        { name: t('actions.newTab'), visible: () => action.kind === 'file', control: { type: 'toggle', key: `quickActions.${index}.newTab` } },
                    ],
                })),
            },
            group('templates', [
                control('templateFolderOverride', 'folder'), control('newNoteNameFormat', 'text'), control('templateWordsToStrip', 'text'),
            ]),
            group('appearance', [
                control('logoType', 'dropdown', { options: { default: t('option.defaultLogo'), ...options(['oldLogo', 'imagePath', 'imageLink', 'lucideIcon', 'none']) } }),
                control('logo.imagePath', 'file', {
                    filter: (file: { extension: string }) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp'].includes(file.extension.toLowerCase()),
                    validate: (value: string) => !value || this.app.vault.getFileByPath(value) ? undefined : t('validation.file'),
                }, () => s.logoType === 'imagePath'),
                control('logo.imageLink', 'text', { validate: (value: string) => !value || /^https?:\/\//i.test(value) && parseWebUrl(value) ? undefined : t('validation.url') }, () => s.logoType === 'imageLink'),
                {
                    name: t('settings.logo.lucideIcon'), desc: t('settings.logo.lucideIcon.desc'), visible: () => s.logoType === 'lucideIcon',
                    render: setting => {
                        let suggester: IconSuggester
                        setting.addSearch(text => {
                            text.setValue(s.logo.lucideIcon).onChange(value => {
                                text.inputEl.setCustomValidity(!value || getIconIds().includes(value) ? '' : t('validation.icon'))
                                if (text.inputEl.validity.valid) void this.setControlValue('logo.lucideIcon', value)
                            })
                            suggester = new IconSuggester(this.app, text.inputEl)
                        })
                        return () => suggester?.close()
                    },
                },
                control('iconColorType', 'dropdown', { options: colors }, () => s.logoType === 'lucideIcon'),
                control('iconColor', 'color', { defaultValue: '#000000' }, () => s.logoType === 'lucideIcon' && s.iconColorType === 'custom'),
                slider('logoScale', 0.3, 3, 0.1), control('wordmark', 'text'),
                control('customFont', 'dropdown', { options: options(['interfaceFont', 'textFont', 'monospaceFont', 'custom']) }),
                control('font', 'text', {
                    validate: (value: string) => !value || this.containerEl.ownerDocument.defaultView?.CSS.supports('font-family', value) ? undefined : t('validation.font'),
                }, () => s.customFont === 'custom'),
                control('fontSize', 'text', {
                    validate: (value: string) => this.containerEl.ownerDocument.defaultView?.CSS.supports('font-size', value) ? undefined : t('validation.size'),
                }),
                slider('fontWeight', 100, 900, 100), control('fontColorType', 'dropdown', { options: colors }),
                control('fontColor', 'color', { defaultValue: '#000000' }, () => s.fontColorType === 'custom'),
                control('selectionHighlight', 'dropdown', { options: options(['default', 'accentColor']) }),
            ]),
            group('licenses', [{
                name: t('license.source'), desc: t('license.credit'),
                render: setting => {
                    const el = setting.controlEl.createDiv({ cls: 'advanced-new-tab-license' })
                    el.createEl('a', { text: t('license.repository'), href: 'https://github.com/olrenso/obsidian-home-tab', attr: { target: '_blank', rel: 'noopener noreferrer' } })
                    const details = el.createEl('details')
                    details.createEl('summary', { text: t('license.notice') })
                    details.createEl('pre', { text: MIT_LICENSE_TEXT })
                },
            }]),
        ]
    }
}
