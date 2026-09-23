// 채팅으로 지정한 진입 전투 — 모듈 스칼라 1개. 스토어·틱·persist 없음.
// 기존 웨이브 엔진만 재사용. CSV/점유를 덮어쓰지 않는다.

type ChatArmedWavePending = {
  planetId: string;
  atMs: number;
};

const CHAT_ARMED_WAVE_TTL_MS = 30 * 60_000;

let pending: ChatArmedWavePending | null = null;

export function markChatArmedWavePending(planetId: string): void {
  const id = planetId.trim();
  if (!id) return;
  pending = { planetId: id, atMs: Date.now() };
}

export function isChatArmedWavePending(planetId: string): boolean {
  const id = planetId.trim();
  if (!id || !pending) return false;
  if (pending.planetId !== id) return false;
  if (Date.now() - pending.atMs > CHAT_ARMED_WAVE_TTL_MS) {
    pending = null;
    return false;
  }
  return true;
}

export function consumeChatArmedWavePending(planetId: string): void {
  const id = planetId.trim();
  if (!id || !pending) return;
  if (pending.planetId !== id) return;
  pending = null;
}

export function clearChatArmedWavePending(): void {
  pending = null;
}
