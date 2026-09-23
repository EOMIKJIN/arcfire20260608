// ============================================================
// 팩션 전력 스냅샷 — 순수 함수 (zustand/RN 없음)
// ============================================================

import {
  MEGA_FACTION_BLUE_NATION,
  MEGA_FACTION_NORTH_NATION,
  MEGA_FACTION_RED_NATION,
  MEGA_FACTION_SOUTH_NATION,
} from '../../world/megaFactionNationPolicy';
import type {
  FactionPowerEvaluateInput,
  FactionPowerHoldMix,
  FactionPowerKpiCompact,
  FactionPowerQuadCode,
  FactionPowerQuadNationSnapshot,
  FactionPowerSnapshot,
  FactionPowerWarSideSnapshot,
} from './factionPowerTypes';

const EMPTY_MIX = (): FactionPowerHoldMix => ({
  blue: 0,
  red: 0,
  neutral: 0,
  independent: 0,
});

const QUAD_META: Record<
  FactionPowerQuadCode,
  {
    megaFactionId: string;
    displayNameKo: string;
    route: FactionPowerQuadNationSnapshot['route'];
    vaultNoteKo: string;
  }
> = {
  F1: {
    megaFactionId: MEGA_FACTION_BLUE_NATION.megaFactionId,
    displayNameKo: MEGA_FACTION_BLUE_NATION.displayNameKo,
    route: 'west',
    vaultNoteKo: '블루팀 공유 금고(점유 5축 · 서부 국가 전용 아님)',
  },
  F2: {
    megaFactionId: MEGA_FACTION_SOUTH_NATION.megaFactionId,
    displayNameKo: MEGA_FACTION_SOUTH_NATION.displayNameKo,
    route: 'south',
    vaultNoteKo: '국가 금고 없음(확장 잠금 · 월드/오퍼레이터 축)',
  },
  F3: {
    megaFactionId: MEGA_FACTION_RED_NATION.megaFactionId,
    displayNameKo: MEGA_FACTION_RED_NATION.displayNameKo,
    route: 'east',
    vaultNoteKo: '아크코어 중앙 금고(월드 공용 · 레드 전용 아님)',
  },
  F4: {
    megaFactionId: MEGA_FACTION_NORTH_NATION.megaFactionId,
    displayNameKo: MEGA_FACTION_NORTH_NATION.displayNameKo,
    route: 'north',
    vaultNoteKo: '국가 금고 없음(확장 잠금 · 월드/오퍼레이터 축)',
  },
};

function emptyWarSide(side: 'BLUE' | 'RED', vaultCredits: number | null): FactionPowerWarSideSnapshot {
  return {
    side,
    planetCount: 0,
    pgpBmu: 0,
    occupiedFleetPower: 0,
    doctrineFleetPower: 0,
    vaultCredits,
    vaultLabelKo:
      side === 'BLUE'
        ? '블루팀 공유 금고'
        : '아크코어 중앙 금고(월드 공용 · 레드 전용 아님)',
    combatCaptainCount: 0,
    combatCaptainLevelSum: 0,
    governorCount: 0,
    governorTacticsGradeSum: 0,
  };
}

function emptyQuad(code: FactionPowerQuadCode): FactionPowerQuadNationSnapshot {
  const meta = QUAD_META[code];
  return {
    code,
    megaFactionId: meta.megaFactionId,
    displayNameKo: meta.displayNameKo,
    route: meta.route,
    planetCount: 0,
    pgpBmu: 0,
    holdMix: EMPTY_MIX(),
    combatCaptainCount: 0,
    vaultCredits: null,
    vaultNoteKo: meta.vaultNoteKo,
  };
}

function routeToQuad(route: FactionPowerQuadNationSnapshot['route'] | null): FactionPowerQuadCode | null {
  if (route === 'west') return 'F1';
  if (route === 'south') return 'F2';
  if (route === 'east') return 'F3';
  if (route === 'north') return 'F4';
  return null;
}

function bumpHoldMix(mix: FactionPowerHoldMix, holdSide: FactionPowerEvaluateInput['planets'][number]['holdSide']): void {
  if (holdSide === 'BLUE') mix.blue += 1;
  else if (holdSide === 'RED') mix.red += 1;
  else if (holdSide === 'INDEPENDENT') mix.independent += 1;
  else mix.neutral += 1;
}

export function evaluateFactionPowerSnapshot(input: FactionPowerEvaluateInput): FactionPowerSnapshot {
  const blue = emptyWarSide('BLUE', input.vaults.blue);
  const red = emptyWarSide('RED', input.vaults.redArcCore);
  const quad: Record<FactionPowerQuadCode, FactionPowerQuadNationSnapshot> = {
    F1: emptyQuad('F1'),
    F2: emptyQuad('F2'),
    F3: emptyQuad('F3'),
    F4: emptyQuad('F4'),
  };
  quad.F1.vaultCredits = input.vaults.blue;
  quad.F3.vaultCredits = input.vaults.redArcCore;

  const routeByPlanetId = new Map<string, FactionPowerQuadNationSnapshot['route']>();
  for (let i = 0; i < input.planets.length; i += 1) {
    const row = input.planets[i]!;
    if (row.route) routeByPlanetId.set(row.planetId, row.route);
    blue.doctrineFleetPower += row.blueFleetPower;
    red.doctrineFleetPower += row.redFleetPower;

    if (row.holdSide === 'BLUE') {
      blue.planetCount += 1;
      blue.pgpBmu += row.pgpBmu;
      blue.occupiedFleetPower += row.blueFleetPower;
    } else if (row.holdSide === 'RED') {
      red.planetCount += 1;
      red.pgpBmu += row.pgpBmu;
      red.occupiedFleetPower += row.redFleetPower;
    }

    if (row.governorSide === 'BLUE') {
      blue.governorCount += 1;
      blue.governorTacticsGradeSum += row.governorTacticsGrade ?? 0;
    } else if (row.governorSide === 'RED') {
      red.governorCount += 1;
      red.governorTacticsGradeSum += row.governorTacticsGrade ?? 0;
    }

    const quadCode = routeToQuad(row.route);
    if (quadCode) {
      const nation = quad[quadCode];
      nation.planetCount += 1;
      nation.pgpBmu += row.pgpBmu;
      bumpHoldMix(nation.holdMix, row.holdSide);
    }
  }

  for (let i = 0; i < input.captains.length; i += 1) {
    const captain = input.captains[i]!;
    const level = Number.isFinite(captain.initialLevel) ? captain.initialLevel : 0;
    const combat = captain.operationalState === 'combat';
    if (combat && captain.combatTeam === 'blue') {
      blue.combatCaptainCount += 1;
      blue.combatCaptainLevelSum += level;
    } else if (combat && captain.combatTeam === 'red') {
      red.combatCaptainCount += 1;
      red.combatCaptainLevelSum += level;
    }
    const baseId = captain.basePlanetId;
    const quadCode = routeToQuad(baseId ? routeByPlanetId.get(baseId) ?? null : null);
    if (quadCode && combat) {
      quad[quadCode].combatCaptainCount += 1;
    }
  }

  return {
    capturedAtMs: input.nowMs,
    source: input.source,
    corePlanetCount: input.planets.length,
    war: { BLUE: blue, RED: red },
    quad,
  };
}

export function compactFactionPowerKpi(
  snapshot: FactionPowerSnapshot,
  captures: { blue: number; red: number; divergenceCount: number },
  leaders: {
    warLeaderByPlanets: FactionPowerKpiCompact['warLeaderByPlanets'];
    quadLeaderByPgp: FactionPowerKpiCompact['quadLeaderByPgp'];
  },
): FactionPowerKpiCompact {
  return {
    bluePlanets: snapshot.war.BLUE.planetCount,
    redPlanets: snapshot.war.RED.planetCount,
    bluePgp: snapshot.war.BLUE.pgpBmu,
    redPgp: snapshot.war.RED.pgpBmu,
    blueFleet: Math.round(snapshot.war.BLUE.occupiedFleetPower),
    redFleet: Math.round(snapshot.war.RED.occupiedFleetPower),
    blueVault: snapshot.war.BLUE.vaultCredits ?? 0,
    redVault: snapshot.war.RED.vaultCredits ?? 0,
    f1Pgp: snapshot.quad.F1.pgpBmu,
    f2Pgp: snapshot.quad.F2.pgpBmu,
    f3Pgp: snapshot.quad.F3.pgpBmu,
    f4Pgp: snapshot.quad.F4.pgpBmu,
    blueCaptures24h: captures.blue,
    redCaptures24h: captures.red,
    divergenceCount: captures.divergenceCount,
    warLeaderByPlanets: leaders.warLeaderByPlanets,
    quadLeaderByPgp: leaders.quadLeaderByPgp,
  };
}
