import type { BookmarkItem } from '../integrations'

// JSON-encoded title paths distinguish nested groups, including titles with '/'.
export function bookmarkGroups(items: BookmarkItem[], parent: string[] = []): { value: string; label: string; items: BookmarkItem[] }[] {
    return items.flatMap(item => {
        if (item.type !== 'group') return []
        const path = [...parent, item.title ?? '']
        return [{ value: JSON.stringify(path), label: path.join(' / '), items: item.items ?? [] }, ...bookmarkGroups(item.items ?? [], path)]
    })
}

export function selectedBookmarks(items: BookmarkItem[], group: string): BookmarkItem[] {
    return group ? bookmarkGroups(items).find(item => item.value === group)?.items ?? [] : items
}
