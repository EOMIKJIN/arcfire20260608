// ============================================================
// 권장 함급 대비 적 선체 스케일 — CSV 선체 원본은 유지, 전투 시드 1회만 적용
// 플레이 데이터로 planet_hostile_hull_scale.csv 만 재조정
// ============================================================

import { PlanetHostileHullScale_FROM_BALANCE_CSV } from '../data/balance/generated';
import { resolvePlanetZoneIndex } from '../arcCore/planetBalance/planetZoneIndexRegistry';

export type HostileHullScale = {
  hullHpMul: number;
  shieldMul: number;
  armorMul: number;
  minHullHp: number;
};

const IDENTITY_SCALE: HostileHullScale = {
  hullHpMul: 1,
  shieldMul: 1,
  armorMul: 1,
  minHullHp: 0,
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

type ScaleRow = (typeof PlanetHostileHullScale_FROM_BALANCE_CSV)[number];

let byPlanetId: Map<string, ScaleRow> | null = null;
let byZoneIndex: Map<number, ScaleRow> | null = null;

function getScaleIndexes(): { byPlanet: Map<string, ScaleRow>; byZone: Map<number, ScaleRow> } {
  if (!byPlanetId || !byZoneIndex) {
    byPlanetId = new Map();
    byZoneIndex = new Map();
    for (const row of PlanetHostileHullScale_FROM_BALANCE_CSV) {
      const pid = String(row.planetId ?? '').trim();
      if (pid) byPlanetId.set(pid, row);
      const z = Math.floor(parseNum(row.zoneIndex, 0));
      if (z > 0) byZoneIndex.set(z, row);
    }
  }
  return { byPlanet: byPlanetId, byZone: byZoneIndex };
}

function rowToScale(row: ScaleRow | undefined): HostileHullScale {
  if (!row) return IDENTITY_SCALE;
  return {
    hullHpMul: Math.max(0.1, parseNum(row.hullHpMul, 1)),
    shieldMul: Math.max(0.1, parseNum(row.shieldMul, 1)),
    armorMul: Math.max(0.1, parseNum(row.armorMul, 1)),
    minHullHp: Math.max(0, Math.floor(parseNum(row.minHullHp, 0))),
  };
}

export function resolvePlanetHostileHullScale(planetId: string): HostileHullScale {
  const pid = planetId.trim();
  if (!pid || pid.startsWith('__')) return IDENTITY_SCALE;
  const { byPlanet, byZone } = getScaleIndexes();
  const direct = byPlanet.get(pid);
  if (direct) return rowToScale(direct);
  const zone = resolvePlanetZoneIndex(pid);
  return rowToScale(byZone.get(zone));
}

function scaleIsIdentity(scale: HostileHullScale): boolean {
  return (
    scale.hullHpMul === 1 &&
    scale.shieldMul === 1 &&
    scale.armorMul === 1 &&
    scale.minHullHp <= 0
  );
}

/** 적(RED) 전투 스탯만. 플레이어·블루·섀도우 복제에는 호출하지 말 것. */
export function applyPlanetHostileHullScale<
  T extends { maxHp: number; maxShield?: number; armor?: number },
>(planetId: string, combat: T): T {
  const scale = resolvePlanetHostileHullScale(planetId);
  if (scaleIsIdentity(scale)) return combat;
  return {
    ...combat,
    maxHp: Math.max(1, scale.minHullHp, Math.round(combat.maxHp * scale.hullHpMul)),
    maxShield: Math.max(0, Math.round((combat.maxShield ?? 0) * scale.shieldMul)),
    armor: Math.max(0, Math.round((combat.armor ?? 0) * scale.armorMul)),
  };
}
