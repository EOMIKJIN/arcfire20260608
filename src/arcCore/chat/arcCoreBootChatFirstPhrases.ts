const START_PHRASES = new Set([
  '시작한다',
  '시작해',
  '시작',
  'start',
  'begin',
  'letsgo',
  "let'sgo",
]);

/** 선실행 화면에서만 가로챔. 허브/전투는 게이트 active=false. */
export function isArcCoreBootChatFirstStartPhrase(raw: string): boolean {
  const compact = raw.trim().toLowerCase().replace(/\s+/g, '').replace(/[.!?。]/g, '');
  return START_PHRASES.has(compact);
}
