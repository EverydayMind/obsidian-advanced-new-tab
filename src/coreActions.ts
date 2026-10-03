import type { App } from 'obsidian'
import { executeAppCommand, getCorePlugin } from './integrations'
import type { MessageKey } from './i18n'

export type CoreActionId = 'bases' | 'canvas' | 'webviewer'
interface CoreAction {
    pluginId: CoreActionId
    commandId: string
    label: MessageKey
    icon: string
}

// Use the commands from Obsidian's empty view so core creation/homepage settings
// and click modifiers have the same behavior as the built-in new tab.
const actions: CoreAction[] = [
    { pluginId: 'bases', commandId: 'bases:new-file', label: 'action.newBase', icon: 'lucide-layout-list' },
    { pluginId: 'canvas', commandId: 'canvas:new-file', label: 'action.newCanvas', icon: 'lucide-layout-dashboard' },
    { pluginId: 'webviewer', commandId: 'webviewer:open', label: 'action.openWebViewer', icon: 'globe-2' },
]

export function getEnabledCoreActions(app: App): CoreAction[] {
    return actions.filter(action => !!getCorePlugin(app, action.pluginId))
}

export function executeCoreAction(app: App, id: CoreActionId, event?: Event): boolean {
    const action = actions.find(action => action.pluginId === id)
    return !!action && !!getCorePlugin(app, id) && executeAppCommand(app, action.commandId, event)
}
