/**
 * 정본 스폰 자격 — 식별 ∩ 바 활성 ∩ 밴드 가중>0 ∩ 3일 쿨다운 제외.
 * 전 행성 순회 금지. 호출측이 inspected 목록만 넘긴다.
 */
import {
  hash32,
  isAnomalyPlanetOnCooldown,
  resolveAnomalyBandWeight,
  resolveUnidentifiedAnomalyPolicy,
  type UnidentifiedAnomalyPolicy,
} from './unidentifiedAnomalyPolicy';

type AnomalyResolvedRef = {
  planetId: string;
  resolvedAtMs: number;
};

export type UnidentifiedAnomalySite = {
  planetId: string;
  systemId: string;
  sectorBand: string;
  weight: number;
};

export function collectCooldownPlanetIds(
  recentResolved: readonly AnomalyResolvedRef[],
  nowMs: number,
  policy = resolveUnidentifiedAnomalyPolicy(),
): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < recentResolved.length; i += 1) {
    const row = recentResolved[i];
    if (!row) continue;
    if (isAnomalyPlanetOnCooldown(row.resolvedAtMs, nowMs, policy.cooldownDays)) {
      out.add(row.planetId);
    }
  }
  return out;
}

export function isEligibleAnomalySite(
  site: Pick<UnidentifiedAnomalySite, 'planetId' | 'sectorBand'>,
  cooldownPlanetIds: ReadonlySet<string>,
  policy = resolveUnidentifiedAnomalyPolicy(),
): boolean {
  const planetId = String(site.planetId ?? '').trim();
  if (!planetId || cooldownPlanetIds.has(planetId)) return false;
  return resolveAnomalyBandWeight(site.sectorBand, policy) > 0;
}

export function toAnomalySite(
  input: { planetId: string; systemId: string; sectorBand: string },
  policy: UnidentifiedAnomalyPolicy = resolveUnidentifiedAnomalyPolicy(),
): UnidentifiedAnomalySite | null {
  const planetId = String(input.planetId ?? '').trim();
  const systemId = String(input.systemId ?? '').trim();
  const sectorBand = String(input.sectorBand ?? '').trim();
  if (!planetId || !systemId) return null;
  const weight = resolveAnomalyBandWeight(sectorBand, policy);
  if (weight <= 0) return null;
  return { planetId, systemId, sectorBand, weight };
}

/** 가중 추첨 1행성. seed가 같으면 동일 결과. */
export function pickWeightedAnomalySite(
  sites: readonly UnidentifiedAnomalySite[],
  seed: string,
): UnidentifiedAnomalySite | null {
  let total = 0;
  for (let i = 0; i < sites.length; i += 1) {
    total += Math.max(0, sites[i]!.weight);
  }
  if (total <= 0) return null;
  let roll = hash32(`daily:${seed}`) % total;
  for (let i = 0; i < sites.length; i += 1) {
    const site = sites[i]!;
    roll -= Math.max(0, site.weight);
    if (roll < 0) return site;
  }
  return sites[sites.length - 1] ?? null;
}
