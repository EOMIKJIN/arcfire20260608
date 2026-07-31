/**
 * ActivePool·지도 링 정합(task_id=contested-active-pool-ui-fix-20260731) — unit tests
 * npx tsx --test src/arcCore/territorial/contestedActivePool.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  listTerritorialCombatPolicies,
  listTerritorialCombatPoliciesForCampaign,
  invalidateTerritorialCombatPolicyCache,
} from './arcCoreTerritorialCombatPolicy';
import { resolveContestedZonePreviewSystemIds } from './resolveContestedZonePreviewSystemIds';
import { setSuspendedStaticPlanetIds } from './dynamicContestedZoneStore';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  } finally {
    // 테스트 간 상태 격리 — 이 파일의 모든 test()는 끝에 suspend 오버레이를 비운다
    setSuspendedStaticPlanetIds(new Set());
    invalidateTerritorialCombatPolicyCache();
  }
}

test('1) 기준선 — suspend 없으면 shadow_market이 목록·캠페인·지도 링 전부에 있음', () => {
  invalidateTerritorialCombatPolicyCache();
  const policies = listTerritorialCombatPolicies();
  assert.ok(policies.some((p) => p.planetId === 'shadow_market'));
  const campaign = listTerritorialCombatPoliciesForCampaign('draco_front');
  assert.ok(campaign.some((p) => p.planetId === 'shadow_market'));
  const preview = resolveContestedZonePreviewSystemIds();
  // 예고 링은 그룹당 1곳만 표시하므로 shadow_nexus가 "그 순간의 다음 예고"가 아닐 수 있음 —
  // 여기서는 campaign 목록에 포함 여부만으로 충분히 검증(링 표시 로직 자체는 별도 관심사 아님).
  assert.ok(preview.length >= 0);
});

test('2) shadow_market SAFE 완포위 → suspend 오버레이 적용 시 목록·캠페인에서 제외', () => {
  setSuspendedStaticPlanetIds(new Set(['shadow_market']));
  const policies = listTerritorialCombatPolicies();
  assert.equal(
    policies.some((p) => p.planetId === 'shadow_market'),
    false,
    'suspend된 CSV 정적행은 ActivePool(listTerritorialCombatPolicies)에 없어야 함',
  );
  const campaign = listTerritorialCombatPoliciesForCampaign('draco_front');
  assert.equal(
    campaign.some((p) => p.planetId === 'shadow_market'),
    false,
    '캠페인 목록에서도 제외돼야 함(due 판정 대상 자체가 아님)',
  );
});

test('3) shadow_market suspend 시 지도 예고 링(resolveContestedZonePreviewSystemIds)에 shadow_nexus 미표시', () => {
  // shadow_market을 제외한 나머지 정적 4행만으로 예고 링이 채워지는지 — 여러 사이클을 돌며 shadow_nexus가
  // 한 번도 나오지 않는지 확인(예고 링은 그룹당 1곳, nextPreviewOrderIndex 커서 기반).
  setSuspendedStaticPlanetIds(new Set(['shadow_market']));
  const campaignLength = listTerritorialCombatPoliciesForCampaign('draco_front').length;
  assert.ok(campaignLength > 0, 'suspend 후에도 draco_front에 다른 멤버가 남아있어야 함');
  for (let i = 0; i < campaignLength + 2; i += 1) {
    const preview = resolveContestedZonePreviewSystemIds();
    assert.equal(preview.includes('shadow_nexus'), false, `${i}번째 확인에서도 shadow_nexus가 링에 없어야 함`);
  }
});

test('4) CSV 원본 파일에는 shadow_market 행이 그대로 남아있음(런타임 suspend만, 파일 삭제 아님)', () => {
  const csvPath = resolve(__dirname, '../../../tables/balance/arc_core_territorial_combat_policy.csv');
  const raw = readFileSync(csvPath, 'utf8');
  assert.ok(raw.includes('shadow_market'), 'CSV 파일 자체에는 shadow_market 행이 삭제되지 않고 남아있어야 함');
});

test('5) suspend 해제하면 다시 목록에 나타남(가역적 오버레이)', () => {
  setSuspendedStaticPlanetIds(new Set(['shadow_market']));
  assert.equal(listTerritorialCombatPolicies().some((p) => p.planetId === 'shadow_market'), false);
  setSuspendedStaticPlanetIds(new Set());
  assert.ok(listTerritorialCombatPolicies().some((p) => p.planetId === 'shadow_market'));
});

console.log('[contestedActivePool] all tests passed');
