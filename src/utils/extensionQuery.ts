export type ExtensionQuery =
    | { kind: 'none' }
    | { kind: 'dot'; ext: string }
    | { kind: 'bare'; ext: string }
    | { kind: 'suffix'; ext: string; text: string }

const EXT_PATTERN = /^[a-z0-9]{2,6}$/

/**
 * Interpret a search query as an extension query.
 * `knownExtensions` holds lowercase extensions of the searchable files; unknown extensions
 * never match so ordinary queries (e.g. "v1.25") keep their normal behaviour.
 */
export function parseExtensionQuery(query: string, knownExtensions: ReadonlySet<string>): ExtensionQuery {
    const trimmed = query.trim()
    const known = (ext: string) => EXT_PATTERN.test(ext) && knownExtensions.has(ext)

    const dot = /^\.([^\s.]+)$/.exec(trimmed)
    if (dot) {
        const ext = dot[1].toLowerCase()
        return known(ext) ? { kind: 'dot', ext } : { kind: 'none' }
    }
    const bare = trimmed.toLowerCase()
    if (known(bare)) return { kind: 'bare', ext: bare }

    const suffix = /^(.*\S)\s*\.([^\s.]+)$/.exec(trimmed)
    if (suffix) {
        const ext = suffix[2].toLowerCase()
        if (known(ext)) return { kind: 'suffix', ext, text: suffix[1].trim() }
    }
    return { kind: 'none' }
}
