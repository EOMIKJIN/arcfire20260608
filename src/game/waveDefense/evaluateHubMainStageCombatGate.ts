// ============================================================
// 허브 메인스테이지 교전 vs 분쟁 차례 웨이브 — 동시 점유 금지 게이트.
//
// draco_haven 은 순차 리스트 1번이면서 mainStageCombatEnabled + 궤도 RED 함장이 있다.
// 분쟁 차례 pending / 웨이브 세션(ended 포함) 동안 허브 보스 교전이 먼저 켜지면
// 같은 PlanetEdenRaidTestLayer 가 Ready 직후 웨이브로 재시드되거나, 결과창 중 허브가 재점화한다.
// 시험 베뉴는 2026-09-16 OFF — 착륙 시 허브 보스는 CSV(mainStageCombatEnabled·draco_boss) 정본.
// ============================================================

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
    return !input.cooldownActive;
  }
  if (input.territorialTurnPending) return false;
  if (input.waveDefenseSessionHere) return false;
  return input.hubOrbitHostileEntered && input.mainStageCombatEnabled && !input.cooldownActive;
}
