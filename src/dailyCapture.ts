import { moment, TFile, type App } from 'obsidian'
import type momentFactory from 'moment'
import type HomeTab from './main'
import { getDailyNoteOptions } from './integrations'
import { appendCapture } from './utils/captureUtils'
import { ensureParentFolders, vaultPath } from './utils/pathUtils'
import { renderTemplateContent } from './utils/templateUtils'

export class DailyCapture {
    private queue: Promise<void> = Promise.resolve()
    constructor(private app: App, private plugin: HomeTab) {}

    capture(input: string, now = (moment as unknown as typeof momentFactory)()): Promise<void> {
        const task = () => this.write(input, now)
        const result = this.queue.then(task, task)
        this.queue = result.catch(() => {})
        return result
    }

    private async write(input: string, now: momentFactory.Moment): Promise<void> {
        if (!input.trim()) return
        const options = getDailyNoteOptions(this.app)
        if (!options || !this.plugin.settings.captureEnabled) throw new Error('Daily capture is unavailable')
        const path = vaultPath(`${options.folder}/${now.format(options.format)}.md`)
        const heading = this.plugin.settings.captureHeading
        // Validate before creating folders or notes.
        appendCapture('', input, heading)
        const existing = this.app.vault.getAbstractFileByPath(path)
        if (existing instanceof TFile) {
            await this.app.vault.process(existing, content => appendCapture(content, input, heading))
            return
        }
        if (existing) throw new Error('Daily note path is not a file')
        let content = ''
        if (options.template) {
            const templatePath = vaultPath(options.template)
            const template = this.app.vault.getFileByPath(templatePath) ?? this.app.vault.getFileByPath(`${templatePath}.md`)
            if (!template) throw new Error('Daily note template not found')
            content = renderTemplateContent(await this.app.vault.cachedRead(template), path.split('/').pop().slice(0, -3), now)
        }
        await ensureParentFolders(this.app, path)
        try { await this.app.vault.create(path, appendCapture(content, input, heading)) }
        catch (error) {
            const concurrent = this.app.vault.getFileByPath(path)
            if (!concurrent) throw error
            await this.app.vault.process(concurrent, data => appendCapture(data, input, heading))
        }
    }
}
