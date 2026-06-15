// ============================================================
// 아크코어 궤도 교통(Arc NPC traffic) — 함장·함선은 전부 테이블(CSV) 단일 소스
// `npcFleetRegistry` — 함장: npc_ai_captains.csv, 함선: npc_ai_ships.csv (생성 TS와 동일)
// ============================================================

import type { NpcCaptain } from '../types';
import { getNpcCapitalShip, listNpcCaptains } from '../npc/npcFleetRegistry';

/** 궤도 교통 UI·시뮬 동시 적용 슬롯 상한 — arcOrbitPresenceFill 수송 전함(메모리·렌더 부하) */
export const ARC_ORBIT_PRESENCE_FILL_MAX = 8;

/** @deprecated `ARC_ORBIT_PRESENCE_FILL_MAX` 사용 */
export const ARC_NPC_TRAFFIC_MAX_SLOTS = ARC_ORBIT_PRESENCE_FILL_MAX;

export type ArcNpcTrafficTableRow = {
  captain: NpcCaptain;
  /** `npc_ai_ships.csv` → 전함 id */
  shipId: string;
};

/**
 * 궤도 교통에 올릴 (함장, 배정 함선) 쌍.
 * - **수송 전용**: `arcOrbitPresenceFill === true` 인 함장만(현재 `npc_arc_presence_ship_01`…08 + `npc_cpt_arc_pf_*` 8명).
 *   일반 순찰·해적 함장(예: 스카 레인·레드전함3)은 여기에 넣지 않음 — 행성 궤도 표시·에덴 실시간과 혼동 방지.
 * - 전투 전용(`operationalState === 'combat'`) 함장은 제외.
 * - `assignedShipId` 가 있고, 해당 전함이 존재할 때만 포함.
 * - 테이블 순찰 함장 궤도 마크는 `captainOrbitPlanetAssignment`로 행성당 1명만 — 본 8척은 AiNpcSubCore 실시간 교통 전용.
 */
export function listArcNpcTrafficRowsFromTables(): ArcNpcTrafficTableRow[] {
  const rows: ArcNpcTrafficTableRow[] = [];
  for (const captain of listNpcCaptains()) {
    if (!captain.arcOrbitPresenceFill) continue;
    if (captain.operationalState === 'combat') continue;
    const sid = captain.assignedShipId?.trim();
    if (!sid) continue;
    const ship = getNpcCapitalShip(sid);
    if (!ship) continue;
    rows.push({ captain, shipId: sid });
  }
  rows.sort((a, b) => a.captain.id.localeCompare(b.captain.id));
  return rows.slice(0, ARC_ORBIT_PRESENCE_FILL_MAX);
}
