// ============================================================
// 테이블 체류 능동 판단 — 중력·역할 적합성·혼잡·운용·이력
// 균등 hash%N / 단일 가중 추첨이 아님. persist 없음(순수함수).
// ============================================================

import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';
import { resolvePlanetDwellCivicPolicy } from './planetDwellCivicPolicy';
import { getDwellRoleDef, isCivilianDwellRole } from './planetDwellRoleCatalog';
import type {
  DwellJudgment,
  DwellJudgmentInput,
  DwellRoleId,
  PlanetDwellSignal,
} from './planetDwellTypes';

export function getDwellJudgmentDayBucket(nowMs = Date.now()): number {
  return Math.floor((nowMs + 9 * 60 * 60 * 1000) / 86_400_000);
}

function unit01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n / 100));
}

function scoreRoleFit(role: DwellRoleId, signal: PlanetDwellSignal): number {
  const g = signal.gravity;
  const pop = unit01(signal.population);
  const tech = unit01(signal.technology);
  const env = unit01(signal.environment);
  switch (role) {
    case 'colonizer':
      return (signal.isFrontier && signal.colonizationPhase <= 1 ? 1.15 : 0.18) + (1 - g) * 0.35;
    case 'survey':
      return (1 - tech) * 0.55 + (signal.isFrontier ? 0.48 : 0.16) + (signal.isContested ? 0.12 : 0);
    case 'civilian_consumer':
      return g * 1.05 + pop * 0.42 + (signal.hasTradePort ? 0.28 : 0) + (signal.hasBar ? 0.1 : 0);
    case 'cultural':
      return pop * 0.4 + tech * 0.22 + (signal.hasBar ? 0.36 : 0) + g * 0.28;
    case 'information':
      return tech * 0.62 + g * 0.2 + (signal.zone !== 'pvp' && signal.zone !== 'endgame' ? 0.16 : 0);
    default:
      return g;
  }
}

function opsMul(role: DwellRoleId, signal: PlanetDwellSignal): number {
  let m = 1;
  if (signal.rebellionPhase === 'overthrow') {
    m *= isCivilianDwellRole(role) ? 0.22 : role === 'survey' ? 1.12 : 0.7;
  } else if (signal.rebellionPhase === 'simmering') {
    m *= isCivilianDwellRole(role) ? 0.62 : 0.9;
  }
  if (signal.wdi >= 70 && role === 'civilian_consumer') m *= 0.55;
  if (signal.environment < 35 && role === 'civilian_consumer') m *= 0.52;
  if (signal.environment > 70 && role === 'civilian_consumer') m *= 1.12;
  if (signal.isContested && isCivilianDwellRole(role)) m *= 0.42;
  if ((signal.zone === 'pvp' || signal.zone === 'endgame') && role === 'cultural') m *= 0.4;
  if (signal.isFrontier && signal.colonizationPhase <= 1 && isCivilianDwellRole(role)) m *= 0;
  return m;
}

function isLegalCandidate(
  signal: PlanetDwellSignal,
  role: DwellRoleId,
  occupancy: number,
  allowOverCapStay: boolean,
): boolean {
  const def = getDwellRoleDef(role);
  if (signal.logicalCap <= 0) return false;
  if (
    def.civilianBannedOnFrontierPhase1 &&
    signal.isFrontier &&
    signal.colonizationPhase <= 1
  ) {
    return false;
  }
  if (occupancy >= signal.logicalCap && !allowOverCapStay) return false;
  return true;
}

function hash01(salt: string): number {
  return npcDeterministicHash32(salt) / 0xffffffff;
}

function pickWeighted(items: readonly { planetId: string; score: number }[], salt: string, power: number): string {
  let sum = 0;
  const weights = new Array<number>(items.length);
  for (let i = 0; i < items.length; i++) {
    const w = Math.pow(Math.max(1e-6, items[i].score), power);
    weights[i] = w;
    sum += w;
  }
  let t = hash01(salt) * sum;
  for (let i = 0; i < items.length; i++) {
    t -= weights[i];
    if (t <= 0) return items[i].planetId;
  }
  return items[items.length - 1].planetId;
}

function scorePlanet(input: DwellJudgmentInput, planetId: string): number {
  const signal = input.signalsById.get(planetId);
  if (!signal) return 0;
  const policy = resolvePlanetDwellCivicPolicy();
  const occ = input.occupancy.get(planetId) ?? 0;
  const fit = scoreRoleFit(input.role, signal);
  const ops = opsMul(input.role, signal);
  if (ops <= 0) return 0;
  const cap = Math.max(1, signal.logicalCap);
  const crowding = 1 / (1 + (occ / cap) ** policy.crowdingExp);
  let score = Math.max(0, fit * ops * crowding);
  if (input.basePlanetId === planetId) score += policy.homeBias;
  if (input.activityPlanetIds.includes(planetId)) score += policy.activityBias;
  return score;
}

function collectLegalScores(input: DwellJudgmentInput, allowStayPlanetId: string | null): { planetId: string; score: number }[] {
  const scored: { planetId: string; score: number }[] = [];
  for (const planetId of input.candidates) {
    const signal = input.signalsById.get(planetId);
    if (!signal) continue;
    const occ = input.occupancy.get(planetId) ?? 0;
    const stayHere = allowStayPlanetId === planetId;
    if (!isLegalCandidate(signal, input.role, occ, stayHere && occ <= signal.logicalCap)) continue;
    const score = scorePlanet(input, planetId);
    if (score > 0) scored.push({ planetId, score });
  }
  scored.sort((a, b) => b.score - a.score || a.planetId.localeCompare(b.planetId));
  return scored;
}

function pickFromScores(
  input: DwellJudgmentInput,
  scored: readonly { planetId: string; score: number }[],
  epochBucket: number,
): string | null {
  if (scored.length === 0) return null;
  const policy = resolvePlanetDwellCivicPolicy();
  const best = scored[0];
  const floor = best.score * policy.considerationRatio;
  const considered = scored.filter((s) => s.score >= floor);
  const salt = `arcCoreDwellJudge:v1:${input.captainId}:${input.dayBucket}:${epochBucket}:${input.role}`;
  return pickWeighted(considered, salt, policy.scorePower);
}

/**
 * 한 함장의 체류지 판단. occupancy는 호출측이 순차 갱신한다(군중 피드백).
 */
export function judgeTableDwellPlanet(input: DwellJudgmentInput): DwellJudgment {
  const policy = resolvePlanetDwellCivicPolicy();
  const scoredNoStay = collectLegalScores(input, null);
  const prev = pickFromScores(input, scoredNoStay, input.epochBucket - 1);
  const scored = prev ? collectLegalScores(input, prev) : scoredNoStay;

  if (scored.length === 0) {
    return { planetId: null, action: 'depart', winningScore: 0, considered: 0 };
  }

  const best = scored[0];
  if (best.score < policy.departScore && isCivilianDwellRole(input.role)) {
    const anySettled = scored.some((s) => {
      const sig = input.signalsById.get(s.planetId);
      return sig && !(sig.isFrontier && sig.colonizationPhase <= 1);
    });
    if (!anySettled) {
      return { planetId: null, action: 'depart', winningScore: best.score, considered: scored.length };
    }
  }

  if (prev) {
    const prevRow = scored.find((s) => s.planetId === prev);
    if (prevRow && prevRow.score >= best.score * policy.hysteresisRatio) {
      return {
        planetId: prev,
        action: 'stay',
        winningScore: prevRow.score,
        considered: scored.length,
      };
    }
  }

  const picked = pickFromScores(input, scored, input.epochBucket);
  if (!picked) {
    return { planetId: null, action: 'depart', winningScore: best.score, considered: scored.length };
  }
  return {
    planetId: picked,
    action: prev && picked !== prev ? 'relocate' : picked === prev ? 'stay' : 'relocate',
    winningScore: scored.find((s) => s.planetId === picked)?.score ?? best.score,
    considered: scored.filter((s) => s.score >= best.score * policy.considerationRatio).length,
  };
}
