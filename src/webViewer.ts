import { Platform, type App, type WorkspaceLeaf } from 'obsidian'
import { getCorePlugin } from './integrations'
import { parseWebUrl } from './utils/urlUtils'

export type WebViewerResult = 'opened' | 'unavailable' | 'invalid'

/** Web viewer's view/state names are internal; workspace navigation uses public APIs.
 * Confirmed against the locally installed Obsidian 1.14.4 core implementation.
 */
export async function openInWebViewer(app: App, input: string, newTab = false, currentLeaf?: WorkspaceLeaf): Promise<WebViewerResult> {
    const url = parseWebUrl(input)
    if (!url) return 'invalid'
    if (!Platform.isDesktop || !getCorePlugin(app, 'webviewer')) return 'unavailable'
    const leaf = newTab ? app.workspace.getLeaf('tab') : currentLeaf ?? app.workspace.getLeaf(false)
    await leaf.setViewState({ type: 'webviewer', active: true, state: { url, navigate: true } })
    return 'opened'
}
