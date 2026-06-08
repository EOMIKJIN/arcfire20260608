// ============================================================
// 아크코어 궤도 교통(Arc NPC traffic) — 함장·함선은 전부 테이블(CSV) 단일 소스
// `npcFleetRegistry` — 함장: npc_ai_captains.csv, 함선: npc_ai_ships.csv (생성 TS와 동일)
// ============================================================

import type { NpcCaptain } from '../types';
import { getNpcCapitalShip, listNpcCaptains } from '../npc/npcFleetRegistry';

/** 궤도 교통 UI·시뮬 동시에 적용하는 슬롯 상한 */
export const ARC_NPC_TRAFFIC_MAX_SLOTS = 48;

export type ArcNpcTrafficTableRow = {
  captain: NpcCaptain;
  /** `npc_ai_ships.csv` → 전함 id */
  shipId: string;
};

/**
 * 궤도 교통에 올릴 (함장, 배정 함선) 쌍.
 * - **수송 전용**: `arcOrbitPresenceFill === true` 인 함장만(현재 `npc_arc_presence_ship_01`…12 + `npc_cpt_arc_pf_*`).
 *   일반 순찰·해적 함장(예: 스카 레인·레드전함3)은 여기에 넣지 않음 — 행성 궤도 표시·에덴 실시간과 혼동 방지.
 * - 전투 전용(`operationalState === 'combat'`) 함장은 제외.
 * - `assignedShipId` 가 있고, 해당 전함이 존재할 때만 포함.
 * - 행성 인포 보충 풀(`nearbyOrbitPresenceSystem`의 `buildArcOrbitPresenceFillRows`)과 **동일 12척**을 쓰되,
 *   본 목록은 아크코어 벽시계 이동 시뮬 입력으로만 사용한다.
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
  return rows.slice(0, ARC_NPC_TRAFFIC_MAX_SLOTS);
}
