import { listAdjacentSystemIds } from '../../../src/arcCore/territorial/territorialSupplyLine';
import { resolveHoldFactionSide } from '../../../src/arcCore/territorial/territorialFactionSide';
import type { Rng } from './rng';
import type { JournalEntry, WorldState } from './types';
import { BLUE_CLAN, NEUTRAL_CLAN, RED_CLAN } from './types';
import { moveTo, paintOf, toHolds } from './world';
import { resolveContestedZoneHardGate } from '../../../src/arcCore/territorial/contestedZoneHardGate';
import { computePlanetDailyUpkeepCredits, getBlueTeamVaultSeedCredits } from '../../../src/arcCore/economy/planetUpkeepPolicy';
import { lookupHasTrade } from './catalog';
import { PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetDefenseSatelliteLevelPolicy';
import { fightHere } from './actions';
import { STARTING_PLANET_ID } from '../../../src/data/systems';
import { resolveDefenseSatelliteTerritorialBonusFromDetail } from '../../../src/arcCore/territorial/applyDefenseSatelliteTerritorialAdjustments';

/**
 * 실기 방위위성 영토 효과(N1) — 트윈 일일 롤의 「블루 → 중립화」 확률에 곱한다.
 * 실기: 롤 battle 58% 중 absorb%p 를 현상 유지로 · 전투는 수비 (1+우위%) 배율에 ±12% 잡음(resolveTerritorialQuickCombat).
 * 트윈은 양측 함대 전력을 모르므로 같은 전력 기준으로 「기본 우위 8%」 대비 공격 승률 비를 쓴다.
 */
/**
 * 트윈 보정 상수 — 기기 실측(2026-10-10 RKStorage arcfire_planet_trade_fee_ledger_v1 · 93행성 평균 arcFeeCredits).
 * 수송선단 시뮬레이션을 트윈에 옮기지 않고 행성당 일 수수료로 근사한다.
 */
const CONVOY_FEE_PER_TRADE_PLANET_DAY = 5439;
const BLUE_VAULT_SEED = getBlueTeamVaultSeedCredits();

function satDailyUpkeep(level: number): number {
  if (level <= 0) return 0;
  const row = PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV.find((r) => Number(r.level) === level);
  return row ? Number(row.dailyUpkeepCredits) || 0 : 0;
}

const ROLL_BATTLE_PCT = 58;
const BASE_DEF_ADV_PCT = 8;
const NOISE = 0.12;
function attackerWinProb(defAdvPct: number): number {
  const r = 1 + defAdvPct / 100;
  const n = 120;
  let win = 0;
  for (let i = 0; i < n; i += 1) {
    const a = 1 + (((i + 0.5) / n) * 2 - 1) * NOISE;
    for (let j = 0; j < n; j += 1) {
      const d = r * (1 + (((j + 0.5) / n) * 2 - 1) * NOISE);
      if (a > d) win += 1;
    }
  }
  return win / (n * n);
}
const satFlipMulCache = new Map<number, number>();
export function satelliteFlipMul(satLevel: number): number {
  if (satLevel <= 0) return 1;
  let mul = satFlipMulCache.get(satLevel);
  if (mul === undefined) {
    const bonus = resolveDefenseSatelliteTerritorialBonusFromDetail({
      installed: true, level: satLevel, installedBy: 'player', defenderSide: 'BLUE',
    });
    const base = attackerWinProb(BASE_DEF_ADV_PCT);
    const withSat = attackerWinProb(BASE_DEF_ADV_PCT + bonus.defenderAdvantagePct);
    mul = (base > 0 ? withSat / base : 1) * (ROLL_BATTLE_PCT - bonus.statusQuoAbsorbPct) / ROLL_BATTLE_PCT;
    satFlipMulCache.set(satLevel, mul);
  }
  return mul;
}

function adjacentHas(world: WorldState, systemId: string, side: 'BLUE' | 'RED'): boolean {
  const adj = listAdjacentSystemIds(systemId);
  const ids = Object.keys(world.planets);
  for (let i = 0; i < adj.length; i += 1) {
    for (let j = 0; j < ids.length; j += 1) {
      const slot = world.planets[ids[j]];
      if (slot.systemId !== adj[i]) continue;
      if (resolveHoldFactionSide(slot.occupierClanId) === side) return true;
    }
  }
  return false;
}

/**
 * A-7a — 체류 중 분쟁 차례 = 플레이어 웨이브(실기 「체류 중 분쟁 차례 → 플레이어 웨이브 이관」).
 * 승리: fightHere 의 체류 승리 규칙(레드→중립 · 블루·중립 유지).
 * 패배: 실기 resolvePlayerWaveDefeatDisposition — 레드가 아니면 크림슨 점령, 기함은 모항.
 */
function stayWaveDefense(world: WorldState, rng: Rng, slot: WorldState['planets'][string]): JournalEntry {
  const wasRed = paintOf(slot) === 'RED';
  const fight = fightHere(world, rng, '웨이브');
  if (fight.kind !== 'DESTROY') return fight;
  let note = '';
  if (!wasRed) {
    slot.occupierClanId = RED_CLAN;
    slot.kind = 'clan_hold';
    slot.capturedAt = world.nowMs;
    slot.neutralizedAt = null;
    note = ' · 크림슨 점령';
  }
  if (world.currentPlanetId !== STARTING_PLANET_ID && moveTo(world, STARTING_PLANET_ID)) {
    world.travelGoal = '';
    note += ` · 모항 귀환 ${slot.planetId}→${STARTING_PLANET_ID}`;
  }
  fight.line += ` [웨이브 패배 처분${note}]`;
  return fight;
}

/** 일 1회 NPC 영토 롤 — 체류 중이면 그 행성의 분쟁 차례는 플레이어 웨이브로 넘긴다(A-7a). */
export function runTerritorialDay(world: WorldState, rng: Rng): JournalEntry[] {
  const out: JournalEntry[] = [];
  const ids = Object.keys(world.planets);
  // 실기 NPC 자동전 관문(resolveContestedZoneHardGate) — 후방 SAFE·비전선·포위문 닫힌 수도는 분쟁 차례가 없다.
  // 하루 시작 시점의 점유 스냅샷으로 판정(실기 패스도 hold 스냅샷 기준).
  const holds = toHolds(world);

  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (!slot.combatEnabled) continue;

    const paint = paintOf(slot);
    if (paint === 'INDEPENDENT') continue;
    const gate = resolveContestedZoneHardGate({ planetId: slot.planetId, systemId: slot.systemId, holdSide: paint, holds });
    if (gate.blocked) {
      if (world.currentPlanetId === slot.planetId) {
        out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 체류 중 — 분쟁 차례 없음`));
      }
      continue;
    }

    const redAdj = adjacentHas(world, slot.systemId, 'RED');
    const blueAdj = adjacentHas(world, slot.systemId, 'BLUE');
    const contestedBonus = slot.contested ? 0.08 : 0;

    if (world.currentPlanetId === slot.planetId) {
      // 이 행성에 오늘 분쟁 차례가 오는가 — NPC 롤과 같은 확률
      const turnChance = paint === 'NEUTRAL'
        ? (redAdj ? 0.12 : 0.04) + contestedBonus + (blueAdj ? 0.08 : 0.02)
        : paint === 'BLUE'
          ? (redAdj ? 0.1 + contestedBonus : 0)
          : (blueAdj ? 0.06 : 0);
      if (turnChance > 0 && rng() < turnChance && world.hangarShips > 0) {
        out.push(stayWaveDefense(world, rng, slot));
      } else {
        out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 체류 중 — 분쟁 차례 없음`));
      }
      continue;
    }

    if (paint === 'NEUTRAL') {
      const redChance = (redAdj ? 0.12 : 0.04) + contestedBonus;
      const blueChance = blueAdj ? 0.08 : 0.02;
      const roll = rng();
      if (roll < redChance) {
        slot.occupierClanId = RED_CLAN;
        slot.kind = 'clan_hold';
        slot.capturedAt = world.nowMs;
        slot.neutralizedAt = null;
        out.push(event(world, 'TERRITORIAL', `${slot.labelKo} NPC 자동전투 → 크림슨 점유`));
      } else if (roll < redChance + blueChance) {
        slot.occupierClanId = BLUE_CLAN;
        slot.kind = 'clan_hold';
        slot.capturedAt = world.nowMs;
        slot.neutralizedAt = null;
        out.push(event(world, 'TERRITORIAL', `${slot.labelKo} NPC 자동전투 → 스텔리움 점유`));
      }
      continue;
    }

    if (paint === 'BLUE' && redAdj && rng() < (0.1 + contestedBonus) * satelliteFlipMul(slot.satLevel)) {
      slot.occupierClanId = NEUTRAL_CLAN;
      slot.kind = 'neutral';
      slot.neutralizedAt = world.nowMs;
      out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 접전 → 중립화`));
    } else if (paint === 'RED' && blueAdj && rng() < 0.06) {
      slot.occupierClanId = NEUTRAL_CLAN;
      slot.kind = 'neutral';
      slot.neutralizedAt = world.nowMs;
      out.push(event(world, 'TERRITORIAL', `${slot.labelKo} 반격 → 중립화`));
    }
  }

  // 실기 일일 유지비(runArcCorePlanetUpkeepDailyPass) — 블루 점유 행성마다 고정 800 + 위성 레벨 유지비, 블루 금고에서 0 하한.
  // 트윈 단순화: 행성별 당일 수수료 환류(18%)는 행성별 장부가 없어 뺀다.
  let upkeep = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (paintOf(slot) !== 'BLUE') continue;
    upkeep += computePlanetDailyUpkeepCredits(satDailyUpkeep(slot.satLevel));
  }
  world.blueVault = Math.max(0, world.blueVault - upkeep);
  // 실기 일일 재정 패스(runArcCoreFiscalOpexPass) — 시드 위 잔액은 군사·운영비로 쓴다(기기 10-08~10: 마감 잔액 매일 100,000)
  world.blueVault = Math.min(world.blueVault, BLUE_VAULT_SEED);
  // 실기 수송선단 일일 정산 수수료 — 블루 무역 행성마다 다음 배치까지 쌓인다(기기 10-10 원장 평균 5,439/행성)
  let tradePlanets = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const slot = world.planets[ids[i]];
    if (paintOf(slot) === 'BLUE' && lookupHasTrade(slot.planetId)) tradePlanets += 1;
  }
  world.blueVault += tradePlanets * CONVOY_FEE_PER_TRADE_PLANET_DAY;

  world.dailyBatchCount += 1;
  out.push(event(world, 'DAILY', `일일 배치 마커 #${world.dailyBatchCount} (가상 정오)`));
  return out;
}

function event(
  world: WorldState,
  kind: JournalEntry['kind'],
  line: string,
): JournalEntry {
  return {
    t: Date.now(),
    day: world.day,
    tick: world.tick,
    kind,
    line,
  };
}
