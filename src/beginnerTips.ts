import type { MessageKey } from './i18n/locales/en'

export interface BeginnerTip {
    id: string
    title: MessageKey
    body: MessageKey
    helpUrl: string
}

// Keep the catalog independent of Obsidian and the active display language.
export const BEGINNER_TIPS: readonly BeginnerTip[] = [
    { id: 'palette', title: 'tips.palette.title', body: 'tips.palette.body', helpUrl: 'https://obsidian.md/help/plugins/command-palette' },
    { id: 'slash', title: 'tips.slash.title', body: 'tips.slash.body', helpUrl: 'https://obsidian.md/help/plugins/slash-commands' },
    { id: 'pinnedCommands', title: 'tips.pinnedCommands.title', body: 'tips.pinnedCommands.body', helpUrl: 'https://obsidian.md/help/plugins/command-palette' },
    { id: 'hotkeys', title: 'tips.hotkeys.title', body: 'tips.hotkeys.body', helpUrl: 'https://obsidian.md/help/hotkeys' },
    { id: 'corePlugins', title: 'tips.corePlugins.title', body: 'tips.corePlugins.body', helpUrl: 'https://obsidian.md/help/plugins' },
    { id: 'quickSwitcher', title: 'tips.quickSwitcher.title', body: 'tips.quickSwitcher.body', helpUrl: 'https://obsidian.md/help/plugins/quick-switcher' },
    { id: 'linkNotes', title: 'tips.linkNotes.title', body: 'tips.linkNotes.body', helpUrl: 'https://obsidian.md/help/links' },
    { id: 'headingLinks', title: 'tips.headingLinks.title', body: 'tips.headingLinks.body', helpUrl: 'https://obsidian.md/help/links' },
    { id: 'embedNotes', title: 'tips.embedNotes.title', body: 'tips.embedNotes.body', helpUrl: 'https://obsidian.md/help/Linking+notes+and+files/Embed+files' },
    { id: 'backlinks', title: 'tips.backlinks.title', body: 'tips.backlinks.body', helpUrl: 'https://obsidian.md/help/plugins/backlinks' },
    { id: 'aliases', title: 'tips.aliases.title', body: 'tips.aliases.body', helpUrl: 'https://obsidian.md/help/aliases' },
    { id: 'headings', title: 'tips.headings.title', body: 'tips.headings.body', helpUrl: 'https://obsidian.md/help/syntax' },
    { id: 'formatting', title: 'tips.formatting.title', body: 'tips.formatting.body', helpUrl: 'https://obsidian.md/help/syntax' },
    { id: 'tasks', title: 'tips.tasks.title', body: 'tips.tasks.body', helpUrl: 'https://obsidian.md/help/syntax' },
    { id: 'lists', title: 'tips.lists.title', body: 'tips.lists.body', helpUrl: 'https://obsidian.md/help/syntax' },
    { id: 'callouts', title: 'tips.callouts.title', body: 'tips.callouts.body', helpUrl: 'https://obsidian.md/help/callouts' },
    { id: 'tags', title: 'tips.tags.title', body: 'tips.tags.body', helpUrl: 'https://obsidian.md/help/tags' },
    { id: 'nestedTags', title: 'tips.nestedTags.title', body: 'tips.nestedTags.body', helpUrl: 'https://obsidian.md/help/tags' },
    { id: 'vaultSearch', title: 'tips.vaultSearch.title', body: 'tips.vaultSearch.body', helpUrl: 'https://obsidian.md/help/plugins/search' },
    { id: 'searchFilters', title: 'tips.searchFilters.title', body: 'tips.searchFilters.body', helpUrl: 'https://obsidian.md/help/plugins/search' },
    { id: 'searchTasks', title: 'tips.searchTasks.title', body: 'tips.searchTasks.body', helpUrl: 'https://obsidian.md/help/plugins/search' },
    { id: 'bookmarks', title: 'tips.bookmarks.title', body: 'tips.bookmarks.body', helpUrl: 'https://obsidian.md/help/plugins/bookmarks' },
    { id: 'bookmarkSearch', title: 'tips.bookmarkSearch.title', body: 'tips.bookmarkSearch.body', helpUrl: 'https://obsidian.md/help/plugins/bookmarks' },
    { id: 'dailyNotes', title: 'tips.dailyNotes.title', body: 'tips.dailyNotes.body', helpUrl: 'https://obsidian.md/help/plugins/daily-notes' },
    { id: 'templates', title: 'tips.templates.title', body: 'tips.templates.body', helpUrl: 'https://obsidian.md/help/plugins/templates' },
    { id: 'templateVariables', title: 'tips.templateVariables.title', body: 'tips.templateVariables.body', helpUrl: 'https://obsidian.md/help/plugins/templates' },
    { id: 'outline', title: 'tips.outline.title', body: 'tips.outline.body', helpUrl: 'https://obsidian.md/help/plugins/outline' },
    { id: 'pagePreview', title: 'tips.pagePreview.title', body: 'tips.pagePreview.body', helpUrl: 'https://obsidian.md/help/plugins/page-preview' },
    { id: 'graph', title: 'tips.graph.title', body: 'tips.graph.body', helpUrl: 'https://obsidian.md/help/plugins/graph' },
    { id: 'canvas', title: 'tips.canvas.title', body: 'tips.canvas.body', helpUrl: 'https://obsidian.md/help/plugins/canvas' },
    { id: 'properties', title: 'tips.properties.title', body: 'tips.properties.body', helpUrl: 'https://obsidian.md/help/properties' },
    { id: 'bases', title: 'tips.bases.title', body: 'tips.bases.body', helpUrl: 'https://obsidian.md/help/bases' },
    { id: 'noteComposer', title: 'tips.noteComposer.title', body: 'tips.noteComposer.body', helpUrl: 'https://obsidian.md/help/plugins/note-composer' },
    { id: 'fileRecovery', title: 'tips.fileRecovery.title', body: 'tips.fileRecovery.body', helpUrl: 'https://obsidian.md/help/plugins/file-recovery' },
    { id: 'workspaces', title: 'tips.workspaces.title', body: 'tips.workspaces.body', helpUrl: 'https://obsidian.md/help/plugins/workspaces' },
    { id: 'readingView', title: 'tips.readingView.title', body: 'tips.readingView.body', helpUrl: 'https://obsidian.md/help/edit-and-read' },
]

let previousTipId: string | undefined

/** Choose once per standalone view; avoid an immediate repeat within this session. */
export function pickBeginnerTip(): BeginnerTip {
    const candidates = BEGINNER_TIPS.filter(tip => tip.id !== previousTipId)
    const tip = candidates[Math.floor(Math.random() * candidates.length)]
    previousTipId = tip.id
    return tip
}

