// ============================================================
// 전력 스냅샷 vs 최근 분쟁 결과 — 순수 비교 (persist 없음)
// ============================================================

import { compactFactionPowerKpi } from './evaluateFactionPowerSnapshot';
import type {
  FactionPowerCompareReport,
  FactionPowerDivergence,
  FactionPowerKpiCompact,
  FactionPowerQuadCode,
  FactionPowerSnapshot,
  FactionPowerWarSide,
  TerritorialLearningOutcome,
} from './factionPowerTypes';

const TIE_RATIO = 0.05;
const QUAD_CODES: readonly FactionPowerQuadCode[] = ['F1', 'F2', 'F3', 'F4'];

export function resolveWarLeader(a: number, b: number): FactionPowerWarSide | 'tie' {
  const total = a + b;
  if (total <= 0) return 'tie';
  if (Math.abs(a - b) / total < TIE_RATIO) return 'tie';
  return a > b ? 'BLUE' : 'RED';
}

export function resolveQuadLeader(
  values: Record<FactionPowerQuadCode, number>,
): FactionPowerQuadCode | 'tie' {
  let best: FactionPowerQuadCode = 'F1';
  let bestVal = values.F1;
  let ties = 0;
  for (let i = 1; i < QUAD_CODES.length; i += 1) {
    const code = QUAD_CODES[i]!;
    const val = values[code];
    if (val > bestVal) {
      best = code;
      bestVal = val;
      ties = 0;
    } else if (val === bestVal) {
      ties += 1;
    }
  }
  if (bestVal <= 0 || ties > 0) return 'tie';
  return best;
}

function countWeakerAxes(blue: { planets: number; pgp: number; fleet: number }, red: typeof blue): {
  blueWeaker: number;
  redWeaker: number;
} {
  let blueWeaker = 0;
  let redWeaker = 0;
  if (blue.planets < red.planets) blueWeaker += 1;
  else if (red.planets < blue.planets) redWeaker += 1;
  if (blue.pgp < red.pgp) blueWeaker += 1;
  else if (red.pgp < blue.pgp) redWeaker += 1;
  if (blue.fleet < red.fleet) blueWeaker += 1;
  else if (red.fleet < blue.fleet) redWeaker += 1;
  return { blueWeaker, redWeaker };
}

function normalizeSide(raw: string): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function compareFactionPowerToTerritorialOutcomes(
  snapshot: FactionPowerSnapshot,
  outcomes: readonly TerritorialLearningOutcome[],
  windowMs = 24 * 60 * 60 * 1000,
): FactionPowerCompareReport {
  const cutoff = snapshot.capturedAtMs - windowMs;
  let blueCaptures = 0;
  let redCaptures = 0;
  let neutralizations = 0;
  let statusQuo = 0;
  let playerWaveCount = 0;
  let npcAutoCount = 0;
  let outcomeCount = 0;

  for (let i = 0; i < outcomes.length; i += 1) {
    const row = outcomes[i]!;
    if (row.wallTimeMs < cutoff) continue;
    outcomeCount += 1;
    if (row.source === 'player_wave') playerWaveCount += 1;
    else if (row.source === 'npc_auto') npcAutoCount += 1;
    const next = normalizeSide(row.newSide);
    if (row.holdChanged && next === 'blue') blueCaptures += 1;
    else if (row.holdChanged && next === 'red') redCaptures += 1;
    else if (row.holdChanged && next === 'neutral') neutralizations += 1;
    if (row.decision === 'status_quo' || !row.holdChanged) statusQuo += 1;
  }

  const blue = snapshot.war.BLUE;
  const red = snapshot.war.RED;
  const warLeaderByPlanets = resolveWarLeader(blue.planetCount, red.planetCount);
  const warLeaderByPgp = resolveWarLeader(blue.pgpBmu, red.pgpBmu);
  const warLeaderByFleet = resolveWarLeader(blue.occupiedFleetPower, red.occupiedFleetPower);
  const warLeaderByVault =
    blue.vaultCredits == null && red.vaultCredits == null
      ? 'unavailable'
      : resolveWarLeader(blue.vaultCredits ?? 0, red.vaultCredits ?? 0);
  const quadLeaderByPgp = resolveQuadLeader({
    F1: snapshot.quad.F1.pgpBmu,
    F2: snapshot.quad.F2.pgpBmu,
    F3: snapshot.quad.F3.pgpBmu,
    F4: snapshot.quad.F4.pgpBmu,
  });
  const quadLeaderByPlanets = resolveQuadLeader({
    F1: snapshot.quad.F1.planetCount,
    F2: snapshot.quad.F2.planetCount,
    F3: snapshot.quad.F3.planetCount,
    F4: snapshot.quad.F4.planetCount,
  });

  const divergences: FactionPowerDivergence[] = [];
  const axes = countWeakerAxes(
    { planets: blue.planetCount, pgp: blue.pgpBmu, fleet: blue.occupiedFleetPower },
    { planets: red.planetCount, pgp: red.pgpBmu, fleet: red.occupiedFleetPower },
  );
  if (axes.blueWeaker >= 2 && blueCaptures > redCaptures && blueCaptures >= 1) {
    divergences.push({
      id: 'weaker_blue_gaining',
      summaryKo: `블루가 행성/PGP/함대 중 ${axes.blueWeaker}축에서 열세인데 최근 점유 획득(${blueCaptures})이 레드(${redCaptures})보다 많음`,
    });
  }
  if (axes.redWeaker >= 2 && redCaptures > blueCaptures && redCaptures >= 1) {
    divergences.push({
      id: 'weaker_red_gaining',
      summaryKo: `레드가 행성/PGP/함대 중 ${axes.redWeaker}축에서 열세인데 최근 점유 획득(${redCaptures})이 블루(${blueCaptures})보다 많음`,
    });
  }
  const bv = blue.vaultCredits;
  const rv = red.vaultCredits;
  if (bv != null && rv != null && bv + rv > 0) {
    if (bv < rv * 0.7 && blueCaptures > redCaptures && blueCaptures >= 1) {
      divergences.push({
        id: 'vault_poor_blue_gaining',
        summaryKo: `블루 금고가 레드(아크코어 중앙)의 70% 미만인데 최근 점유 획득이 더 많음`,
      });
    }
    if (rv < bv * 0.7 && redCaptures > blueCaptures && redCaptures >= 1) {
      divergences.push({
        id: 'vault_poor_red_gaining',
        summaryKo: `아크코어 중앙 금고가 블루의 70% 미만인데 레드 점유 획득이 더 많음`,
      });
    }
  }

  return {
    windowMs,
    outcomeCount,
    blueCaptures,
    redCaptures,
    neutralizations,
    statusQuo,
    playerWaveCount,
    npcAutoCount,
    warLeaderByPlanets,
    warLeaderByPgp,
    warLeaderByFleet,
    warLeaderByVault,
    quadLeaderByPgp,
    quadLeaderByPlanets,
    divergences,
  };
}

export function compactFactionPowerKpiFromCompare(
  snapshot: FactionPowerSnapshot,
  compare: FactionPowerCompareReport,
): FactionPowerKpiCompact {
  return compactFactionPowerKpi(
    snapshot,
    {
      blue: compare.blueCaptures,
      red: compare.redCaptures,
      divergenceCount: compare.divergences.length,
    },
    {
      warLeaderByPlanets: compare.warLeaderByPlanets,
      quadLeaderByPgp: compare.quadLeaderByPgp,
    },
  );
}
