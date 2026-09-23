// 로컬 뉘앙스 힌트 — 턴당 2홉 금지. 팩 필드만.

export type ArcCoreChatNuanceHint = '' | 'irony' | 'joke';

const IRONY_RE = /참\s*잘(?:도|했)|그래\s*참|아이고\s*잘|잘도\s*했/;
const JOKE_RE = /ㅋㅋ+|ㅎㅎ+|농담|장난이야/;

export function hintArcCoreChatNuance(userText: string): ArcCoreChatNuanceHint {
  const text = userText.trim();
  if (!text) return '';
  if (IRONY_RE.test(text)) return 'irony';
  if (JOKE_RE.test(text)) return 'joke';
  return '';
}
