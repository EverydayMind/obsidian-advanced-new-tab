import { isWithinFolder } from './pathUtils'

export function excludedRecentPath(path: string, folders: string): boolean {
    return folders.split('\n').map(folder => folder.trim()).filter(Boolean).some(folder => isWithinFolder(path, folder))
}

export function relativeTime(timestamp: number, language: string, now = Date.now()): string {
    const seconds = Math.round((timestamp - now) / 1000)
    const units = [[86400 * 365, 'year'], [86400 * 30, 'month'], [86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']] as const
    const [size, unit] = units.find(([size]) => Math.abs(seconds) >= size) ?? units[units.length - 1]
    return new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(Math.round(seconds / size), unit)
}
