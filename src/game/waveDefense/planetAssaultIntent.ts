// ============================================================
// 행성 공격 진입 intent — worldmap [전투] 버튼 → 행성 허브 웨이브 전투 1-shot 플래그.
//
// RED 점유 성계에서 [전투]를 누르면 이동중 인스턴스 전투가 아니라
// 「행성 진입(착륙과 동일) → 허브 → 웨이브 카운트다운 → 승리 시 중립화」로
// 이어져야 한다(대표님 지시 2026-07-20). 이 모듈은 그 진입 의도를
// 라우트 전환(worldmap → planet) 너머로 전달하는 단일 정본이다.
//
// 메모리: 모듈 스칼라 1개 — 스토어·구독·타이머 없음. TTL로 stale 방어.
// ============================================================

type PlanetAssaultIntent = {
  planetId: string;
  atMs: number;
};

/** 진입 후 웨이브 시작까지 걸릴 수 있는 최대 여유(대사·로딩 포함) */
const ASSAULT_INTENT_TTL_MS = 5 * 60_000;

let intent: PlanetAssaultIntent | null = null;

/** worldmap [전투] 탭 시 1회 마킹 — 허브 진입 직전에 호출 */
export function markPlanetAssaultIntent(planetId: string): void {
  const id = planetId?.trim();
  if (!id) return;
  intent = { planetId: id, atMs: Date.now() };
}

/** 해당 행성의 공격 진입 intent가 살아있는지(TTL 내) */
export function isPlanetAssaultIntentActive(planetId: string): boolean {
  const id = planetId?.trim();
  if (!id || !intent) return false;
  if (intent.planetId !== id) return false;
  if (Date.now() - intent.atMs > ASSAULT_INTENT_TTL_MS) {
    intent = null;
    return false;
  }
  return true;
}

/** 웨이브 종료·행성 이탈 시 해제 */
export function clearPlanetAssaultIntent(): void {
  intent = null;
}
