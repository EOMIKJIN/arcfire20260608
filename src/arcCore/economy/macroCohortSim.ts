// ============================================================
// Macro cohort SIM — F2P / Dolphin / Whale (headless · ingest KPI)
// ============================================================

export type MacroPlayerType = 'F2P' | 'Dolphin' | 'Whale';

export type MacroSimPlayer = {
  type: MacroPlayerType;
  playTime: number;
  dailyGemBuy: number;
  gold: number;
  gems: number;
  mineral: number;
  powerLevel: number;
};

export type MacroCohortPolicy = {
  simDays: number;
  goldPerHour: number;
  itemCostGold: number;
  itemCostGems: number;
  powerPerItem: number;
  f2pOptimalHours: number;
  f2pExcessHourEfficiency: number;
  dolphinGemEfficiency: number;
  dolphinRestedPlayThreshold: number;
  dolphinRestedBonus: number;
  dolphinPowerMul: number;
  whalePowerLogDivisor: number;
  mineralSinkPerPowerUnit: number;
  mineralIncomePerHour: number;
};

export type MacroCohortKpi = {
  f2pAvgPower: number;
  dolphinAvgPower: number;
  whaleAvgPower: number;
  whaleToF2pPowerRatio: number;
  cohortOrderValid: boolean;
};

export const DEFAULT_MACRO_COHORT_POLICY: MacroCohortPolicy = {
  simDays: 30,
  goldPerHour: 150,
  itemCostGold: 1000,
  itemCostGems: 100,
  powerPerItem: 0.5,
  f2pOptimalHours: 5,
  f2pExcessHourEfficiency: 0.25,
  dolphinGemEfficiency: 1.5,
  dolphinRestedPlayThreshold: 2.5,
  dolphinRestedBonus: 1.25,
  dolphinPowerMul: 1.12,
  whalePowerLogDivisor: 10,
  mineralSinkPerPowerUnit: 3,
  mineralIncomePerHour: 12,
};

function effectiveGoldHours(playTime: number, type: MacroPlayerType, policy: MacroCohortPolicy): number {
  if (type !== 'F2P') return playTime;
  if (playTime <= policy.f2pOptimalHours) return playTime;
  const excess = playTime - policy.f2pOptimalHours;
  return policy.f2pOptimalHours + excess * policy.f2pExcessHourEfficiency;
}

function dolphinGemBudget(rawGems: number, playTime: number, policy: MacroCohortPolicy): number {
  let mul = policy.dolphinGemEfficiency;
  if (playTime <= policy.dolphinRestedPlayThreshold) {
    mul *= policy.dolphinRestedBonus;
  }
  return rawGems * mul;
}

function powerGainPerItem(p: MacroSimPlayer, policy: MacroCohortPolicy): number {
  if (p.type === 'Whale') {
    const scale = 1 / (1 + Math.log1p(p.powerLevel / policy.whalePowerLogDivisor));
    return policy.powerPerItem * scale;
  }
  if (p.type === 'Dolphin') {
    return policy.powerPerItem * policy.dolphinPowerMul;
  }
  return policy.powerPerItem;
}

function tryPurchase(p: MacroSimPlayer, policy: MacroCohortPolicy, rng: () => number): void {
  let buyCount = 0;

  if (p.type === 'Dolphin') {
    p.gems += dolphinGemBudget(p.dailyGemBuy, p.playTime, policy);
  } else {
    p.gems += p.dailyGemBuy;
  }

  if (p.gems >= policy.itemCostGems) {
    const buy = Math.floor(p.gems / policy.itemCostGems);
    p.gems -= buy * policy.itemCostGems;
    buyCount += buy;
  }
  if (p.gold >= policy.itemCostGold) {
    const buy = Math.floor(p.gold / policy.itemCostGold);
    p.gold -= buy * policy.itemCostGold;
    buyCount += buy;
  }

  if (buyCount <= 0) return;

  const mineralNeed = buyCount * policy.mineralSinkPerPowerUnit;
  if (p.mineral < mineralNeed) {
    buyCount = Math.floor(p.mineral / policy.mineralSinkPerPowerUnit);
  }
  if (buyCount <= 0) return;

  p.mineral -= buyCount * policy.mineralSinkPerPowerUnit;
  for (let i = 0; i < buyCount; i += 1) {
    p.powerLevel += powerGainPerItem(p, policy) * (1 + (rng() - 0.5) * 0.05);
  }
}

export function createMacroCohortPlayers(count: number, rng: () => number): MacroSimPlayer[] {
  const players: MacroSimPlayer[] = [];
  for (let i = 0; i < count; i += 1) {
    const rand = rng();
    let type: MacroPlayerType;
    let playTime: number;
    let dailyGemBuy: number;
    if (rand < 0.8) {
      type = 'F2P';
      playTime = 3 + rng() * 5;
      dailyGemBuy = 0;
    } else if (rand < 0.95) {
      type = 'Dolphin';
      playTime = 1 + rng() * 3;
      dailyGemBuy = 10 + rng() * 40;
    } else {
      type = 'Whale';
      playTime = 0.5 + rng() * 2.5;
      dailyGemBuy = 200 + rng() * 800;
    }
    players.push({
      type,
      playTime,
      dailyGemBuy,
      gold: 0,
      gems: 0,
      mineral: 0,
      powerLevel: 1,
    });
  }
  return players;
}

export function simulateMacroCohort(
  players: MacroSimPlayer[],
  policy: MacroCohortPolicy,
  rng: () => number,
): void {
  for (let day = 0; day < policy.simDays; day += 1) {
    for (const p of players) {
      const goldHours = effectiveGoldHours(p.playTime, p.type, policy);
      const goldNoise = 1 + (rng() - 0.5) * 0.2;
      p.gold += goldHours * policy.goldPerHour * goldNoise;
      p.mineral += p.playTime * policy.mineralIncomePerHour;
      tryPurchase(p, policy, rng);
    }
  }
}

function avgPowerByType(players: MacroSimPlayer[], type: MacroPlayerType): number {
  const subset = players.filter((p) => p.type === type);
  if (subset.length === 0) return 1;
  return subset.reduce((s, p) => s + p.powerLevel, 0) / subset.length;
}

export function computeMacroCohortKpi(players: MacroSimPlayer[]): MacroCohortKpi {
  const f2p = avgPowerByType(players, 'F2P');
  const dolphin = avgPowerByType(players, 'Dolphin');
  const whale = avgPowerByType(players, 'Whale');
  const ratio = whale / Math.max(f2p, 0.01);
  return {
    f2pAvgPower: f2p,
    dolphinAvgPower: dolphin,
    whaleAvgPower: whale,
    whaleToF2pPowerRatio: ratio,
    cohortOrderValid: f2p < dolphin && dolphin < whale,
  };
}

export function createSeededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function runMacroCohortSimulation(input: {
  playerCount: number;
  policy?: Partial<MacroCohortPolicy>;
  seed?: number;
}): { players: MacroSimPlayer[]; kpi: MacroCohortKpi; policy: MacroCohortPolicy } {
  const policy: MacroCohortPolicy = { ...DEFAULT_MACRO_COHORT_POLICY, ...input.policy };
  const rng = input.seed != null ? createSeededRng(input.seed) : Math.random;
  const players = createMacroCohortPlayers(input.playerCount, rng);
  simulateMacroCohort(players, policy, rng);
  return { players, kpi: computeMacroCohortKpi(players), policy };
}
