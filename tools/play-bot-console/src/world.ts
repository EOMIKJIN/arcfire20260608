import type { PlanetClanHold } from '../../../src/types';
import { resolveHoldFactionSide } from '../../../src/arcCore/territorial/territorialFactionSide';
import {
  BLUE_CLAN,
  NEUTRAL_CLAN,
  RED_CLAN,
  type FactionPaint,
  type KpiSnapshot,
  type PersonaId,
  type PlanetSlot,
  type WorldState,
} from './types';
import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetOccupationSeeds';
import { PlanetResourceGenesis_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetResourceGenesis';
import {
  CORE_PLANET_IDS,
  FOCUS_PLANET_ID,
  FOCUS_SYSTEM_ID,
  levelFromTotalExp,
  listDevModules,
  lookupHasTrade,
  lookupSystemId,
  lookupTcl,
} from './catalog';
import { EPOCH_MS, TICKS_PER_DAY } from './clock';
import { starterGemBalance } from './bmWallet';

function clanOfOwner(owner: string): { clan: string; kind: PlanetSlot['kind'] } {
  if (owner === 'BLUE') return { clan: BLUE_CLAN, kind: 'clan_hold' };
  if (owner === 'RED') return { clan: RED_CLAN, kind: 'clan_hold' };
  return { clan: NEUTRAL_CLAN, kind: 'neutral' };
}

function seedDevLevels(): Record<string, number> {
  const out: Record<string, number> = {};
  const mods = listDevModules();
  for (let i = 0; i < mods.length; i += 1) out[mods[i].id] = 0;
  return out;
}

function seedFocusStats(planetId: string): WorldState['focusStats'] {
  for (let i = 0; i < PlanetResourceGenesis_FROM_BALANCE_CSV.length; i += 1) {
    const row = PlanetResourceGenesis_FROM_BALANCE_CSV[i];
    if (row.planetId !== planetId) continue;
    return {
      resource: Number(row.genesisResourcePct) || 40,
      population: Number(row.genesisPopulationPct) || 40,
      defense: Number(row.genesisDefensePct) || 40,
      technology: Number(row.genesisTechnologyPct) || 40,
      environment: Number(row.genesisEnvironmentPct) || 40,
    };
  }
  return { resource: 50, population: 56, defense: 44, technology: 50, environment: 46 };
}

export function seedWorld(input: { runId: string; persona: PersonaId }): WorldState {
  const planets: Record<string, PlanetSlot> = {};
  for (const seed of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    if (seed.planetId.startsWith('synth_') && seed.planetId !== 'synth_011_p') continue;
    const own = clanOfOwner(seed.initialOwner);
    planets[seed.planetId] = {
      planetId: seed.planetId,
      systemId: seed.systemId,
      occupierClanId: own.clan,
      kind: own.kind,
      capturedAt: 1,
      neutralizedAt: null,
      satLevel: 0,
      combatEnabled: seed.occupationCombatEnabled === 'true',
      contested: seed.contestedZone === 'true',
      labelKo: seed.alertLabelKo,
      hasTrade: lookupHasTrade(seed.planetId),
      tcl: lookupTcl(seed.planetId),
    };
  }
  return {
    runId: input.runId,
    persona: input.persona,
    nowMs: EPOCH_MS,
    day: 1,
    tick: 0,
    ticksPerDay: TICKS_PER_DAY,
    currentPlanetId: 'arcadia_prime',
    currentSystemId: 'arcadia',
    level: 1,
    totalExp: 0,
    credits: 5000,
    blueVault: 16000,
    combatWins: 0,
    combatLosses: 0,
    trades: 0,
    mineralCargo: 0,
    gems: starterGemBalance(),
    gemExchangeDay: 1,
    gemExchangeWeek: 0,
    gemsSpentDay: 0,
    gemsSpentWeek: 0,
    annexOk: 0,
    annexFail: 0,
    satInstalls: 0,
    colonizeOk: 0,
    questAccepted: 0,
    questCleared: 0,
    holdCount: 0,
    lastHoldReason: '',
    lastHoldStreak: 0,
    alreadyLandKey: '',
    alreadyLandRepeat: 0,
    lastQuestId: '',
    lastAction: 'idle',
    stuckTicks: 0,
    storyCursor: 0,
    sideCursor: 0,
    completedMissionIds: [],
    completedLookup: {},
    learnedLookup: {},
    activeQuest: null,
    planets,
    dailyBatchCount: 0,
    flags: [],
    hangarShips: 3,
    hangarMax: 5,
    shipDestroys: 0,
    reboards: 0,
    actionCounts: {},
    skillPoints: 0,
    learnedSkills: [],
    equipped: {},
    gearScore: 0,
    focusPlanetId: FOCUS_PLANET_ID,
    focusSystemId: FOCUS_SYSTEM_ID,
    devLevels: seedDevLevels(),
    capitalDestroyed: false,
    lastQuestPlanetId: '',
    questOriginSystemId: '',
    skillLearned: 0,
    gearBuys: 0,
    devUpgrades: 0,
    questBuyCount: 0,
    focusStats: seedFocusStats(FOCUS_PLANET_ID),
    devJob: null,
    earlyFeelSec: 0,
    earlyFeelClosed: false,
    earlyFeelOpeningApplied: false,
    earlyFeelReported: false,
    earlyFeelBeats: [],
  };
}

export function markMissionDone(world: WorldState, id: string): void {
  if (world.completedLookup[id]) return;
  world.completedLookup[id] = true;
  world.completedMissionIds.push(id);
  world.questOriginSystemId = '';
}

export function markSkillLearned(world: WorldState, id: string): void {
  if (world.learnedLookup[id]) return;
  world.learnedLookup[id] = true;
  world.learnedSkills.push(id);
}

export function toHolds(world: WorldState): Record<string, PlanetClanHold> {
  const holds: Record<string, PlanetClanHold> = {};
  const ids = Object.keys(world.planets);
  for (let i = 0; i < ids.length; i += 1) {
    const p = world.planets[ids[i]];
    holds[p.planetId] = {
      planetId: p.planetId,
      systemId: p.systemId,
      occupierClanId: p.occupierClanId,
      homePlayerUid: null,
      kind: p.kind,
      capturedAt: p.capturedAt,
      neutralizedAt: p.neutralizedAt,
      occupationOrigin: p.kind === 'player_independent' ? 'player_colonize' : null,
    };
  }
  return holds;
}

export function paintOf(slot: PlanetSlot): FactionPaint {
  if (slot.kind === 'player_independent') return 'INDEPENDENT';
  if (slot.kind === 'player_home') return 'BLUE';
  const side = resolveHoldFactionSide(slot.occupierClanId);
  if (side === 'BLUE') return 'BLUE';
  if (side === 'RED') return 'RED';
  if (side === 'INDEPENDENT') return 'INDEPENDENT';
  return 'NEUTRAL';
}

export function countPaints(world: WorldState): Pick<KpiSnapshot, 'blue' | 'red' | 'neutral' | 'independent'> {
  let blue = 0;
  let red = 0;
  let neutral = 0;
  let independent = 0;
  for (let i = 0; i < CORE_PLANET_IDS.length; i += 1) {
    const slot = world.planets[CORE_PLANET_IDS[i]];
    if (!slot) continue;
    const p = paintOf(slot);
    if (p === 'BLUE') blue += 1;
    else if (p === 'RED') red += 1;
    else if (p === 'INDEPENDENT') independent += 1;
    else neutral += 1;
  }
  return { blue, red, neutral, independent };
}

export function snapshotKpi(world: WorldState): KpiSnapshot {
  const paints = countPaints(world);
  return {
    day: world.day,
    level: world.level,
    totalExp: world.totalExp,
    credits: world.credits,
    blueVault: world.blueVault,
    ...paints,
    combatWins: world.combatWins,
    combatLosses: world.combatLosses,
    trades: world.trades,
    annexOk: world.annexOk,
    colonizeOk: world.colonizeOk,
    questCleared: world.questCleared,
    holdCount: world.holdCount,
    lastHoldReason: world.lastHoldReason,
    hangarShips: world.hangarShips,
    shipDestroys: world.shipDestroys,
    reboards: world.reboards,
    skills: world.learnedSkills.length,
    skillPoints: world.skillPoints,
    gearScore: Math.round(world.gearScore),
    devSum: sumDevLevels(world),
    capitalDestroyed: world.capitalDestroyed ? 1 : 0,
  };
}

export function sumDevLevels(world: WorldState): number {
  const ids = listDevModules();
  let sum = 0;
  for (let i = 0; i < ids.length; i += 1) sum += world.devLevels[ids[i].id] ?? 0;
  return sum;
}

export function addExp(world: WorldState, delta: number): boolean {
  if (delta <= 0) return false;
  const before = world.level;
  world.totalExp += delta;
  world.level = levelFromTotalExp(world.totalExp);
  if (world.level > before) {
    world.skillPoints += world.level - before;
  }
  return world.level !== before;
}

export function ensurePlanetSlot(world: WorldState, planetId: string): PlanetSlot | null {
  const existing = world.planets[planetId];
  if (existing) return existing;
  const sys = lookupSystemId(planetId);
  if (!sys) return null;
  const slot: PlanetSlot = {
    planetId,
    systemId: sys,
    occupierClanId: NEUTRAL_CLAN,
    kind: 'neutral',
    capturedAt: 1,
    neutralizedAt: null,
    satLevel: 0,
    combatEnabled: true,
    contested: false,
    labelKo: planetId,
    hasTrade: lookupHasTrade(planetId),
    tcl: lookupTcl(planetId),
  };
  world.planets[planetId] = slot;
  return slot;
}

export function moveTo(world: WorldState, planetId: string): boolean {
  const sys = lookupSystemId(planetId);
  if (!sys) return false;
  ensurePlanetSlot(world, planetId);
  world.currentPlanetId = planetId;
  world.currentSystemId = sys;
  return true;
}

export function addFlag(world: WorldState, flag: string): void {
  if (world.flags.includes(flag)) return;
  if (world.flags.length >= 48) world.flags.shift();
  world.flags.push(flag);
}
