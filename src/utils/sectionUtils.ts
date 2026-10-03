export const SECTIONS = ['bookmarks', 'recent', 'templates'] as const
export type Section = typeof SECTIONS[number]
export function sectionOrder(value: string): Section[] {
    const chosen = value.split(',').filter((item): item is Section => SECTIONS.some(section => section === item))
    return [...new Set([...chosen, ...SECTIONS])]
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return [...items]
    const result = [...items]
    result.splice(to, 0, result.splice(from, 1)[0])
    return result
}
