import { getLinkpath, normalizePath, TFile, type App } from 'obsidian'
import type { MarkdownSearchFile, SearchFile } from '../suggester/fuzzySearch'
import { getExtensionFromFilename, getFileTypeFromExtension } from './getFileTypeUtils'

export function getImageFiles(app: App){
    let fileList: TFile[] = []
    app.vault.getFiles().forEach((file) => {
        if (getFileTypeFromExtension(file.extension) === 'image'){
            fileList.push(file)
        }
    })
    return fileList
}

export function getFileAliases(app: App, file: TFile): string[]{
    let aliases: string[] = []
    const rawAliases: string[] | string | undefined = app.metadataCache.getFileCache(file)?.frontmatter ? app.metadataCache.getFileCache(file)?.frontmatter?.aliases : undefined

    if(rawAliases instanceof Array){
        aliases.push(...rawAliases)
    }
    else if(typeof rawAliases === 'string'){
        rawAliases.replace('[', '').replace(']', '').split(',').forEach((alias: string) => {
            if (alias.length > 0){
                aliases.push(alias.trim())
            }
        })
    }

    return aliases
}

export function generateMarkdownSearchFile(app: App, file: TFile): MarkdownSearchFile{
    return {
        name: file.name,
        basename: file.basename,
        path: file.path,
        aliases: getFileAliases(app, file),
        isCreated: true,
        file: file,
    }
}

export function getMarkdownSearchFiles(app: App): MarkdownSearchFile[]{
    const files = app.vault.getMarkdownFiles()
    const fileList: MarkdownSearchFile[] = []
    
    files.forEach((f) => {
        fileList.push(generateMarkdownSearchFile(app, f))
    })

    return fileList
}

export function generateSearchFile(app: App, file: TFile): SearchFile{
    return {
        name: file.name,
        basename: file.basename,
        path: file.path,
        aliases: getFileAliases(app, file),
        isCreated: true,
        file: file,
        fileType: getFileTypeFromExtension(file.extension),
        extension: file.extension
    }
}

export function getUnresolvedLinkPath(app: App, cachedFilename: string, newFilePath?: boolean): string{
    const normalizedFilename = getLinkpath(cachedFilename)
    if(newFilePath && !normalizedFilename.includes('/')){
        const folder = app.fileManager.getNewFileParent('').path
        return normalizePath(folder === '/' ? normalizedFilename : `${folder}/${normalizedFilename}`)
    }
    return normalizePath(normalizedFilename)
}

export function getUnresolvedLinkBasename(cachedFilename: string): string{
    const normalizedPath = getLinkpath(cachedFilename)
    
    if(normalizedPath.includes('/')){
        const regexResult = normalizedPath.match(/.*\/(.*)/)
        return regexResult ? regexResult[1] : normalizedPath
    }
    return normalizedPath
}

export function generateMarkdownUnresolvedFile(app: App, cachedFilename: string): SearchFile{
    const filename = getExtensionFromFilename(cachedFilename) ? cachedFilename.replace('.md', '') : cachedFilename
    return {
        name: `${getUnresolvedLinkBasename(filename)}.md`,
        basename: getUnresolvedLinkBasename(filename),
        path: getUnresolvedLinkPath(app, `${filename}.md`, true),
        isCreated: false,
        isUnresolved: true,
        fileType: 'markdown',
        extension: 'md'
    }
}

export function getUnresolvedMarkdownFiles(app: App): SearchFile[]{
    const fileList: SearchFile[] = []
    const unresolvedLinkParents = app.metadataCache.unresolvedLinks
    const unresolvedFilenames: string[] = []
    Object.entries(unresolvedLinkParents).forEach(record => {
        Object.keys(record[1]).forEach(filename => {
            // md notes does not have any extension, even if the link is [[somefile.md]]
            if(!getExtensionFromFilename(filename) && !unresolvedFilenames.includes(filename)){
                unresolvedFilenames.push(filename)
            }
        })
    })
    unresolvedFilenames.forEach(filename => fileList.push(generateMarkdownUnresolvedFile(app, filename)))
    return fileList

}

export function getSearchFiles(app: App, unresolvedLinks?: boolean): SearchFile[]{
    const files = app.vault.getFiles()
    const fileList: SearchFile[] = []

    files.forEach(f => {
        fileList.push(generateSearchFile(app, f))
    })

    if(unresolvedLinks){
        fileList.push(... getUnresolvedMarkdownFiles(app))
    }

    return fileList
}

export function getParentFolderFromPath(filepath: string): string{
    // const regexResult = filepath.match(/.*\/([^\/]+)\//)
    const regexResult = filepath.match(/([^\/]+)\/[^\/]+\/*$/)
    return regexResult ? regexResult[1] : '/' 
}
