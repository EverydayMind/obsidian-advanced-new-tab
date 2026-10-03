import type { MessageKey } from './en'

export const ko: Partial<Record<MessageKey, string>> = {
    'search.placeholder': '파일 검색 또는 URL 입력...',
    'section.bookmarks': '북마크 열기',
    'section.recent': '최근 파일 열기',
    'section.templates': '템플릿으로 새 노트 쓰기',
    'templates.description': '템플릿에 맞춰 새 노트를 생성합니다. 기존 노트에 적용하려면 명령어 팔레트에서 "템플릿: 템플릿 삽입"을 실행하세요.',
    'templates.empty': '사용 가능한 템플릿이 없습니다.',
    'action.dailyNote': '오늘의 일일노트 열기',
    'action.newNote': '새 노트 쓰기',
    'action.openLink': '링크 열기: {url}',
    'guide.palette': '명령어 팔레트({hotkey})를 열거나 노트에 /를 입력하여 더 많은 기능을 이용할 수 있습니다.',
    'command.open': '새 탭에서 열기',
    'command.replace': '현재 탭 바꾸기',
    'notice.templateFailed': '템플릿으로 새 노트를 생성하지 못했습니다.',
}
