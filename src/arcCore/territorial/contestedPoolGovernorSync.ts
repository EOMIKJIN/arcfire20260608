// ============================================================
// 분쟁지역 풀 거버너 — 스토어 연동(glue). 순수 결정 로직은 contestedPoolGovernor.ts.
// 호출부: runTerritorialCombatPass.ts(hold변경 dirty 또는 캠페인 1바퀴 후 1회) — onBoot 동기 전수 스캔 없음.
// ============================================================

import { ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV, PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { useWorldStore } from '../../store/worldStore';
import { isWaveCombatCooldownActive } from '../../game/waveDefense/waveCombatCooldownStore';
import { listTerritorialCombatPolicies } from './arcCoreTerritorialCombatPolicy';
import { listTerritorialCampaignGroups } from './arcCoreTerritorialCombatState';
import { getArcCoreContestedPoolPolicy } from './arcCoreContestedPoolPolicy';
import { TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC } from './territorialCombatCampaign';
import {
  resolveContestedEligibilityForSystem,
  type ContestedEligibilityClass,
  type ContestedHoldSide,
} from './contestedEligibility';
import {
  planContestedPoolRebalance,
  scoreContestedEligibilityCandidate,
  type ContestedPoolMemberInput,
} from './contestedPoolGovernor';
import {
  DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID,
  clearContestedPoolDirty,
  demoteDynamicContestedZone,
  isContestedPoolDirty,
  isRecentlyDemoted,
  listDynamicContestedZoneEntries,
  markContestedPoolDirty,
  promoteDynamicContestedZone,
  pruneExpiredRecentlyDemoted,
  setSuspendedStaticPlanetIds,
} from './dynamicContestedZoneStore';
import { listAdjacentSystemIds } from './territorialSupplyLine';
import { resolveHoldFactionSide } from './territorialFactionSide';

export { markContestedPoolDirty, isContestedPoolDirty };

/**
 * 승격 후보 우주(2026-07-31 M5 확장) — 21개 게임플레이 성계 대표 planetId(occupation seed CSV, 계당
 * 1행 정본) **+** 현재 해금된 synth 프론티어 성계(1행성 1계 전제, `worldStore.systems[id].planets[0]`).
 * 대부분의 해금 synth는 `seedSynthFrontierNeutralHold`로 NEUTRAL 시작이라 "외곽 국경 중립" 후보 풀을
 * 넓혀 min8을 점유 FRONT로 땜빵하지 않고도 채울 수 있게 한다. 전 repo 스캔 아님 — 이미 로드된
 * worldStore 상태만 훑는다(O(unlockedSystemIds), bounded).
 */
function buildSystemUniverse(): Array<{ planetId: string; systemId: string }> {
  const out: Array<{ planetId: string; systemId: string }> = [];
  const seen = new Set<string>();
  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    const systemId = String(row.systemId ?? '').trim();
    const planetId = String(row.planetId ?? '').trim();
    if (!systemId || !planetId || seen.has(systemId)) continue;
    seen.add(systemId);
    out.push({ planetId, systemId });
  }

  const world = useWorldStore.getState();
  if (world.loaded) {
    for (const systemId of world.unlockedSystemIds) {
      if (!systemId.startsWith('synth_') || seen.has(systemId)) continue;
      const planetId = world.systems[systemId]?.planets[0]?.id;
      if (!planetId) continue;
      seen.add(systemId);
      out.push({ planetId, systemId });
    }
  }
  return out;
}

function resolvePromoteSource(classification: ContestedEligibilityClass): string {
  return classification === 'eligible_strategic_neutral' ? 'arc_strategic_neutral' : 'arc_frontline';
}

async function rebalanceCampaignGroup(
  campaignGroup: string,
  nowMs: number,
): Promise<{ promoted: string[]; demoted: string[]; safeStaticPlanetIds: string[] }> {
  const poolPolicy = getArcCoreContestedPoolPolicy(campaignGroup);
  const warStore = useClanWarFoundationStore.getState();
  if (!warStore.hydrated) {
    await warStore.loadLocalClanWarFoundation();
  }
  const holds = warStore.planetHolds;

  const activePolicies = listTerritorialCombatPolicies().filter(
    (p) => p.enabled && p.contestedZone && p.campaignGroup === campaignGroup,
  );
  const cooldownMs =
    poolPolicy.cooldownLaps * Math.max(1, activePolicies.length) * TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC * 1000;
  await pruneExpiredRecentlyDemoted(cooldownMs, nowMs);

  const csvStaticPlanetIds = new Set<string>(
    ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV.filter(
      (r) => r.planetId !== DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID && r.campaignGroup === campaignGroup,
    ).map((r) => String(r.planetId)),
  );
  const dynamicPlanetIds = new Set(
    listDynamicContestedZoneEntries()
      .filter((e) => !csvStaticPlanetIds.has(e.planetId))
      .map((e) => e.planetId),
  );
  const activeMemberSystemIds = new Set(activePolicies.map((p) => p.systemId));

  const universe = buildSystemUniverse();
  const members: ContestedPoolMemberInput[] = universe.map(({ planetId, systemId }) => {
    const hold = warStore.getHold(planetId);
    const holdSide = resolveHoldFactionSide(hold?.occupierClanId) as ContestedHoldSide;
    const classification = resolveContestedEligibilityForSystem({ systemId, holdSide, holds });
    const isStaticCsvRow = csvStaticPlanetIds.has(planetId);
    const isActiveMember = isStaticCsvRow || dynamicPlanetIds.has(planetId);
    const hasAdjacentActiveMember = listAdjacentSystemIds(systemId).some((id) => activeMemberSystemIds.has(id));
    const recentPlayerCombat = isWaveCombatCooldownActive(planetId);
    const score = scoreContestedEligibilityCandidate({
      classification,
      hasAdjacentActiveMember,
      recentPlayerCombat,
    });
    return {
      planetId,
      systemId,
      classification,
      isStaticCsvRow,
      isActiveMember,
      score,
      inCooldown: !isActiveMember && isRecentlyDemoted(planetId, cooldownMs, nowMs),
    };
  });

  // ActivePool·캠페인·지도 링에서 제외할 CSV 정적 SAFE 행 — 판정 스킵뿐 아니라 목록 자체에서 뺀다
  // (2026-07-31 contested-active-pool-ui-fix). 파일 삭제는 아니고 런타임 suspend 오버레이만.
  const safeStaticPlanetIds = members
    .filter((m) => m.isStaticCsvRow && m.classification === 'safe_hinterland')
    .map((m) => m.planetId);

  const plan = planContestedPoolRebalance({
    members,
    poolMin: poolPolicy.poolMin,
    poolMax: poolPolicy.poolMax,
    stepMax: poolPolicy.stepMax,
  });

  for (const planetId of plan.demote) {
    await demoteDynamicContestedZone(planetId);
  }
  for (const planetId of plan.promote) {
    const u = universe.find((x) => x.planetId === planetId);
    const m = members.find((x) => x.planetId === planetId);
    if (!u || !m) continue;
    const ok = await promoteDynamicContestedZone({
      planetId: u.planetId,
      systemId: u.systemId,
      source: resolvePromoteSource(m.classification),
    });
    if (ok && __DEV__) {
      console.log(
        `[territorial] 풀 거버너 승격: ${u.planetId}(${u.systemId}) class=${m.classification} score=${m.score}`,
      );
    }
  }

  // A안 수렴(김팀장 검수 2026-07-31): stepMax로 1회에 min/max에 못 미치면 dirty 유지.
  // 안 하면 첫 pass에서 5→7 승격 후 dirty clear → hold 변경 전까지 8 미도달로 고착됨.
  const promotedSet = new Set(plan.promote);
  const demotedSet = new Set(plan.demote);
  const nAfter = members.filter((m) => {
    if (demotedSet.has(m.planetId)) return false;
    const active = m.isActiveMember || promotedSet.has(m.planetId);
    return active && m.classification !== 'safe_hinterland';
  }).length;
  const hasPromoteCandidates = members.some(
    (m) =>
      !m.isActiveMember
      && !promotedSet.has(m.planetId)
      && m.classification !== 'safe_hinterland'
      && m.classification !== 'ineligible'
      && !m.inCooldown,
  );
  const hasDemoteCandidates = members.some(
    (m) =>
      (m.isActiveMember || promotedSet.has(m.planetId))
      && !m.isStaticCsvRow
      && !demotedSet.has(m.planetId)
      && m.classification !== 'safe_hinterland'
      && !m.inCooldown,
  );
  if (
    (nAfter < poolPolicy.poolMin && hasPromoteCandidates)
    || (nAfter > poolPolicy.poolMax && hasDemoteCandidates)
  ) {
    markContestedPoolDirty();
  }

  return { promoted: plan.promote, demoted: plan.demote, safeStaticPlanetIds };
}

/**
 * 전 캠페인 그룹 rebalance — dirty(hold 변경) 또는 명시 호출 시 1회.
 * onBoot 동기 전수 스캔 아님: 이 함수 자체는 probe/pass 트리거(runTerritorialCombatPass)에서만 불림.
 * 그룹 전체를 처리한 뒤 CSV 정적 SAFE 행을 한 번에 suspend 오버레이로 반영한다
 * (listTerritorialCombatPolicies()가 이 오버레이를 걸러 ActivePool·캠페인·지도 링에 일괄 반영, M1~M2).
 */
export async function rebalanceContestedPoolsNow(
  nowMs = Date.now(),
): Promise<Record<string, { promoted: string[]; demoted: string[] }>> {
  // 그룹 목록은 원본 CSV(suspend 오버레이 미적용)에서 뽑는다 — 정적 5행이 전부 동시에 SAFE로
  // suspend되는 극단적 경우에도 그룹 자체가 사라져 재평가(un-suspend) 기회를 잃지 않게 함.
  const groups = listTerritorialCampaignGroups(
    ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV
      .filter((r) => r.planetId !== DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID)
      .map((r) => ({
        campaignGroup: String(r.campaignGroup ?? '').trim() || null,
        enabled: String(r.enabled ?? '').trim().toLowerCase() === 'true',
      })),
  );
  const result: Record<string, { promoted: string[]; demoted: string[] }> = {};
  const safeStaticPlanetIds = new Set<string>();
  for (const group of groups) {
    const { promoted, demoted, safeStaticPlanetIds: groupSafe } = await rebalanceCampaignGroup(group, nowMs);
    result[group] = { promoted, demoted };
    for (const planetId of groupSafe) safeStaticPlanetIds.add(planetId);
  }
  setSuspendedStaticPlanetIds(safeStaticPlanetIds);
  return result;
}

/** dirty일 때만 rebalance — 매 probe/pass마다 무조건 실행하지 않음(빈도 억제, M6) */
export async function rebalanceContestedPoolsIfDirty(nowMs = Date.now()): Promise<void> {
  if (!isContestedPoolDirty()) return;
  clearContestedPoolDirty();
  try {
    await rebalanceContestedPoolsNow(nowMs);
  } catch (err) {
    markContestedPoolDirty();
    if (__DEV__) {
      console.warn('[territorial] contested pool rebalance failed — retry next dirty pass', err);
    }
  }
}
