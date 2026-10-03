import type { LucideIcon } from './utils/lucideIcons'
import type { recentFileStore } from './recentFiles'
import type { bookmarkedFileStore } from './bookmarkedFiles'

type ColorChoices = 'default' | 'accentColor' | 'custom'
type LogoChoiches = 'default' | 'imagePath' | 'imageLink' | 'lucideIcon' | 'oldLogo' | 'none'
type FontChoiches = 'interfaceFont' | 'textFont' | 'monospaceFont' | 'custom'

interface ObjectKeys {
    [key: string]: unknown
}

export interface QuickAction extends ObjectKeys {
    kind: 'command' | 'file'
    label: string
    target: string
    icon: string
    newTab: boolean
}

interface logoStore extends ObjectKeys{
    lucideIcon: LucideIcon
    imagePath: string
    imageLink: string
}

export interface HomeTabSettings extends ObjectKeys{
    logoType: LogoChoiches
    logo: logoStore
    logoScale: number
    iconColor?: string
    iconColorType: ColorChoices
    wordmark: string
    customFont: FontChoiches
    font?: string
    fontSize: string
    fontColor?: string
    fontColorType: ColorChoices
    fontWeight: number
    maxResults: number
    showbookmarkedFiles: boolean
    showRecentFiles: boolean
    showTemplates: boolean
    maxRecentFiles: number
    storeRecentFile: boolean
    showPath: boolean
    selectionHighlight: ColorChoices
    showShortcuts: boolean
    markdownOnly: boolean
    unresolvedLinks: boolean
    recentFilesStore: recentFileStore[]
    bookmarkedFileStore: bookmarkedFileStore[]
    searchDelay: number
    replaceNewTabs: boolean
    newTabOnStart: boolean
    closePreviousSessionTabs: boolean
    omnisearch: boolean
    showOmnisearchExcerpt: boolean
    debugLogging: boolean
    language: 'auto' | 'en' | 'ko'
    templateFolderOverride: string
    newNoteNameFormat: string
    templateWordsToStrip: string
    showQuickActions: boolean
    showGuide: boolean
    showRibbonIcon: boolean
    quickActions: QuickAction[]
    sectionOrder: string
}

export const DEFAULT_SETTINGS: HomeTabSettings = {
    logoType: 'default',
    logo: {
        lucideIcon: '',
        imagePath: '',
        imageLink: '',},
    logoScale: 1.2,
    iconColorType: 'default',
    wordmark: 'Obsidian',
    customFont: 'interfaceFont',
    fontSize: '4em',
    fontColorType: 'default',
    fontWeight: 600,
    maxResults: 5,
    showbookmarkedFiles: false,
    showRecentFiles: false,
    showTemplates: false,
    maxRecentFiles: 5,
    storeRecentFile: true,
    showPath: true,
    selectionHighlight: 'default',
    showShortcuts: true,
    markdownOnly: false,
    unresolvedLinks: false,
    recentFilesStore: [],
    bookmarkedFileStore: [],
    searchDelay: 0,
    replaceNewTabs: true,
    newTabOnStart: false,
    closePreviousSessionTabs: false,
    omnisearch: false,
    showOmnisearchExcerpt: true,
    debugLogging: false,
    language: 'auto',
    templateFolderOverride: '',
    newNoteNameFormat: '',
    templateWordsToStrip: 'template, 템플릿',
    showQuickActions: true,
    showGuide: true,
    showRibbonIcon: true,
    quickActions: [],
    sectionOrder: 'bookmarks,recent,templates',
}
