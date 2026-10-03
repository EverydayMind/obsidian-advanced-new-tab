import type { App, TFile } from 'obsidian'

export const HOVER_SOURCE = 'advanced-new-tab'

export function showHoverPreview(app: App, file: TFile, event: MouseEvent, enabled: boolean): void {
    if (!enabled || file.extension !== 'md') return
    app.workspace.trigger('hover-link', {
        event, source: HOVER_SOURCE, hoverParent: event.currentTarget,
        targetEl: event.currentTarget, linktext: file.path, sourcePath: '',
    })
}
