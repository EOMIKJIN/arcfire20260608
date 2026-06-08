// ============================================================
// NPC 기함 함급(hull class) 레지스트리 — O(1) 조회, 모듈 로드 시 검증
// 스테이지 궤도·NPC AI·향후 월드전투가 동일 구조체를 참조
// ============================================================

import type {
  NpcCapitalHullClassDef,
  NpcCapitalOrbitKinematic,
  NpcCapitalOrbitMotionParams,
  NpcCapitalShip,
} from '../types';
import { NPC_CAPITAL_HULL_FALLBACK_ID } from '../types';
import { NPC_CAPITAL_HULL_CLASSES, NPC_CAPITAL_AMBIENT_SLOT_CLASS_IDS } from '../data/npcCapitalHullClasses';
import { npcDeterministicHash32 } from './npcDeterministicHash';

function buildHullClassMap(): Map<string, NpcCapitalHullClassDef> {
  const m = new Map<string, NpcCapitalHullClassDef>();
  for (const def of NPC_CAPITAL_HULL_CLASSES) {
    if (m.has(def.id)) throw new Error(`npcCapitalClassRegistry: duplicate hull class id ${def.id}`);
    m.set(def.id, def);
  }
  return m;
}

const HULL_CLASS_BY_ID = buildHullClassMap();

/** DB 전함의 hullTypeId 가 모두 등록되어 있는지 검사 */
export function assertNpcCapitalShipsHullClassesRegistered(ships: readonly NpcCapitalShip[]): void {
  for (const s of ships) {
    if (!HULL_CLASS_BY_ID.has(s.hullTypeId)) {
      throw new Error(
        `npcCapitalClassRegistry: ship "${s.id}" uses unknown hullTypeId "${s.hullTypeId}". Add it to npcCapitalHullClasses.ts.`,
      );
    }
  }
}

/** 함급 정의 조회 — 없으면 주민 연출용 폴백(런타임 안전) */
export function getNpcCapitalHullClassDef(hullTypeId: string): NpcCapitalHullClassDef {
  return HULL_CLASS_BY_ID.get(hullTypeId) ?? HULL_CLASS_BY_ID.get(NPC_CAPITAL_HULL_FALLBACK_ID)!;
}

/** planet·system·slot 결정론으로 비등록 슬롯에 쓸 함급 id */
export function resolveAmbientNpcCapitalHullClassId(
  planetId: string,
  systemId: string,
  slotIndex: number,
): string {
  const h = npcDeterministicHash32(`ambientClass:${planetId}:${systemId}:${slotIndex}`);
  const ids = NPC_CAPITAL_AMBIENT_SLOT_CLASS_IDS;
  return ids[h % ids.length] ?? NPC_CAPITAL_HULL_FALLBACK_ID;
}

/**
 * 함급 궤도 템플릿 + 행성/성계/슬롯 시드 → 운동 상태 (스테이지·시뮬 공용)
 * 할당 최소화: 반환 객체만 새로 생성(슬롯당 1회 호출 수준)
 */
export function resolveNpcCapitalOrbitKinematic(
  planetId: string,
  systemId: string,
  slotIndex: number,
  motion: NpcCapitalOrbitMotionParams,
): NpcCapitalOrbitKinematic {
  const h = npcDeterministicHash32(`orbit:${planetId}:${systemId}:${slotIndex}`);
  const stillRoll = (h & 1023) / 1024;
  const moving = stillRoll >= motion.stillProbability;
  const hb = h >>> 10;
  const span = Math.max(1e-6, motion.speedMax - motion.speedMin);
  const speedMag = motion.speedMin + ((hb & 0xff) / 255) * span;
  const speedSign = (h & 0x100) !== 0 ? 1 : -1;
  const speed = moving ? speedMag * speedSign * (((h >>> 18) & 1) === 0 ? 1 : -1) : 0;
  const phase = (((h >>> 12) & 0xffff) / 0xffff) * Math.PI * 2;
  const spread = Math.max(0, Math.floor(motion.radiusSpread));
  const radius = motion.radiusBase + (h % (spread + 1));
  const hp = npcDeterministicHash32(`pathShape:${planetId}:${systemId}:${slotIndex}`);
  const ellipseY = 0.56 + (hp % 40) / 100;
  const pathTilt = ((hp >>> 8) & 0xffff) / 0xffff * Math.PI * 2;
  const periodScale = 0.68 + ((hp >>> 24) & 0xff) / 255 * 0.72;
  return { phase, speed, radius, moving, ellipseY, pathTilt, periodScale };
}

/** 등록된 함급 id 목록 (툴·디버그) */
export function listRegisteredNpcCapitalHullClassIds(): readonly string[] {
  return Array.from(HULL_CLASS_BY_ID.keys());
}
