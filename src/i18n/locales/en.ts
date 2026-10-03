export const en = {
    'search.placeholder': 'Search files or enter a URL...',
    'section.bookmarks': 'Bookmarks',
    'section.recent': 'Recent files',
    'section.templates': 'New note from template',
    'templates.description': 'Creates a new note from a template. To apply a template to an existing note, run "Templates: Insert template" from the command palette.',
    'templates.empty': 'No templates available.',
    'action.dailyNote': "Open today's daily note",
    'action.newNote': 'New note',
    'action.openLink': 'Open link: {url}',
    'guide.palette': 'Open the command palette ({hotkey}) or type / in a note to access more features.',
    'command.open': 'Open in new tab',
    'command.replace': 'Replace current tab',
    'notice.templateFailed': 'Failed to create note from template.',
} as const
export type MessageKey = keyof typeof en
