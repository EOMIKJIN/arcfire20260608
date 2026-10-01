// ============================================================
// 허브 메인스테이지 교전 vs 분쟁 차례 웨이브 — 동시 점유 금지 게이트.
//
// 전투 3축 (같은 캔버스, 시드·승패만 갈라짐 · Skia/틱 공유):
//   A 일반(허브) — combat 함장 또는 hub_orbit 퀘스트 1척. 승리는 점유를 안 바꿈.
//   B 웨이브 — 분쟁/어썰트/엔드. 승리만 성계 중립화(점유 변경).
//   C 항로 — dest-org 확률 + 앵커 없는 tq 보장. 점유 무관.
// 퀘스트 A는 웨이브 쿨다운·분쟁 pending·허브 OFF와 별개로 Ready.
// 웨이브 세션(진행/결과창)만 같은 레이어라 막는다.
//
// 상주 함장 착륙 즉시 허브 교전(점유·분쟁 링 무관)은 2026-10-01 축 폐기.
// 블루 점유지 착륙 전투는 일반 규칙과 안 맞음. 나중에 별도 규칙으로만 재개.
// ============================================================

/** 상주 combat/red 함장 + CSV 플래그로 착륙 즉시 허브 교전. 폐기 · 퀘스트/웨이브는 유지. */
export const RESIDENT_HUB_MAIN_STAGE_AUTO_COMBAT = false;

export type HubMainStageCombatGateInput = {
  hubOrbitHostileEntered: boolean;
  mainStageCombatEnabled: boolean;
  cooldownActive: boolean;
  territorialTurnPending: boolean;
  waveDefenseActiveHere: boolean;
  /** 이 행성 웨이브 세션(active 또는 ended·reset 전) */
  waveDefenseSessionHere: boolean;
  /** 드라코 시험 베뉴 ON일 때만 — 허브 보스 교전을 웨이브 시작 전까지 억제. 2026-09-16 기본 OFF. */
  dracoCombatTestVenue?: boolean;
  /** hub_orbit 퀘스트 — 분쟁 pending·허브 OFF여도 퀘스트 1척 Ready */
  questHubOrbitActive?: boolean;
};

export function evaluateHubMainStageCombatEntered(
  input: HubMainStageCombatGateInput,
): boolean {
  if (input.waveDefenseActiveHere) return true;
  if (input.dracoCombatTestVenue) return false;
  if (input.questHubOrbitActive) {
    if (input.waveDefenseSessionHere) return false;
    return true;
  }
  if (input.territorialTurnPending) return false;
  if (input.waveDefenseSessionHere) return false;
  if (!RESIDENT_HUB_MAIN_STAGE_AUTO_COMBAT) return false;
  return input.hubOrbitHostileEntered && input.mainStageCombatEnabled && !input.cooldownActive;
}
