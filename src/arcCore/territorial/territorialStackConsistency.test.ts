/**
 * 분쟁·점령 스택 일관성·효율(M0~M4) — unit tests
 * npx tsx --test src/arcCore/territorial/territorialStackConsistency.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  listTerritorialCombatPolicies,
  listTerritorialCombatPoliciesForCampaign,
} from './arcCoreTerritorialCombatPolicy';
import { resolveEffectiveTerritorialCombatMode } from './resolveEffectiveTerritorialCombatMode';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('1) NEUTRAL+블루만 인접 → effective=blue_neutral (기존 resolveEffectiveTerritorialCombatMode 재사용)', () => {
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'NEUTRAL',
    policyCombatMode: 'blue_red',
    supplyAdjacency: { blue: 1, red: 0 },
    contestedZone: true,
  });
  assert.equal(effective, 'blue_neutral');
});

test('2) INDEPENDENT 침공 판정(runIndependentHoldInvasionJudgment)은 effectiveCombatMode/P0 미사용(정적)', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  const start = src.indexOf('async function runIndependentHoldInvasionJudgment');
  assert.ok(start >= 0, 'runIndependentHoldInvasionJudgment 함수를 찾아야 함');
  const nextFnStart = src.indexOf('\nexport async function runTerritorialCombatPassForPlanet', start);
  assert.ok(nextFnStart > start, '다음 함수 경계를 찾아야 함');
  const rawBody = src.slice(start, nextFnStart);
  // 함수 종료 `}` 뒤에 붙는 모듈 레벨 주석/상수(예: graphMismatchWarnedSystemIds 설명)는
  // 함수 본문이 아니므로 제외 — 마지막 줄단독 "}"(함수 닫는 중괄호, CRLF/LF 모두 대응)까지만 본문으로 취급.
  const closingBraceMatches = [...rawBody.matchAll(/\r?\n\}\r?\n/g)];
  const lastClosing = closingBraceMatches[closingBraceMatches.length - 1];
  const body = lastClosing ? rawBody.slice(0, lastClosing.index! + lastClosing[0].length) : rawBody;
  assert.equal(
    /effectiveCombatMode|resolveEffectiveTerritorialCombatMode/.test(body),
    false,
    '독립국 침공 분기는 P0(중립 인접 오버라이드) 대상이 아님 — 의도된 비적용',
  );
  // 독립국 분기는 보급 최다 적대 팩션 단일 선정을 그대로 유지(별도 회귀)
  assert.match(body, /attackerAdjacent/);
});

test('3) draco_front 캠페인 목록이 CSV campaignOrder 오름차순 정렬', () => {
  const campaign = listTerritorialCombatPoliciesForCampaign('draco_front');
  assert.ok(campaign.length >= 3, 'draco_front 캠페인 최소 정적 3곳 이상');
  for (let i = 1; i < campaign.length; i += 1) {
    assert.ok(
      campaign[i]!.campaignOrder >= campaign[i - 1]!.campaignOrder,
      `campaignOrder 오름차순이어야 함: [${i - 1}]=${campaign[i - 1]!.campaignOrder} > [${i}]=${campaign[i]!.campaignOrder}`,
    );
  }
});

test('4) 데드 상수 DRACO_FRONT_CAMPAIGN_PLANET_ORDER 삭제됨 — CSV campaignOrder가 정본', () => {
  const src = readFileSync(resolve(__dirname, 'territorialCombatCampaign.ts'), 'utf8');
  assert.equal(
    /DRACO_FRONT_CAMPAIGN_PLANET_ORDER/.test(src),
    false,
    'TS 하드코딩 순서 상수는 제거되고 CSV가 정본이어야 함',
  );
});

test('5) listTerritorialCombatPolicies() 연속 2회 호출 — revision 캐시로 동일 배열 참조(재빌드 없음)', () => {
  const a = listTerritorialCombatPolicies();
  const b = listTerritorialCombatPolicies();
  assert.equal(a, b, '동적 분쟁지역 상태가 안 바뀐 동안엔 같은 배열 참조를 반환해야 함(캐시 hit)');
});

test('5b) listTerritorialCombatPoliciesForCampaign도 동일 그룹 연속 호출 시 동일 참조(캐시 hit)', () => {
  const a = listTerritorialCombatPoliciesForCampaign('draco_front');
  const b = listTerritorialCombatPoliciesForCampaign('draco_front');
  assert.equal(a, b);
});

console.log('[territorialStackConsistency] all tests passed');
