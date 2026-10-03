# Advanced New Tab

A start page for empty Obsidian tabs, with fuzzy file search, bookmarks, recent files, and notes created from templates.

**This project was created by forking [olrenso/obsidian-home-tab](https://github.com/olrenso/obsidian-home-tab).** It continues under the MIT License with the original copyright preserved.

[한국어 안내](README.ko.md)

## Status and compatibility

Version 1.0.0 is under development and has not yet been submitted to the community directory. Requires Obsidian **1.13.0 or later**. Desktop and mobile compatibility still need manual verification before release.

The home page follows the Obsidian language, with English and Korean overrides. Settings and some auxiliary messages currently remain in English; translation and declarative settings migration are in progress.

## Features

- Replace empty tabs automatically, or open the page from the command palette or ribbon.
- Fuzzy search over vault filenames and aliases, with file type and extension filters.
- Optional unresolved-link suggestions that create the missing note.
- Bookmarks, recent files, and templates in separate sections.
- Quick actions to create a blank note or open today's daily note.
- HTTP(S) links and domain names offer an Open link action in local search.
- Customize logo, title, font, search result count, and delay.
- Toggle bookmarks, recent files, templates, quick actions, guide text, and ribbon visibility.
- Optional Omnisearch and Surfing integrations remain supported.
- Embed search inside a Markdown note.

## Search and keyboard controls

Type a filter key and press Tab. Press Backspace with an empty input to clear the filter.

| File type | Extensions |
| --- | --- |
| markdown | md |
| image | png, jpg, jpeg, svg, gif, bmp |
| video | mp4, webm, ogv, mov, mkv |
| audio | mp3, wav, m4a, ogg, 3gp, flac |
| pdf | pdf |
| canvas | canvas |

Use arrow keys to navigate, Enter to open, Ctrl/Cmd+Enter to open in a new tab, and Shift+Enter to create a note. No global hotkeys are assigned by default; bind commands in Obsidian settings if desired.

An Open link suggestion opens the website through the application's window API. Web viewer routing depends on Obsidian and its settings and still requires desktop QA; mobile normally opens an external browser. Bare filenames such as Note.md are treated as notes. Use an explicit https:// URL for ambiguous hostnames.

## Templates

Enable Show templates and configure the core Templates plugin, or set Template folder override. Markdown files in the folder and subfolders are listed. Clicking creates a note; Ctrl/Cmd+click opens it in a new tab.

Notes are created directly with the public Vault API. Variables supported are `{{title}}`, `{{date}}`, `{{time}}`, `{{date:FORMAT}}`, and `{{time:FORMAT}}`. Date/time defaults follow Templates settings when available, otherwise YYYY-MM-DD and HH:mm. Moment format tokens are supported. Unknown variables remain unchanged; Templater expressions are not evaluated.

The default naming rule is identical in every UI language: remove template / 템플릿 from the basename, then append ` 이름 (YYMMDD HHmm)`. For example, `Person template` creates `Person 이름 (260414 1601).md`. An empty base uses 노트. Name collisions receive numeric suffixes; `{{title}}` contains the final numbered title.

New note name format and Words to strip from template name can override this rule. Naming tokens include `{{template}}`, `{{date:FORMAT}}`, and `{{time:FORMAT}}`. An empty format preserves the existing rule. Invalid filename characters are replaced with hyphens.

## Embedded search

````markdown
```search-bar
show bookmarked files
show recent files
```
````

`only search bar` hides the title/logo area. `show starred files` is accepted as a legacy alias for `show bookmarked files`.

The view type, block identifier, and CSS namespace are still shared with the upstream plugin. Their migration is a release blocker; do not enable both plugins simultaneously during this development stage.

## Installation and development

A community listing and downloadable release are not available yet. After release, copy main.js, manifest.json, and styles.css into `.obsidian/plugins/advanced-new-tab/` and enable the plugin.

Use the Node version in .nvmrc:

```sh
npm ci
npm test
npm run build
```

On Windows PowerShell, use npm.cmd if npm.ps1 is blocked by the execution policy. Production writes main.js and styles.css to the repository root. `npm run dev` writes those assets and manifest.json to the sibling developmentVault under the manifest ID. Build outputs are distributed as release attachments.

Use `npm version <x.y.z> --no-git-tag-version` to prepare compatibility metadata. Create the first release tag only after release QA.

## Privacy

There is no telemetry or built-in remote search service. Vault search and note creation run locally. Settings, recent-file paths, and bookmark icons are stored in the plugin's data.json inside the vault.

A configured logo image URL causes an image request when the page is rendered. Opening a URL or using Surfing accesses the chosen website/search provider. Omnisearch and Surfing are separate plugins with their own behavior and privacy policies.

## Contributing and translations

Discuss substantial changes in an issue, or submit a pull request with an explanation and relevant verification. Run npm ci, npm test, and npm run build. Add focused regression coverage for note creation and integration changes. Release plans and agent instructions are local documents and are not part of this repository.

Locale dictionaries live in src/i18n/locales. English defines the keys; missing translations fall back to English. Settings and remaining messages are still being migrated. Do not translate persisted filter keys or block options.

## Security reports

Use GitHub private vulnerability reporting when enabled on this repository. If no private reporting channel is available, request a private contact route from the maintainer without posting exploit details or private vault contents in a public issue.

## Credits and license

Forked from [olrenso/obsidian-home-tab](https://github.com/olrenso/obsidian-home-tab), originally authored by Lorenzo. Copyright (c) 2023 Lorenzo; modifications Copyright (c) 2026 everydaymind. The [MIT License](LICENSE) applies. The original license notice is also available in plugin settings.
