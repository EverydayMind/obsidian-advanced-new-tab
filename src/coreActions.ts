import type { App } from 'obsidian'
import { executeAppCommand, getCorePlugin } from './integrations'
import type { MessageKey } from './i18n'

type CorePluginId = 'bases' | 'canvas' | 'webviewer'
export type CoreActionId = 'new-note' | CorePluginId
interface CoreAction {
    id: CoreActionId
    pluginId?: CorePluginId
    commandId: string
    label: MessageKey
    icon: string
}

// Use the commands from Obsidian's empty view so core creation/homepage settings
// and click modifiers have the same behavior as the built-in new tab.
const actions: CoreAction[] = [
    { id: 'new-note', commandId: 'file-explorer:new-file', label: 'action.newNote', icon: 'lucide-square-pen' },
    { id: 'bases', pluginId: 'bases', commandId: 'bases:new-file', label: 'action.newBase', icon: 'lucide-layout-list' },
    { id: 'canvas', pluginId: 'canvas', commandId: 'canvas:new-file', label: 'action.newCanvas', icon: 'lucide-layout-dashboard' },
    { id: 'webviewer', pluginId: 'webviewer', commandId: 'webviewer:open', label: 'action.openWebViewer', icon: 'globe-2' },
]

function isEnabled(app: App, action: CoreAction): boolean {
    // New note is a global command, independent of the File explorer plugin.
    return !action.pluginId || !!getCorePlugin(app, action.pluginId)
}

export function getEnabledCoreActions(app: App): CoreAction[] {
    return actions.filter(action => isEnabled(app, action))
}

export function executeCoreAction(app: App, id: CoreActionId, event?: Event): boolean {
    const action = actions.find(action => action.id === id)
    return !!action && isEnabled(app, action) && executeAppCommand(app, action.commandId, event)
}
