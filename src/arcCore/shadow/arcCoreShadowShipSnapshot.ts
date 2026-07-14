// ============================================================
// 아크코어 섀도우 전함 스냅샷 — 「복제된 플레이어 전함」 스펙 직렬화
//
// 핵심 플레이: 매칭된 짝 유저의 실제 기함 스펙이 아크코어 본진(endgame_boss)
// 보스로 등장한다. 각 클라이언트는 자기 기함의 최종 전투 스펙을 스냅샷으로
// 계산해 `arc_core_shadow_profiles/{uid}` 에 공개 안전 필드로 publish 하고,
// 짝 유저 스냅샷은 부트 소급 패스에서 단발 fetch → 로컬 캐시된다.
//
// 계산은 PlanetEdenRaidTestLayer.resolvePlayerFlagshipCombatBinding 과 동일한
// 파이프라인(테이블 기반 → 숙련 → 광물 → 장비)을 표준 모듈로만 재구성했다.
// (거대 전투 tsx 를 부트 경로에 끌어오지 않기 위한 의도적 분리 — 파이프라인
//  변경 시 양쪽 동기화 필수. 원본 주석 참조.)
//
// 배정규칙: 현재 1:1 페어 — 추후 토너먼트 규칙으로 업그레이드 예정(§16-A).
// ============================================================

import { NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV } from '../../data/generated';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';
import { isKnownCapitalWeaponId } from '../../game/capitalWeaponRowLookup';
import { DEFAULT_CLOSE_RANGE_WEAPON_ID } from '../../game/combatWeaponSlots';
import {
  applyMineralUpgradeToShipPerformance,
  calculateShipPerformance,
} from '../../combat/ShipPerformanceCalculator';
import { normalizePlayerCombatProficiency } from '../../combat/playerCombatProficiency';
import { applyShipEquipmentToShipPerformance } from '../../game/shipEquipment/shipEquipmentCombatBridge';
import {
  aggregateShipEquipmentBonuses,
  resolveShipEquipmentAgentKnobs,
} from '../../game/shipEquipment/shipEquipmentModel';
import { resolveShipFinalStatResult } from '../../ship/shipStatPipeline';
import { usePlayerStore } from '../../store/playerStore';
import type { CapitalShipArchetype, NpcCapitalCombatStats } from '../../types';

export type ArcCoreShadowShipSnapshot = {
  v: 1;
  nickname: string;
  playerLevel: number;
  shipDisplayName: string;
  combat: {
    maxHp: number;
    maxShield: number;
    armor: number;
    attackBonus: number;
    strStat: number;
    dexStat: number;
    sizeClass: number;
    expReward: number;
    damageDiceCount: number;
    damageDiceSides: number;
    damageDiceBonus: number;
    capitalShipArchetype?: CapitalShipArchetype;
  };
  runtime: {
    laserWeaponId: string;
    missileWeaponId: string;
    closeRangeWeaponId: string;
    auxWeaponId: string;
    maxMoveSpeedPxPerMs?: number;
    accelPxPerMs2?: number;
    maxTurnRateRadPerMs?: number;
    turnAccelRadPerMs2?: number;
    detectRangeScale?: number;
  };
  equipment: {
    acBonus: number;
    incomingDamageMul: number;
    hullRegenPerTick: number;
    missileMissChance: number;
  };
  updatedAtMs: number;
};

function resolveSlotWeaponId(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s || s === '0') return '';
  const id = s.replace(/^weapon_item_/, '').trim();
  return id && isKnownCapitalWeaponId(id) ? id : '';
}

/**
 * 현재 플레이어 기함의 최종 전투 스펙 스냅샷 — publish 용.
 * (온보딩 미완·기함 미해석 시 null)
 */
export function buildLocalArcCoreShadowShipSnapshot(): ArcCoreShadowShipSnapshot | null {
  const player = usePlayerStore.getState().player;
  if (!player?.nickname?.trim()) return null;

  const shipForCombat = resolveShipFinalStatResult(player.ship).shipForCombat;
  const npcShipId = shipForCombat.portraitNpcCapitalShipId?.trim();
  if (!npcShipId) return null;
  const npcRow = getNpcCapitalShip(npcShipId);
  if (!npcRow) return null;
  const runtimeBase = NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[npcShipId];

  let laserWeaponId = resolveSlotWeaponId(player.ship.equipSlots?.WEAPON_1?.itemDefId);
  let missileWeaponId = resolveSlotWeaponId(player.ship.equipSlots?.WEAPON_2?.itemDefId);
  let closeRangeWeaponId = resolveSlotWeaponId(player.ship.equipSlots?.WEAPON_3?.itemDefId);
  let auxWeaponId = resolveSlotWeaponId(player.ship.equipSlots?.WEAPON_4?.itemDefId);
  if (!laserWeaponId && runtimeBase?.laserWeaponId?.trim() && isKnownCapitalWeaponId(runtimeBase.laserWeaponId.trim())) {
    laserWeaponId = runtimeBase.laserWeaponId.trim();
  }
  if (!missileWeaponId && runtimeBase?.missileWeaponId?.trim() && isKnownCapitalWeaponId(runtimeBase.missileWeaponId.trim())) {
    missileWeaponId = runtimeBase.missileWeaponId.trim();
  }
  if (!closeRangeWeaponId && runtimeBase?.closeRangeWeaponId?.trim() && isKnownCapitalWeaponId(runtimeBase.closeRangeWeaponId.trim())) {
    closeRangeWeaponId = runtimeBase.closeRangeWeaponId.trim();
  }
  if (!closeRangeWeaponId && isKnownCapitalWeaponId(DEFAULT_CLOSE_RANGE_WEAPON_ID)) {
    closeRangeWeaponId = DEFAULT_CLOSE_RANGE_WEAPON_ID;
  }
  if (!auxWeaponId && runtimeBase?.auxWeaponId?.trim() && isKnownCapitalWeaponId(runtimeBase.auxWeaponId.trim())) {
    auxWeaponId = runtimeBase.auxWeaponId.trim();
  }

  const baseCombat = {
    ...npcRow.combat,
    maxHp: Math.max(1, shipForCombat.maxHp),
    maxShield: Math.max(0, shipForCombat.maxShield),
    armor: Math.max(0, shipForCombat.armor),
  };
  const proficiency = normalizePlayerCombatProficiency(player.combatProficiency, player.level);
  let perf = calculateShipPerformance(
    baseCombat,
    { level: player.level, proficiencyMultiplier: proficiency.proficiencyMultiplier },
    runtimeBase,
  );
  perf = applyMineralUpgradeToShipPerformance(perf, player.mineralUpgrades);
  perf = applyShipEquipmentToShipPerformance(perf, player.ship.equipSlots);
  const equipmentBonuses = aggregateShipEquipmentBonuses(player.ship.equipSlots);
  const knobs = resolveShipEquipmentAgentKnobs(perf.combat.maxHp, equipmentBonuses);

  const rt = perf.runtimeConfig ?? runtimeBase;

  return {
    v: 1,
    nickname: player.nickname.trim(),
    playerLevel: Math.max(1, player.level),
    shipDisplayName: shipForCombat.name,
    combat: {
      maxHp: perf.combat.maxHp,
      maxShield: perf.combat.maxShield,
      armor: perf.combat.armor,
      attackBonus: perf.combat.attackBonus,
      strStat: perf.combat.strStat,
      dexStat: perf.combat.dexStat,
      sizeClass: perf.combat.sizeClass,
      expReward: perf.combat.expReward,
      damageDiceCount: perf.combat.damageDice.count,
      damageDiceSides: perf.combat.damageDice.sides,
      damageDiceBonus: perf.combat.damageDice.bonus,
      capitalShipArchetype: perf.combat.capitalShipArchetype,
    },
    runtime: {
      laserWeaponId,
      missileWeaponId,
      closeRangeWeaponId,
      auxWeaponId,
      maxMoveSpeedPxPerMs: rt?.maxMoveSpeedPxPerMs,
      accelPxPerMs2: rt?.accelPxPerMs2,
      maxTurnRateRadPerMs: rt?.maxTurnRateRadPerMs,
      turnAccelRadPerMs2: rt?.turnAccelRadPerMs2,
      detectRangeScale: rt?.detectRangeScale,
    },
    equipment: {
      acBonus: knobs.acBonus,
      incomingDamageMul: knobs.incomingDamageMul,
      hullRegenPerTick: knobs.hullRegenPerTick,
      missileMissChance: knobs.missileMissChance,
    },
    updatedAtMs: Date.now(),
  };
}

/** Firestore 문서 → 스냅샷 (필수 필드 검증 · 실패 시 null) */
export function parseArcCoreShadowShipSnapshot(
  data: Record<string, unknown> | undefined,
): ArcCoreShadowShipSnapshot | null {
  if (!data) return null;
  const combat = data.combat as Record<string, unknown> | undefined;
  const runtime = data.runtime as Record<string, unknown> | undefined;
  const equipment = data.equipment as Record<string, unknown> | undefined;
  const num = (v: unknown, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  const optNum = (v: unknown): number | undefined =>
    typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

  const maxHp = num(combat?.maxHp, 0);
  const nickname = str(data.nickname);
  if (maxHp <= 0 || !nickname) return null;

  const arch = str(combat?.capitalShipArchetype);
  return {
    v: 1,
    nickname,
    playerLevel: Math.max(1, num(data.playerLevel, 1)),
    shipDisplayName: str(data.shipDisplayName) || nickname,
    combat: {
      maxHp,
      maxShield: Math.max(0, num(combat?.maxShield, 0)),
      armor: Math.max(0, num(combat?.armor, 0)),
      attackBonus: num(combat?.attackBonus, 0),
      strStat: Math.max(1, num(combat?.strStat, 8)),
      dexStat: Math.max(1, num(combat?.dexStat, 8)),
      sizeClass: num(combat?.sizeClass, 0),
      expReward: Math.max(0, num(combat?.expReward, 0)),
      damageDiceCount: Math.max(1, num(combat?.damageDiceCount, 1)),
      damageDiceSides: Math.max(2, num(combat?.damageDiceSides, 6)),
      damageDiceBonus: num(combat?.damageDiceBonus, 0),
      capitalShipArchetype:
        arch === 'fighter' || arch === 'ranger' || arch === 'survival' || arch === 'special' || arch === 'neutral'
          ? arch
          : undefined,
    },
    runtime: {
      laserWeaponId: str(runtime?.laserWeaponId),
      missileWeaponId: str(runtime?.missileWeaponId),
      closeRangeWeaponId: str(runtime?.closeRangeWeaponId),
      auxWeaponId: str(runtime?.auxWeaponId),
      maxMoveSpeedPxPerMs: optNum(runtime?.maxMoveSpeedPxPerMs),
      accelPxPerMs2: optNum(runtime?.accelPxPerMs2),
      maxTurnRateRadPerMs: optNum(runtime?.maxTurnRateRadPerMs),
      turnAccelRadPerMs2: optNum(runtime?.turnAccelRadPerMs2),
      detectRangeScale: optNum(runtime?.detectRangeScale),
    },
    equipment: {
      acBonus: Math.max(0, num(equipment?.acBonus, 0)),
      incomingDamageMul: Math.min(1, Math.max(0.65, num(equipment?.incomingDamageMul, 1))),
      hullRegenPerTick: Math.max(0, num(equipment?.hullRegenPerTick, 0)),
      missileMissChance: Math.min(0.42, Math.max(0, num(equipment?.missileMissChance, 0))),
    },
    updatedAtMs: num(data.updatedAtMs, 0),
  };
}

/** 스냅샷 → 전투 스탯 (createCapitalAgentBase combatStats 입력) */
export function shadowSnapshotToCombatStats(
  snap: ArcCoreShadowShipSnapshot,
): NpcCapitalCombatStats {
  return {
    maxHp: snap.combat.maxHp,
    maxShield: snap.combat.maxShield,
    armor: snap.combat.armor,
    attackBonus: snap.combat.attackBonus,
    strStat: snap.combat.strStat,
    dexStat: snap.combat.dexStat,
    sizeClass: snap.combat.sizeClass,
    expReward: snap.combat.expReward,
    damageDice: {
      count: snap.combat.damageDiceCount,
      sides: snap.combat.damageDiceSides,
      bonus: snap.combat.damageDiceBonus,
    },
    capitalShipArchetype: snap.combat.capitalShipArchetype,
  };
}
