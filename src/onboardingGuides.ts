import { TFile, TFolder, type App } from 'obsidian'
import type HomeTab from './main'
import { ensureParentFolders, vaultPath } from './utils/pathUtils'

export const ONBOARDING_GUIDE_DIR = 'Obsidian Guide'
export const PRIMARY_ONBOARDING_GUIDE_PATH = `${ONBOARDING_GUIDE_DIR}/01_시작하기_기본화면과_마크다운.md`

export type OnboardingStep = 1 | 2 | 3 | 4

export interface OnboardingGuideNoteSpec {
    readonly step: OnboardingStep
    readonly path: string
    readonly title: string
    readonly content: string
}

export interface OnboardingSeedResult {
    readonly status: 'seeded' | 'adopted_existing_guides' | 'skipped_already_seeded' | 'skipped_disabled'
    readonly createdPaths: readonly string[]
    readonly existingPaths: readonly string[]
}

export interface OnboardingOpenResult {
    readonly status: 'opened_existing' | 'created_and_opened'
    readonly path: string
    readonly created: boolean
}

export interface OnboardingRestoreResult {
    readonly status: 'restored' | 'nothing_missing'
    readonly restoredPaths: readonly string[]
    readonly existingPaths: readonly string[]
}

const GUIDE_01 = `---
category: 옵시디언가이드
step: 1
tags:
  - 옵시디언입문
  - 마크다운기초
---

# 1단계: 기본 화면과 마크다운 익히기

Obsidian에 오신 것을 환영합니다! 이 노트는 직접 고쳐 보며 기본 조작과 마크다운 문법을 익히는 실습장입니다.

## 편집 보기와 읽기 보기 전환하기
- **\`Ctrl+E\`** (macOS는 \`Cmd+E\`)를 누르면 **글을 작성하는 편집 보기(Editing view)**와 **깔끔하게 읽는 읽기 보기(Reading view)**가 전환됩니다.
- 편집 보기 안에서도 서식을 즉시 보여주는 **라이브 프리뷰(Live Preview)**와 문법 기호를 그대로 보여주는 **소스 모드(Source mode)**를 전환할 수 있습니다.

## 자주 쓰는 마크다운 문법 5가지
1. **제목 나누기**: 줄 앞에 \`# \`, \`## \`, \`### \`를 붙이면 제목과 소제목이 됩니다.
2. **강조하기**: \`**굵게**\`, \`*기울임*\`, \`==형광펜 강조==\`처럼 감싸서 핵심 내용을 강조합니다.
3. **할 일 체크리스트**: 줄 앞에 \`- [ ] \`를 입력하면 클릭할 수 있는 체크 상자가 만들어집니다.
   - [x] 1단계 실습 가이드 노트 열기
   - [ ] \`Ctrl+E\`(또는 \`Cmd+E\`)로 편집 보기와 읽기 보기 전환해 보기
4. **콜아웃(Callout) 안내 상자**: 명령어 팔레트(\`Ctrl+P\` / \`Cmd+P\`)에서 **콜아웃 삽입(Insert callout)**을 실행하거나 아래처럼 작성합니다.

> [!TIP] 💡 직접 해보기: 아래 연습 공간에 문법을 입력해 보세요
> \`[!TIP]\` 대신 \`[!NOTE]\`, \`[!WARNING]\` 등으로 바꾸면 상자 모양과 색상이 달라집니다.

5. **마크다운 표(Table)**: \`|\` 기호로 열을 구분해 표를 만듭니다.

| 기능 | 문법 또는 기본 단축키 | 설명 |
| --- | --- | --- |
| 편집/읽기 전환 | \`Ctrl+E\` / \`Cmd+E\` | 편집 보기와 읽기 보기를 오갑니다 |
| 명령어 팔레트 | \`Ctrl+P\` / \`Cmd+P\` | 모든 명령을 이름으로 검색해 실행합니다 |
| 빠른 전환기 | \`Ctrl+O\` / \`Cmd+O\` | 노트 이름이나 별칭으로 파일을 빠르게 엽니다 |

---
다음 단계: [[Obsidian Guide/02_노트연결하기_위키링크와_백링크|다음: 위키링크와 백링크로 노트 연결하기]]
`

const GUIDE_02 = `---
category: 옵시디언가이드
step: 2
tags:
  - 옵시디언입문
  - 노트연결
---

# 2단계: 위키링크와 백링크로 노트 연결하기

Obsidian의 가장 큰 특징은 노트를 폴더 안에만 가두지 않고 **노트끼리 연결고리(\`[[위키링크]]\`)**를 만들어 생각의 그물망을 넓힐 수 있다는 점입니다.

## 1. 위키링크(\`[[...]]\`)와 제목 링크
- 에디터에서 \`[[\`를 입력하면 보관함의 다른 노트를 검색해 연결할 수 있습니다.
- \`|\` 기호를 쓰면 화면에 보이는 글자를 바꿀 수 있습니다:
  - [[Obsidian Guide/01_시작하기_기본화면과_마크다운|1단계 가이드 노트로 이동하기]]
- 노트 이름 뒤에 \`#\`을 입력하면 특정 제목(섹션)으로 바로 연결됩니다:
  - [[Obsidian Guide/01_시작하기_기본화면과_마크다운#편집 보기와 읽기 보기 전환하기|1단계의 편집/읽기 보기 설명으로 바로 가기]]

## 2. 다른 노트나 섹션 끼워넣기(Embed)
- 링크 앞에 느낌표(\`!\`)를 붙여 \`![[노트 이름#제목]]\`처럼 쓰면 다른 노트의 내용을 현재 노트 안에 바로 펼쳐 보여줍니다.

## 3. 연결을 돕는 코어 플러그인 3가지
1. **백링크(Backlinks)**: 오른쪽 사이드바에서 백링크 탭을 열면 **현재 노트를 가리키는 다른 노트 목록(연결된 언급)**과 아직 링크로 묶지 않은 **연결되지 않은 언급**을 한눈에 볼 수 있습니다.
2. **페이지 미리보기(Page preview)**: 편집기에서 \`Ctrl\`(macOS는 \`Cmd\`)을 누른 채 위키링크 위에 마우스를 올리면 문서를 열지 않고도 내용을 미리 볼 수 있습니다.
3. **그래프 보기(Graph view)**: 명령어 팔레트(\`Ctrl+P\` / \`Cmd+P\`)에서 **로컬 그래프 열기(Open local graph)**를 실행하면 현재 노트와 연결된 주변 노트들을 시각적인 지도로 확인할 수 있습니다.

---
이전 단계: [[Obsidian Guide/01_시작하기_기본화면과_마크다운|이전: 기본 화면과 마크다운]] | 다음 단계: [[Obsidian Guide/03_문서정리하기_속성과_태그_검색|다음: 속성과 태그, 코어 검색]]
`

const GUIDE_03 = `---
category: 옵시디언가이드
step: 3
status: 진행중
aliases:
  - 문서정리가이드
tags:
  - 옵시디언입문
  - 문서정리
---

# 3단계: 속성(Properties), 태그, 코어 검색으로 문서 정리하기

노트가 많아져도 **속성(Properties)**, **태그(\`#태그\`)**, **코어 검색(Search)**, **북마크(Bookmarks)**를 조합하면 원하는 문서를 언제든 즉시 찾을 수 있습니다.

## 1. 속성(Properties) — 문서 맨 위의 머리말 카드
- 이 노트 맨 위에는 \`category: 옵시디언가이드\`, \`step: 3\`, \`status: 진행중\`, \`aliases\`가 적힌 **속성(Properties)** 영역이 있습니다.
- 명령어 팔레트(\`Ctrl+P\` / \`Cmd+P\`)에서 **파일 속성 추가(Add file property)**를 실행해 작성일, 상태, 분류 등을 자유롭게 추가할 수 있습니다.
- **\`aliases\`(별칭)** 속성에 약칭을 적어 두면 \`[[\` 링크나 빠른 전환기(\`Ctrl+O\` / \`Cmd+O\`)에서 별칭으로도 이 노트를 찾을 수 있습니다.

## 2. 태그(\`#태그\`)와 태그 보기(Tags view)
- 본문 어디든 \`#회의\`, \`#아이디어\`처럼 태그를 붙일 수 있으며, \`#업무/회의\`, \`#업무/기획\`처럼 슬래시(\`/\`)로 **계층형 태그**를 만들 수 있습니다.
- **설정 → 코어 플러그인 → 태그 보기(Tags view)**를 켜면 사이드바에서 전체 태그 계층을 탐색할 수 있습니다.

## 3. 코어 검색(\`Ctrl+Shift+F\` / \`Cmd+Shift+F\`)과 북마크(Bookmarks)
- 왼쪽 사이드바의 **검색(Search)** 창에서 아래 검색 연산자를 직접 입력해 보세요:
  - \`path:"Obsidian Guide"\` — 특정 폴더 안의 노트만 검색
  - \`file:01_시작하기\` — 파일 이름에 특정 단어가 들어간 노트 검색
  - \`tag:#옵시디언입문\` — 특정 태그가 붙은 노트 검색
  - \`task-todo:\` — 아직 완료하지 않은 체크박스(\`- [ ]\`) 할 일만 검색
  - \`["category":옵시디언가이드]\` — 특정 속성값을 가진 노트 검색
- 자주 여는 노트나 자주 쓰는 검색 조건은 **북마크(Bookmarks)** 코어 플러그인에 등록해 두고 새 탭 화면에서 바로 열 수 있습니다.

---
이전 단계: [[Obsidian Guide/02_노트연결하기_위키링크와_백링크|이전: 위키링크와 백링크]] | 다음 단계: [[Obsidian Guide/04_코어플러그인_일일노트와_템플릿_베이스_캔버스|다음: 일일 노트·템플릿·베이스·캔버스]]
`

const GUIDE_04 = `---
category: 옵시디언가이드
step: 4
tags:
  - 옵시디언입문
  - 코어플러그인
---

# 4단계: 필수 코어 플러그인 — 일일 노트, 템플릿, 베이스, 캔버스

**설정 → 코어 플러그인(Core plugins)**에는 별도 설치 없이 바로 쓸 수 있는 강력한 기본 도구들이 들어 있습니다.

## 1. 빠른 전환기·명령어 팔레트·슬래시 명령
- **빠른 전환기(Quick switcher, \`Ctrl+O\` / \`Cmd+O\`)**: 노트 이름이나 별칭을 입력해 즉시 노트를 엽니다. 없는 이름을 입력하고 \`Shift+Enter\`를 누르면 새 노트를 만듭니다.
- **명령어 팔레트(Command palette, \`Ctrl+P\` / \`Cmd+P\`)**: 모든 명령을 검색해 실행하며, 자주 쓰는 명령은 팔레트 설정에서 상단에 고정(Pin)할 수 있습니다.
- **슬래시 명령(Slash commands)**: 코어 플러그인에서 켠 뒤 편집기 줄 시작에서 \`/\`를 입력하면 마우스 없이 명령을 고를 수 있습니다.

## 2. 일일 노트(Daily notes)와 템플릿(Templates)
- **일일 노트**: 버튼이나 명령 한 번으로 오늘 날짜의 노트를 열어 일지·메모·할 일을 꾸준히 기록합니다.
- **템플릿**: 자주 쓰는 문서 양식을 템플릿 폴더에 저장해 두고 새 노트에 삽입합니다. 코어 템플릿의 \`{{title}}\`, \`{{date}}\`, \`{{time}}\` 변수는 각각 현재 노트 제목, 오늘 날짜, 현재 시각으로 자동 치환됩니다.

## 3. 베이스(Bases)와 캔버스(Canvas)
- **베이스(Bases)**: 노트의 속성(\`category\`, \`status\` 등)을 표(Table)처럼 모아 필터링·정렬해 보는 코어 데이터베이스 뷰입니다. 새 탭의 **새 베이스** 버튼이나 명령어 팔레트에서 만들 수 있습니다.
- **캔버스(Canvas)**: 넓은 시각 보드 위에 여러 노트·텍스트 카드·이미지를 자유롭게 배치하고 화살표로 연결해 프로젝트를 기획하는 도구입니다.

## 4. 개요(Outline)와 파일 복구(File recovery)
- **개요**: 긴 노트의 제목(\`#\`, \`##\`) 목차를 사이드바에 보여주며, 클릭해 이동하거나 드래그해 문단 순서를 바꿀 수 있습니다.
- **파일 복구**: 로컬 스냅샷을 자동으로 보관하여 실수로 내용을 지웠을 때 **설정 → 파일 복구 → 스냅샷**에서 이전 버전을 되돌릴 수 있습니다.

---
이전 단계: [[Obsidian Guide/03_문서정리하기_속성과_태그_검색|이전: 속성과 태그, 코어 검색]] | 처음으로: [[Obsidian Guide/01_시작하기_기본화면과_마크다운|처음으로: 기본 화면과 마크다운]]
`

export const ONBOARDING_GUIDE_NOTES: readonly OnboardingGuideNoteSpec[] = [
    {
        step: 1,
        path: PRIMARY_ONBOARDING_GUIDE_PATH,
        title: '01_시작하기_기본화면과_마크다운',
        content: GUIDE_01,
    },
    {
        step: 2,
        path: `${ONBOARDING_GUIDE_DIR}/02_노트연결하기_위키링크와_백링크.md`,
        title: '02_노트연결하기_위키링크와_백링크',
        content: GUIDE_02,
    },
    {
        step: 3,
        path: `${ONBOARDING_GUIDE_DIR}/03_문서정리하기_속성과_태그_검색.md`,
        title: '03_문서정리하기_속성과_태그_검색',
        content: GUIDE_03,
    },
    {
        step: 4,
        path: `${ONBOARDING_GUIDE_DIR}/04_코어플러그인_일일노트와_템플릿_베이스_캔버스.md`,
        title: '04_코어플러그인_일일노트와_템플릿_베이스_캔버스',
        content: GUIDE_04,
    },
] as const

export class OnboardingGuideManager {
    private queue: Promise<void> = Promise.resolve()

    constructor(private app: App, private plugin: HomeTab) {}

    private enqueue<T>(task: () => Promise<T>): Promise<T> {
        const previous = this.queue
        const result = (async (): Promise<T> => {
            try {
                await previous
            } catch {
                // Keep queue alive after a failed operation.
            }
            return await task()
        })()
        this.queue = (async (): Promise<void> => {
            try {
                await result
            } catch {
                // Keep queue alive after a failed operation.
            }
        })()
        return result
    }

    seedIfNeeded(): Promise<OnboardingSeedResult> {
        return this.enqueue(() => this.runSeedIfNeeded())
    }

    openGuide(step: OnboardingStep = 1, newTab = false): Promise<OnboardingOpenResult> {
        return this.enqueue(() => this.runOpenGuide(step, newTab))
    }

    restoreMissingGuides(): Promise<OnboardingRestoreResult> {
        return this.enqueue(() => this.runRestoreMissingGuides())
    }

    private async runSeedIfNeeded(): Promise<OnboardingSeedResult> {
        if (!this.plugin.settings.showGuide) {
            return { status: 'skipped_disabled', createdPaths: [], existingPaths: [] }
        }
        if (this.plugin.settings.onboardingSeedState === 'complete') {
            return { status: 'skipped_already_seeded', createdPaths: [], existingPaths: [] }
        }

        if (this.plugin.settings.onboardingSeedState !== 'pending') {
            const existingBeforePending: string[] = []
            for (const spec of ONBOARDING_GUIDE_NOTES) {
                const path = vaultPath(spec.path)
                const existing = this.app.vault.getAbstractFileByPath(path)
                if (existing instanceof TFolder) {
                    throw new Error(`Guide path is a folder: ${path}`)
                }
                if (existing instanceof TFile) {
                    existingBeforePending.push(path)
                }
            }
            if (existingBeforePending.length > 0) {
                this.plugin.settings.onboardingSeedState = 'complete'
                await this.plugin.saveSettings()
                return {
                    status: 'adopted_existing_guides',
                    createdPaths: [],
                    existingPaths: existingBeforePending,
                }
            }
            this.plugin.settings.onboardingSeedState = 'pending'
            await this.plugin.saveSettings()
        }

        const createdPaths: string[] = []
        const existingPaths: string[] = []
        for (const spec of ONBOARDING_GUIDE_NOTES) {
            const { file, created } = await this.ensureGuideNoteFile(spec)
            if (created) createdPaths.push(file.path)
            else existingPaths.push(file.path)
        }

        this.plugin.settings.onboardingSeedState = 'complete'
        await this.plugin.saveSettings()
        return {
            status: 'seeded',
            createdPaths,
            existingPaths,
        }
    }

    private async runOpenGuide(step: OnboardingStep, newTab: boolean): Promise<OnboardingOpenResult> {
        const spec = ONBOARDING_GUIDE_NOTES.find(item => item.step === step) ?? ONBOARDING_GUIDE_NOTES[0]
        const { file, created } = await this.ensureGuideNoteFile(spec)
        await this.app.workspace.getLeaf(newTab ? 'tab' : false).openFile(file)
        return {
            status: created ? 'created_and_opened' : 'opened_existing',
            path: file.path,
            created,
        }
    }

    private async runRestoreMissingGuides(): Promise<OnboardingRestoreResult> {
        const restoredPaths: string[] = []
        const existingPaths: string[] = []
        for (const spec of ONBOARDING_GUIDE_NOTES) {
            const { file, created } = await this.ensureGuideNoteFile(spec)
            if (created) restoredPaths.push(file.path)
            else existingPaths.push(file.path)
        }

        if (this.plugin.settings.onboardingSeedState !== 'complete') {
            this.plugin.settings.onboardingSeedState = 'complete'
            await this.plugin.saveSettings()
        }

        return {
            status: restoredPaths.length > 0 ? 'restored' : 'nothing_missing',
            restoredPaths,
            existingPaths,
        }
    }

    private async ensureGuideNoteFile(spec: OnboardingGuideNoteSpec): Promise<{ file: TFile; created: boolean }> {
        const path = vaultPath(spec.path)
        const existing = this.app.vault.getAbstractFileByPath(path)
        if (existing instanceof TFile) {
            return { file: existing, created: false }
        }
        if (existing instanceof TFolder) {
            throw new Error(`Guide path is a folder: ${path}`)
        }
        await ensureParentFolders(this.app, path)
        try {
            const createdFile = await this.app.vault.create(path, spec.content)
            return { file: createdFile, created: true }
        } catch (error) {
            const concurrent = this.app.vault.getAbstractFileByPath(path)
            if (concurrent instanceof TFile) {
                return { file: concurrent, created: false }
            }
            throw error
        }
    }
}
