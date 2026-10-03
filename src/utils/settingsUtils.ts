/** Return independent settings, retaining newly added logo defaults on upgrade. */
export function mergeSettings<T extends { logo: object }>(defaults: T, stored?: Partial<T> | null): T {
    return structuredClone({
        ...defaults,
        ...stored,
        logo: { ...defaults.logo, ...stored?.logo },
    })
}
