/**
 * Occupation seed repair — unit tests
 * npx tsx src/arcCore/balance/seedPlanetOccupationFromBalance.test.ts
 */
import assert from 'node:assert/strict';
import {
  ARC_CORE_SEED_RED_CLAN_ID,
  ARC_CORE_SEED_BLUE_CLAN_ID,
  seedPlanetOccupationHoldsFromBalance,
} from './seedPlanetOccupationFromBalance';
import {
  applyPlanetOccupationSeedPipeline,
  repairRuntimeNeutralizedHoldsFromOperations,
} from '../../clanWar/planetOccupationSeedPipeline';
import { resolveEffectiveMapOccupierClanId } from '../../clanWar/planetOwnershipModel';
import type { ClanBasicsRecord, ClanWarOperation, PlanetClanHold } from '../../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function aiClanHold(planetId: string, systemId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId: 'ai_clan_npc_cpt_ai_clan_neutral_01',
    homePlayerUid: 'npc_leader_ai_clan_neutral_01',
    kind: 'clan_hold',
    capturedAt: 1,
  };
}

test('omega_hub AI클랜 → 크림슨 레기온 RED 시드', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    omega_hub: aiClanHold('omega_hub', 'omega_station'),
  });
  assert.equal(holds.omega_hub?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(holds.omega_hub?.kind, 'clan_hold');
  assert.equal(
    resolveEffectiveMapOccupierClanId('omega_hub', holds.omega_hub),
    ARC_CORE_SEED_RED_CLAN_ID,
  );
});

test('perseus_memorial neutral → RED 시드', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    perseus_memorial: {
      planetId: 'perseus_memorial',
      systemId: 'perseus',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
    },
  });
  assert.equal(holds.perseus_memorial?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(
    resolveEffectiveMapOccupierClanId('perseus_memorial', holds.perseus_memorial),
    ARC_CORE_SEED_RED_CLAN_ID,
  );
});

test('draco_haven contested neutral 유지 (ArcCore 판정)', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    draco_haven: {
      planetId: 'draco_haven',
      systemId: 'draco_nebula',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
    },
  });
  assert.equal(holds.draco_haven?.occupierClanId, 'neutral');
  assert.equal(resolveEffectiveMapOccupierClanId('draco_haven', holds.draco_haven), undefined);
});

test('draco_haven AI클랜 → BLUE 국가 시드', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    draco_haven: aiClanHold('draco_haven', 'draco_nebula'),
  });
  assert.equal(holds.draco_haven?.occupierClanId, ARC_CORE_SEED_BLUE_CLAN_ID);
});

test('전투 승리·반란 중립화(neutralizedAt) — 비접전 RED 시드 복구 금지 + 지도 중립 표시', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    perseus_memorial: {
      planetId: 'perseus_memorial',
      systemId: 'perseus',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
      neutralizedAt: 1,
    },
  });
  assert.equal(holds.perseus_memorial?.occupierClanId, 'neutral');
  assert.equal(holds.perseus_memorial?.kind, 'neutral');
  assert.equal(
    resolveEffectiveMapOccupierClanId('perseus_memorial', holds.perseus_memorial),
    undefined,
  );
});

test('pipeline — AI sync 후 legacy ai_clan on nation seed 복구', () => {
  const holds: Record<string, PlanetClanHold> = {
    omega_hub: aiClanHold('omega_hub', 'omega_station'),
    perseus_memorial: {
      planetId: 'perseus_memorial',
      systemId: 'perseus',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
    },
  };
  const piped = applyPlanetOccupationSeedPipeline(holds, {} as Record<string, ClanBasicsRecord>);
  assert.equal(piped.holds.omega_hub?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(piped.holds.perseus_memorial?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(piped.mutated, true);
});

test('소급 수리 — 마커 이전 전투 승리 중립화가 시드 복구로 RED 회귀 → operations로 복원', () => {
  const winAt = 1000;
  // 마커 없이 중립화 → 부트 시드 복구가 RED로 되돌린 상태 재현 (capturedAt=승리 시각 유지)
  const revertedHolds: Record<string, PlanetClanHold> = {
    sirius_border: {
      planetId: 'sirius_border',
      systemId: 'sirius',
      occupierClanId: ARC_CORE_SEED_RED_CLAN_ID,
      deedOwnerClanId: null,
      homePlayerUid: null,
      kind: 'clan_hold',
      capturedAt: winAt,
    },
  };
  const operations: ClanWarOperation[] = [
    {
      id: 'op_arc_test',
      attackerClanId: 'neutral',
      defenderClanId: ARC_CORE_SEED_RED_CLAN_ID,
      targetPlanetId: 'sirius_border',
      phase: 'resolved',
      startedAt: winAt,
      updatedAt: winAt,
      ext: { source: 'player_wave_defense_win', previousSide: 'red', newSide: 'neutral' },
    } as ClanWarOperation,
  ];
  const repaired = repairRuntimeNeutralizedHoldsFromOperations(revertedHolds, operations);
  assert.equal(repaired.changed, true);
  assert.equal(repaired.holds.sirius_border?.occupierClanId, 'neutral');
  assert.equal(repaired.holds.sirius_border?.kind, 'neutral');
  assert.equal(repaired.holds.sirius_border?.neutralizedAt, winAt);
  // 수리 후 파이프라인 통과 — RED 재복구 없이 중립 유지 + 지도 중립 표시
  const piped = applyPlanetOccupationSeedPipeline(
    repaired.holds,
    {} as Record<string, ClanBasicsRecord>,
  );
  assert.equal(piped.holds.sirius_border?.occupierClanId, 'neutral');
  assert.equal(
    resolveEffectiveMapOccupierClanId('sirius_border', piped.holds.sirius_border),
    undefined,
  );
  // 중립화 이후 더 최신 capturedAt(정식 재점유)은 수리하지 않음
  const laterRed = repairRuntimeNeutralizedHoldsFromOperations(
    {
      sirius_border: { ...revertedHolds.sirius_border!, capturedAt: winAt + 1 },
    },
    operations,
  );
  assert.equal(laterRed.changed, false);
});

async function asyncTests(): Promise<void> {
  const {
    promoteDynamicContestedZone,
    isDynamicContestedZonePlanet,
    resetDynamicContestedZonesForAccountPurge,
  } = await import('../territorial/dynamicContestedZoneStore');
  const {
    getTerritorialCombatPolicy,
    listTerritorialCombatPoliciesForCampaign,
    isContestedZoneSystemId,
  } = await import('../territorial/arcCoreTerritorialCombatPolicy');

  await resetDynamicContestedZonesForAccountPurge();

  // 동적 분쟁 편입 — 시드 복구가 ArcCore 판정 결과(BLUE 등)를 되돌리지 않아야 함
  const promoted = await promoteDynamicContestedZone({
    planetId: 'sirius_border',
    systemId: 'sirius',
    source: 'player_wave_defense',
  });
  assert.equal(promoted, true);
  assert.equal(isDynamicContestedZonePlanet('sirius_border'), true);

  // idempotent + CSV 정적 분쟁 3곳은 편입 제외
  assert.equal(
    await promoteDynamicContestedZone({
      planetId: 'sirius_border',
      systemId: 'sirius',
      source: 'x',
    }),
    false,
  );
  assert.equal(
    await promoteDynamicContestedZone({
      planetId: 'draco_haven',
      systemId: 'draco_nebula',
      source: 'x',
    }),
    false,
  );

  // 합성 정책 — CSV `__dynamic_default__` 템플릿 기반 · 순차 캠페인(draco_front) 4번째 합류
  const policy = getTerritorialCombatPolicy('sirius_border');
  assert.ok(policy);
  assert.equal(policy!.enabled, true);
  assert.equal(policy!.contestedZone, true);
  assert.equal(policy!.planetId, 'sirius_border');
  assert.equal(policy!.systemId, 'sirius');
  assert.equal(policy!.campaignGroup, 'draco_front');
  assert.equal(policy!.campaignOrder, 4);
  // 캠페인 로테이션 3곳 → 4곳 (순차 1곳 판정·분쟁 링도 캠페인 예고 1곳만 표시)
  const campaign = listTerritorialCombatPoliciesForCampaign('draco_front');
  assert.equal(campaign.length, 4);
  assert.equal(campaign[3]?.planetId, 'sirius_border');
  assert.equal(isContestedZoneSystemId('sirius'), true);

  // ArcCore 판정이 BLUE로 뒤집은 hold — 시드 reconcile이 RED로 되돌리지 않아야 함
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    sirius_border: {
      planetId: 'sirius_border',
      systemId: 'sirius',
      occupierClanId: ARC_CORE_SEED_BLUE_CLAN_ID,
      deedOwnerClanId: null,
      homePlayerUid: null,
      kind: 'clan_hold',
      capturedAt: 2000,
    },
  });
  assert.equal(holds.sirius_border?.occupierClanId, ARC_CORE_SEED_BLUE_CLAN_ID);

  // neutral_declare(마커 없는 중립)도 유지
  const { holds: neutralHolds } = seedPlanetOccupationHoldsFromBalance({
    sirius_border: {
      planetId: 'sirius_border',
      systemId: 'sirius',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 2000,
    },
  });
  assert.equal(neutralHolds.sirius_border?.occupierClanId, 'neutral');

  await resetDynamicContestedZonesForAccountPurge();
  assert.equal(isDynamicContestedZonePlanet('sirius_border'), false);
  assert.equal(getTerritorialCombatPolicy('sirius_border'), null);
  assert.equal(listTerritorialCombatPoliciesForCampaign('draco_front').length, 3);
  console.log('PASS 동적 분쟁지역 — 캠페인 순차 합류·시드 reconcile 보호·초기화 복귀');
}

void asyncTests().then(() => {
  console.log('seedPlanetOccupationFromBalance.test.ts — all PASS');
});
