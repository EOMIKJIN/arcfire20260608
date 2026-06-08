import type { PlayerShip } from '../types';
import { applyNpcCapitalShipToPlayerShip } from '../game/applyNpcCapitalShipPurchase';

export type ShipStatDbSnapshot = {
  bonusHp?: number;
  bonusShield?: number;
  bonusArmor?: number;
  bonusSpeed?: number;
};

export type ShipFinalStats = {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  armor: number;
  speed: number;
};

export type ShipFinalStatBreakdown = {
  base: ShipFinalStats;
  equipmentBonus: {
    hp: number;
    shield: number;
    armor: number;
    speed: number;
  };
  slotBonus: {
    hp: number;
    shield: number;
    armor: number;
    speed: number;
  };
  dbBonus: {
    hp: number;
    shield: number;
    armor: number;
    speed: number;
  };
};

export type ShipFinalStatResult = {
  shipForCombat: PlayerShip;
  finalStats: ShipFinalStats;
  breakdown: ShipFinalStatBreakdown;
};

function clampInt(n: number, min = 0): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.floor(n));
}

function resolveTableSyncedBaseShip(ship: PlayerShip): PlayerShip {
  const npcId = ship.portraitNpcCapitalShipId?.trim();
  if (!npcId) return ship;
  const applied = applyNpcCapitalShipToPlayerShip(ship, npcId);
  return applied.ok ? applied.ship : ship;
}

function resolveEquipmentBonus(ship: PlayerShip): ShipFinalStatBreakdown['equipmentBonus'] {
  let hp = 0;
  let shield = 0;
  let armor = 0;
  let speed = 0;
  for (const eq of ship.equipment) {
    if (!eq?.effect) continue;
    const fx = eq.effect;
    hp += clampInt(Number(fx.hp ?? fx.maxHp ?? 0));
    shield += clampInt(Number(fx.shield ?? fx.maxShield ?? 0));
    armor += clampInt(Number(fx.armor ?? 0));
    speed += clampInt(Number(fx.speed ?? 0));
  }
  return { hp, shield, armor, speed };
}

function resolveSlotBonus(_ship: PlayerShip): ShipFinalStatBreakdown['slotBonus'] {
  // TODO: 추후 itemDef/강화 DB 연동 시 슬롯별 상세 보정 적용
  return { hp: 0, shield: 0, armor: 0, speed: 0 };
}

function resolveDbBonus(snapshot?: ShipStatDbSnapshot): ShipFinalStatBreakdown['dbBonus'] {
  return {
    hp: clampInt(snapshot?.bonusHp ?? 0),
    shield: clampInt(snapshot?.bonusShield ?? 0),
    armor: clampInt(snapshot?.bonusArmor ?? 0),
    speed: clampInt(snapshot?.bonusSpeed ?? 0),
  };
}

export function resolveShipFinalStatResult(
  ship: PlayerShip,
  dbSnapshot?: ShipStatDbSnapshot,
): ShipFinalStatResult {
  const baseShip = resolveTableSyncedBaseShip(ship);
  const equipmentBonus = resolveEquipmentBonus(ship);
  const slotBonus = resolveSlotBonus(ship);
  const dbBonus = resolveDbBonus(dbSnapshot);

  const bonusHp = equipmentBonus.hp + slotBonus.hp + dbBonus.hp;
  const bonusShield = equipmentBonus.shield + slotBonus.shield + dbBonus.shield;
  const bonusArmor = equipmentBonus.armor + slotBonus.armor + dbBonus.armor;
  const bonusSpeed = equipmentBonus.speed + slotBonus.speed + dbBonus.speed;

  const finalMaxHp = clampInt(baseShip.maxHp + bonusHp, 1);
  const finalMaxShield = clampInt(baseShip.maxShield + bonusShield, 0);
  const finalArmor = clampInt(baseShip.armor + bonusArmor, 0);
  const finalSpeed = clampInt(baseShip.speed + bonusSpeed, 0);
  const hpDelta = finalMaxHp - baseShip.maxHp;
  const shieldDelta = finalMaxShield - baseShip.maxShield;

  const shipForCombat: PlayerShip = {
    ...baseShip,
    maxHp: finalMaxHp,
    hp: clampInt(baseShip.hp + hpDelta, 1),
    maxShield: finalMaxShield,
    shield: clampInt(baseShip.shield + shieldDelta, 0),
    armor: finalArmor,
    speed: finalSpeed,
  };

  return {
    shipForCombat,
    finalStats: {
      hp: shipForCombat.hp,
      maxHp: shipForCombat.maxHp,
      shield: shipForCombat.shield,
      maxShield: shipForCombat.maxShield,
      armor: shipForCombat.armor,
      speed: shipForCombat.speed,
    },
    breakdown: {
      base: {
        hp: baseShip.hp,
        maxHp: baseShip.maxHp,
        shield: baseShip.shield,
        maxShield: baseShip.maxShield,
        armor: baseShip.armor,
        speed: baseShip.speed,
      },
      equipmentBonus,
      slotBonus,
      dbBonus,
    },
  };
}
