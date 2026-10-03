# Advanced New Tab

빈 탭에서 파일 검색, 북마크·최근 파일 열기, 템플릿으로 새 노트 생성을 제공합니다.

**이 프로젝트는 [olrenso/obsidian-home-tab](https://github.com/olrenso/obsidian-home-tab)을 fork하여 작성했습니다.** 원저작자의 저작권 고지를 유지하며 MIT 라이선스로 배포합니다.

[English](README.md)

## 현재 상태

1.0.0 개발 중이며 커뮤니티 디렉터리 등록과 정식 릴리스는 아직 이루어지지 않았습니다. 최소 Obsidian 버전은 **1.13.0**입니다. 데스크톱·모바일 실제 앱 검증이 남아 있습니다.

홈 화면·설정·메뉴·안내 메시지는 앱 언어를 따르며 영어·한국어를 직접 선택할 수도 있습니다. 설정은 Obsidian 1.13의 검색 가능한 선언형 API를 사용합니다.

## 사용법

- 새 빈 탭을 자동으로 시작 화면으로 바꾸거나 명령어 팔레트·리본에서 직접 엽니다.
- 파일 이름과 별칭을 검색합니다. `md`, `image`, `pdf`, `canvas` 등의 필터 키를 입력하고 Tab을 누릅니다. 빈 입력에서 Backspace로 해제합니다.
- 방향키로 선택, Enter로 열기, Ctrl/Cmd+Enter로 새 탭에 열기, Shift+Enter로 새 노트를 생성합니다. 기본 전역 단축키는 지정하지 않습니다.
- HTTP(S) URL 또는 도메인을 입력하면 **Web viewer 코어 플러그인**으로 엽니다. 일반 선택은 현재 탭, Ctrl/Cmd 선택은 새 탭을 사용합니다. 데스크톱에서 Web viewer를 켜야 하며, 사용할 수 없으면 안내를 표시합니다. 기본·Omnisearch·Surfing 검색 모드 모두 같은 경로를 사용합니다.
- 북마크·최근 파일·템플릿·빠른 작업·안내문·리본 아이콘을 각각 표시하거나 숨길 수 있습니다.
- Omnisearch와 Surfing 선택 연동을 유지합니다.

## 빠른 작업과 섹션 순서

기본 새 노트·일일 노트 버튼에 사용자 지정 명령 또는 보관함 파일 바로가기를 추가할 수 있습니다. 설정의 사용자 지정 빠른 작업에서 명령을 검색하거나 파일을 선택하고 버튼 이름·아이콘 ID·새 탭 여부를 설정합니다. 목록을 끌어 순서를 바꾸거나 삭제 버튼으로 제거합니다. 대상 파일이나 명령을 사용할 수 없으면 안내합니다.

‘새 베이스’, ‘새 캔버스’, ‘웹 뷰어 열기’는 해당 코어 플러그인이 활성화된 경우에만 나타납니다. 기본 새 탭과 같은 코어 명령과 Ctrl/Cmd 입력을 사용하므로 파일 생성 설정과 웹 뷰어 홈페이지도 Obsidian 설정을 따릅니다. 새 노트 버튼의 문구는 ‘새 노트’입니다.

섹션 순서 목록에서 북마크·최근 파일·템플릿 순서를 바꿉니다. 중첩된 코어 북마크 그룹의 파일도 표시합니다. Advanced New Tab이 활성화된 동안 검색창으로 이동 명령을 사용할 수 있습니다.

## 템플릿

Templates 코어 플러그인의 폴더를 사용하거나 `Template folder override`에 직접 지정합니다. 템플릿을 클릭하면 새 노트를 생성하며 Ctrl/Cmd+클릭은 새 탭에 엽니다.

공개 Vault API로 파일을 생성합니다. `{{title}}`, `{{date}}`, `{{time}}`, `{{date:FORMAT}}`, `{{time:FORMAT}}`을 지원합니다. 날짜·시간 기본 형식은 Templates 설정을 따르며 없으면 `YYYY-MM-DD`, `HH:mm`입니다. 알 수 없는 변수는 유지하고 Templater 구문은 실행하지 않습니다.

**영어 UI에서도 기존 명명 규칙을 유지합니다.** 템플릿 이름에서 `template`·`템플릿`을 제거하고 ` 이름 (YYMMDD HHmm)`을 붙입니다. `사람 템플릿` → `사람 이름 (260414 1601).md`. 이름이 겹치면 숫자를 붙이고 `{{title}}`에는 최종 이름을 적용합니다.

`New note name format`과 `Words to strip from template name`으로 규칙을 변경할 수 있습니다. 이름 형식에는 `{{template}}`, `{{date:FORMAT}}`, `{{time:FORMAT}}`을 사용합니다. 빈 형식은 기존 규칙을 유지합니다.

## 노트에 검색창 넣기

````markdown
```advanced-new-tab
show bookmarked files
show recent files
```
````

`only search bar`로 제목·로고를 숨깁니다. 과거 옵션 `show starred files`도 북마크 표시 별칭으로 지원합니다.

뷰 타입은 `advanced-new-tab-view`, 블록 이름은 `advanced-new-tab`이며 CSS도 독립 네임스페이스를 사용합니다. 기존 노트의 `search-bar` 코드 펜스를 `advanced-new-tab`으로 바꾸세요. 원본 블록 이름은 Home tab·Harbor Tab에서 사용할 수 있도록 등록하지 않습니다. 기존 `home-tab-view` 레이아웃은 두 플러그인이 꺼져 있을 때만 이전합니다.

## 설치와 개발

현재 커뮤니티 설치 링크·정식 릴리스는 없습니다. 릴리스 공개 후 `main.js`, `manifest.json`, `styles.css`를 `.obsidian/plugins/advanced-new-tab/`에 복사하여 활성화합니다.

개발자는 `.nvmrc`의 Node 버전으로 `npm ci`, `npm run lint`, `npm test`, `npm run build`를 실행합니다. PowerShell 실행 정책 때문에 `npm`이 차단되면 `npm.cmd`를 사용합니다. 개발 빌드는 인접 `developmentVault`에 출력합니다.

UI는 Svelte 5의 기존 템플릿 문법과 공개 mount/unmount API를 사용합니다. 실제 DOM 테스트로 바인딩·언어 변경·빠른 작업 클릭·안전한 텍스트 강조·터치 선택을 검증합니다. TypeScript 소스에는 공식 Obsidian lint 규칙을 적용하고 Svelte lint·타입 검사도 실행합니다. 실제 앱 검증과 디렉터리 preview scan은 출시 전에 완료해야 합니다.

코어 플러그인 조회·명령 실행·Omnisearch 조회·Web viewer 뷰 식별자는 공개 SDK 계약이 없어 가용성을 확인하는 호환 계층에 모았습니다. Web viewer 경로는 설치된 Obsidian 1.14.4 코드와 모의 탐색 테스트로 확인했으며 최소 지원 버전의 실제 앱 검증이 남아 있습니다.

## 개인정보

텔레메트리와 자체 원격 검색 서비스는 없습니다. 로컬 검색과 노트 생성은 볼트 안에서 이루어집니다. 설정·최근 파일 경로·북마크 아이콘은 플러그인의 `data.json`에 저장합니다.

로고 이미지 URL을 지정하면 이미지 요청이 발생합니다. URL 열기·Surfing 검색은 선택한 웹사이트·검색 제공자에 접속합니다. Omnisearch·Surfing의 개인정보 처리는 해당 플러그인의 안내를 따릅니다.

## 기여와 보안

주요 변경은 이슈에서 먼저 논의하고 PR에 변경 이유와 검증 결과를 작성해 주세요. 노트 생성·연동 변경에는 회귀 테스트를 추가합니다. 번역은 `src/i18n/locales`에서 관리하며 없는 번역은 영어로 표시합니다. 저장되는 필터 키·블록 옵션은 번역하지 않습니다.

취약점은 비공개 취약점 신고 기능이 활성화되어 있으면 그 경로로 신고해 주세요. 비공개 경로가 없으면 공개 이슈에 재현 공격이나 개인 볼트 내용을 올리지 말고 비공개 연락 경로를 문의해 주세요.

## 출처와 라이선스

[olrenso/obsidian-home-tab](https://github.com/olrenso/obsidian-home-tab)을 fork하여 작성했습니다. Lorenzo의 Copyright (c) 2023 고지를 보존하고 변경분에 Copyright (c) 2026 everydaymind를 추가했습니다. [MIT 라이선스](LICENSE)가 적용됩니다.
