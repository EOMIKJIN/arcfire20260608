/**
 * 로켓탄 발칸식 연사·탄착분포 — 정책·스폰 수학 검증
 * npx tsx src/combat/capitalRocketBurst.test.ts
 *
 * 계약(2026-07-22 대표님 지시):
 *  - 모든 rocket family 무기는 8~12발 연사(기존 4~6의 2배), 살보 총 시간 ≤ 0.6초
 *  - 탄착분포: 분산 반경 > 유효 반경 → 발당 명중률 ≈ (hitMul)² (일부 탄은 미스·통과)
 *  - 미스탄은 표적 후방 오버슈트(그대로 통과), 피해·폭발 FX 없음
 */
import assert from 'node:assert/strict';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../data/generated/csvWeapons';

const CAPITAL_WEAPONS_FROM_CSV = Object.values(CAPITAL_WEAPON_LIST_FROM_CSV);
import {
  getRocketBurstPolicy,
  resolveMissileSalvoCount,
  resolveMissileSalvoIntervalMs,
  resolveRocketImpactHitRadiusPx,
  resolveRocketImpactSpreadRadiusPx,
} from '../game/capitalWeaponRegistry';
import { buildCapitalProjectileSpawn } from './capitalProjectileSpawn';

const rocketRows = CAPITAL_WEAPONS_FROM_CSV.filter((r) => r.familyKind === 'rocket');

// ── 1. 정책 로드 ─────────────────────────────────────────────
{
  const p = getRocketBurstPolicy();
  assert.ok(p.salvoIntervalFloorMs <= 90, `로켓 연사 하한(${p.salvoIntervalFloorMs}) ≤ 90ms`);
  assert.ok(p.hitRadiusMulOfDispersion < 1, '유효 반경 < 분산 반경 (미스 발생 조건)');
  assert.ok(p.missOvershootMinPx > 0 && p.missOvershootMaxPx >= p.missOvershootMinPx);
  console.log('PASS 1. weapon_rocket_burst_policy 로드·기본 제약');
}

// ── 2. 모든 로켓 무기 8~12발 · 살보 총 시간 ≤ 0.6초 ──────────
{
  assert.ok(rocketRows.length > 0, 'rocket family 무기 존재');
  const floorMs = getRocketBurstPolicy().salvoIntervalFloorMs;
  for (const row of rocketRows) {
    const salvo = resolveMissileSalvoCount(row.id);
    const interval = resolveMissileSalvoIntervalMs(row.id, 420);
    assert.ok(salvo >= 8 && salvo <= 12, `${row.id} 연발수 8~12 (실제 ${salvo})`);
    const burstMs = salvo * interval;
    assert.ok(burstMs <= 600, `${row.id} 살보 총 시간 ${burstMs}ms ≤ 600ms`);
    assert.ok(interval >= floorMs, `${row.id} 간격 ${interval}ms ≥ 정책 하한 ${floorMs}`);
  }
  console.log(`PASS 2. rocket ${rocketRows.length}종 전수 — 8~12발·0.6초 내 연사`);
}

// ── 3. 비로켓(미사일) 연사 하한 140ms 유지 ───────────────────
{
  const missileRow = CAPITAL_WEAPONS_FROM_CSV.find(
    (r) => r.familyKind === 'missile' && r.salvoCount > 1,
  );
  assert.ok(missileRow, '연발 미사일 무기 존재');
  const interval = resolveMissileSalvoIntervalMs(missileRow!.id, 420);
  assert.ok(interval >= 140, `미사일 연사 하한 140ms 유지 (실제 ${interval})`);
  console.log('PASS 3. 미사일 family 연사 하한 회귀 없음');
}

// ── 4. 탄착분포 — 명중률 ≈ (hitMul)² · 미스탄 오버슈트 ──────
{
  const weaponId = rocketRows[0].id;
  const dispR = resolveRocketImpactSpreadRadiusPx(weaponId);
  const hitR = resolveRocketImpactHitRadiusPx(weaponId);
  assert.ok(hitR < dispR, `유효 반경(${hitR}) < 분산 반경(${dispR})`);

  const p0 = { x: 100, y: 100 };
  const aim = { x: 100 + rocketRows[0].rangePx, y: 100 };
  const aimDist = Math.hypot(aim.x - p0.x, aim.y - p0.y);
  const N = 4000;
  let miss = 0;
  for (let i = 0; i < N; i += 1) {
    const s = buildCapitalProjectileSpawn({
      weaponId,
      p0,
      aimCenter: aim,
      spreadIdx: i % 12,
      salvoCount: 12,
      flightSpeedPxPerMs: 0.45,
    });
    assert.ok(s, 'straight_fixed 스폰 결과 존재');
    const impactDistFromAim = Math.hypot(s!.p2.x - aim.x, s!.p2.y - aim.y);
    if (s!.missPassThrough) {
      miss += 1;
      const flightDist = Math.hypot(s!.p2.x - p0.x, s!.p2.y - p0.y);
      assert.ok(flightDist > aimDist, '미스탄은 표적 뒤로 오버슈트(통과)');
    } else {
      assert.ok(impactDistFromAim <= hitR + 1e-6, `명중탄 탄착점 ≤ 유효 반경 (${impactDistFromAim.toFixed(1)})`);
    }
    assert.ok(s!.lockImpactPoint, '로켓탄은 탄착점 고정(유도 없음)');
  }
  const missRate = miss / N;
  const expected = 1 - getRocketBurstPolicy().hitRadiusMulOfDispersion ** 2;
  assert.ok(
    Math.abs(missRate - expected) < 0.05,
    `미스율 ${(missRate * 100).toFixed(1)}% ≈ 기대 ${(expected * 100).toFixed(1)}% (±5%p)`,
  );
  const perBurstMiss = missRate * 12;
  assert.ok(perBurstMiss >= 2 && perBurstMiss <= 5, `12발 기준 기대 미스 ${perBurstMiss.toFixed(2)}발 ≈ 2~4발`);
  console.log(
    `PASS 4. 탄착분포 — 분산 ${dispR}px·유효 ${hitR}px·미스율 ${(missRate * 100).toFixed(1)}% (12발당 ${perBurstMiss.toFixed(1)}발 통과)`,
  );
}

// ── 5. 미사일(bezier)은 missPassThrough 미발생 ───────────────
{
  const missileRow = CAPITAL_WEAPONS_FROM_CSV.find((r) => r.familyKind === 'missile');
  assert.ok(missileRow);
  const s = buildCapitalProjectileSpawn({
    weaponId: missileRow!.id,
    p0: { x: 0, y: 0 },
    aimCenter: { x: 150, y: 0 },
    spreadIdx: 0,
    salvoCount: 3,
    flightSpeedPxPerMs: 0.064,
  });
  assert.ok(s && s.missPassThrough === false, '유도 미사일은 통과 미스 없음');
  console.log('PASS 5. 미사일 스폰 회귀 없음');
}

console.log('\n로켓탄 발칸 연사·탄착분포 테스트 전체 PASS');
