/**
 * npx tsx src/combat/capitalCraftPool.test.ts
 */
import assert from 'node:assert/strict';
import {
  CRAFT_TRAIL_SAMPLES,
  CRAFT_VOLLEY_LAUNCH_STAGGER_MS,
  countAliveCapitalCrafts,
  createCapitalCraftImpactScratch,
  createCapitalCraftPool,
  resetCapitalCraftPool,
  tickCapitalCrafts,
  trySpawnCapitalCraft,
  trySpawnCapitalCraftVolley,
  type CapitalCraftAgentPose,
} from './capitalCraftPool';
import type { WeaponCraftLoiterPolicy } from './weaponCraftLoiterPolicy';
import { getWeaponCraftLoiterPolicy } from './weaponCraftLoiterPolicy';
import { isCraftLoiterRuntimeActive } from './capitalWeaponRuntimeSpec';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const FLAGS_OFF = {
  weaponId: '',
  profileId: 'test',
  craftCount: 1,
  orbitAttack: false,
  ignoreShield: false,
  aoeRadiusPx: 0,
  pierceAfterStrike: false,
  ramThenRtb: false,
  interceptMissiles: false,
  pierceMs: 0,
  slowMul: 0,
  slowMs: 0,
} as const;

const FAST_DRONE: WeaponCraftLoiterPolicy = {
  familyKind: 'drone',
  ...FLAGS_OFF,
  approachSpeedMul: 1,
  orbitRadiusPx: 20,
  orbitEnterPx: 24,
  orbitLaps: 1,
  orbitMsMax: 320,
  strikeHitPx: 8,
  standoffPx: 0,
  figure8RadiusPx: 0,
  figure8PeriodMs: 0,
  engageMs: 0,
  attackPeriodMs: 0,
  craftHp: 1,
  recoverPx: 0,
  maxAlivePerOwner: 2,
  poolHardCap: 8,
};

const FAST_CARRIER: WeaponCraftLoiterPolicy = {
  familyKind: 'carrier',
  ...FLAGS_OFF,
  approachSpeedMul: 1,
  orbitRadiusPx: 0,
  orbitEnterPx: 0,
  orbitLaps: 0,
  orbitMsMax: 0,
  strikeHitPx: 0,
  standoffPx: 40,
  figure8RadiusPx: 16,
  figure8PeriodMs: 800,
  engageMs: 900,
  attackPeriodMs: 300,
  craftHp: 8,
  recoverPx: 12,
  maxAlivePerOwner: 2,
  poolHardCap: 8,
};

function poses(): (CapitalCraftAgentPose | undefined)[] {
  const buf: (CapitalCraftAgentPose | undefined)[] = [];
  buf[1] = { x: 0, y: 100, alive: true };
  buf[2] = { x: 100, y: 100, alive: true };
  return buf;
}

test('정책 CSV — 패밀리 기본 + 무기별 프로파일', () => {
  const drone = getWeaponCraftLoiterPolicy('drone');
  const carrier = getWeaponCraftLoiterPolicy('carrier');
  assert.equal(drone.orbitLaps, 1);
  assert.ok(drone.orbitRadiusPx > 0);
  assert.ok(carrier.standoffPx > 0);
  assert.ok(carrier.engageMs > 0);
  assert.equal(drone.maxAlivePerOwner, 2);
  assert.equal(carrier.poolHardCap, 8);
  const swarm = getWeaponCraftLoiterPolicy('drone', 'w_missile_arc_003');
  assert.equal(swarm.profileId, 'swarm_intercept');
  assert.equal(swarm.craftCount, 3);
  assert.equal(swarm.interceptMissiles, true);
  const kamikaze = getWeaponCraftLoiterPolicy('drone', 'w_missile_arc_017');
  assert.equal(kamikaze.orbitLaps, 0);
  assert.equal(kamikaze.pierceAfterStrike, true);
  const wrap = getWeaponCraftLoiterPolicy('drone', 'w_missile_arc_016');
  assert.equal(wrap.orbitAttack, true);
  assert.ok(wrap.orbitLaps >= 2);
  const infiltrate = getWeaponCraftLoiterPolicy('carrier', 'w_missile_arc_027');
  assert.equal(infiltrate.ignoreShield, true);
  const ram = getWeaponCraftLoiterPolicy('carrier', 'w_missile_arc_036');
  assert.equal(ram.ramThenRtb, true);
  assert.ok(ram.craftHp >= 16);
  const universe = getWeaponCraftLoiterPolicy('carrier', 'w_missile_arc_071');
  assert.ok(universe.aoeRadiusPx >= 50);
  const vmock = getWeaponCraftLoiterPolicy('drone', 'w_drone_vmock_draco_v02');
  assert.equal(vmock.craftCount, 1);
  assert.equal(vmock.interceptMissiles, false);
});

test('드론 — 원궤도 후 돌입 1회 타격 · 궤도 중 피해 없음', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(8);
  const agents = poses();
  const spawned = trySpawnCapitalCraft(pool, {
    family: 'drone',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_003',
    x: 78,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.4,
    policy: FAST_DRONE,
  });
  assert.equal(spawned, true);
  let orbitHits = 0;
  let strikeHits = 0;
  for (let i = 0; i < 80; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    const craft = pool[0]!;
    if (craft.phase === 'orbit') orbitHits += scratch.count;
    if (craft.phase === 'dead') strikeHits += scratch.count;
    if (!craft.alive && scratch.count > 0) {
      strikeHits = scratch.count;
      break;
    }
  }
  assert.equal(orbitHits, 0);
  assert.equal(strikeHits, 1);
  assert.equal(scratch.events[0]?.kind, 'drone_strike');
  assert.equal(countAliveCapitalCrafts(pool), 0);
});

test('함재기 8자는 적함 중심에서 돈다', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(16);
  const agents = poses();
  assert.equal(
    trySpawnCapitalCraft(pool, {
      family: 'carrier',
      ownerAgentId: 1,
      targetAgentId: 2,
      weaponId: 'w_missile_arc_006',
      x: 60,
      y: 100,
      headingRad: 0,
      speedPxPerMs: 0.5,
      policy: FAST_CARRIER,
    }),
    true,
  );
  for (let i = 0; i < 40; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    if (pool[0]!.phase === 'figure8') break;
  }
  assert.equal(pool[0]!.phase, 'figure8');
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (let i = 0; i < 50; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    if (pool[0]!.phase !== 'figure8') break;
    sx += pool[0]!.x;
    sy += pool[0]!.y;
    n += 1;
  }
  assert.ok(n >= 20, `샘플 ${n}`);
  const mx = sx / n;
  const my = sy / n;
  assert.ok(Math.abs(mx - 100) < 8, `중심X ${mx}`);
  assert.ok(Math.abs(my - 100) < 8, `중심Y ${my}`);
  assert.ok(Math.abs(mx - 60) > 20, '적함 앞 standoff에 치우치면 안 됨');
});

test('함재기 — 8자에서 주기 공격 후 모함 귀환', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(16);
  const agents = poses();
  assert.equal(
    trySpawnCapitalCraft(pool, {
      family: 'carrier',
      ownerAgentId: 1,
      targetAgentId: 2,
      weaponId: 'w_missile_arc_006',
      x: 60,
      y: 100,
      headingRad: 0,
      speedPxPerMs: 0.5,
      policy: FAST_CARRIER,
    }),
    true,
  );
  let attacks = 0;
  let sawFigure8 = false;
  for (let i = 0; i < 120; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    const craft = pool[0]!;
    if (craft.phase === 'figure8') sawFigure8 = true;
    attacks += scratch.count;
    if (!craft.alive) break;
  }
  assert.equal(sawFigure8, true);
  assert.ok(attacks >= 2, `함재기 주기 공격 ${attacks}회`);
  assert.equal(countAliveCapitalCrafts(pool), 0);
});

test('상한 — 패밀리 8 · 소유 함선당 2', () => {
  const pool = createCapitalCraftPool();
  let familyOk = 0;
  for (let i = 0; i < 9; i++) {
    const ok = trySpawnCapitalCraft(pool, {
      family: 'drone',
      ownerAgentId: 10 + i,
      targetAgentId: 2,
      weaponId: 'w_missile_arc_003',
      x: 0,
      y: 0,
      headingRad: 0,
      speedPxPerMs: 0.2,
      policy: FAST_DRONE,
    });
    if (ok) familyOk += 1;
  }
  assert.equal(familyOk, 8);
  resetCapitalCraftPool(pool);
  let ownerOk = 0;
  for (let i = 0; i < 3; i++) {
    const ok = trySpawnCapitalCraft(pool, {
      family: 'carrier',
      ownerAgentId: 1,
      targetAgentId: 2,
      weaponId: 'w_missile_arc_006',
      x: 0,
      y: 0,
      headingRad: 0,
      speedPxPerMs: 0.2,
      policy: FAST_CARRIER,
    });
    if (ok) ownerOk += 1;
  }
  assert.equal(ownerOk, 2);
});

test('표적 격침 — 드론은 잔여 돌입 · 함재기는 즉시 귀환', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(8);
  const agents = poses();
  trySpawnCapitalCraft(pool, {
    family: 'drone',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_003',
    x: 80,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.4,
    policy: FAST_DRONE,
  });
  tickCapitalCrafts(pool, 16, agents, scratch);
  agents[2] = { x: 100, y: 100, alive: false };
  for (let i = 0; i < 40; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    if (!pool[0]!.alive) break;
  }
  assert.equal(pool[0]!.alive, false);
  assert.equal(scratch.count, 0);

  resetCapitalCraftPool(pool);
  agents[2] = { x: 100, y: 100, alive: true };
  trySpawnCapitalCraft(pool, {
    family: 'carrier',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_006',
    x: 60,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.5,
    policy: FAST_CARRIER,
  });
  tickCapitalCrafts(pool, 80, agents, scratch);
  assert.equal(pool[0]!.phase, 'figure8');
  agents[2] = { x: 100, y: 100, alive: false };
  tickCapitalCrafts(pool, 16, agents, scratch);
  assert.equal(pool[0]!.phase, 'rtb');
});

test('가속 돌격기 — 선회 없이 돌입', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(8);
  const agents = poses();
  const kamikaze: WeaponCraftLoiterPolicy = {
    ...FAST_DRONE,
    orbitLaps: 0,
    orbitEnterPx: 80,
    pierceAfterStrike: true,
    pierceMs: 80,
  };
  trySpawnCapitalCraft(pool, {
    family: 'drone',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_017',
    x: 70,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.6,
    policy: kamikaze,
  });
  let sawOrbit = false;
  let sawPierce = false;
  for (let i = 0; i < 40; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    if (pool[0]!.phase === 'orbit') sawOrbit = true;
    if (pool[0]!.phase === 'pierce') sawPierce = true;
    if (!pool[0]!.alive) break;
  }
  assert.equal(sawOrbit, false);
  assert.equal(sawPierce, true);
});

test('스파이크 — 궤도 중 소사 발생', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(16);
  const agents = poses();
  const wrap: WeaponCraftLoiterPolicy = {
    ...FAST_DRONE,
    orbitLaps: 2,
    orbitMsMax: 2000,
    orbitAttack: true,
    attackPeriodMs: 80,
  };
  trySpawnCapitalCraft(pool, {
    family: 'drone',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_016',
    x: 78,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.4,
    policy: wrap,
  });
  let orbitStrafe = 0;
  for (let i = 0; i < 40; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    if (pool[0]!.phase === 'orbit') {
      for (let k = 0; k < scratch.count; k++) {
        if (scratch.events[k]!.kind === 'orbit_strafe') orbitStrafe += 1;
      }
    }
    if (pool[0]!.phase === 'strike' || !pool[0]!.alive) break;
  }
  assert.ok(orbitStrafe >= 1, `궤도 소사 ${orbitStrafe}회`);
});

test('본선 발사 — 프로덕션·VMock 크래프트 패밀리는 loiter active', () => {
  assert.equal(isCraftLoiterRuntimeActive('w_missile_arc_003'), true);
  assert.equal(isCraftLoiterRuntimeActive('w_missile_arc_006'), true);
  assert.equal(isCraftLoiterRuntimeActive('w_drone_vmock_draco_v02'), true);
  assert.equal(isCraftLoiterRuntimeActive('w_carrier_vmock_draco_v01'), true);
  assert.equal(isCraftLoiterRuntimeActive('w_missile_arc_022'), false);
  assert.equal(isCraftLoiterRuntimeActive('w_laser_light_01'), false);
});

test('일제 스폰 — 소유 상한이면 가장 오래된 기체 회수', () => {
  const pool = createCapitalCraftPool();
  resetCapitalCraftPool(pool);
  const policy: WeaponCraftLoiterPolicy = {
    ...FAST_DRONE,
    craftCount: 3,
    maxAlivePerOwner: 3,
  };
  const input = {
    family: 'drone' as const,
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_003',
    x: 0,
    y: 0,
    headingRad: 0,
    speedPxPerMs: 0.2,
    policy,
  };
  assert.equal(trySpawnCapitalCraftVolley(pool, input, 0, 1, 9), 3);
  const firstOrdinals = pool.filter((c) => c.alive).map((c) => c.spawnOrdinal).sort((a, b) => a - b);
  assert.deepEqual(firstOrdinals, [1, 2, 3]);
  assert.equal(trySpawnCapitalCraftVolley(pool, input, 0, 1, 9), 3);
  assert.equal(countAliveCapitalCrafts(pool), 3);
  const secondOrdinals = pool.filter((c) => c.alive).map((c) => c.spawnOrdinal).sort((a, b) => a - b);
  assert.deepEqual(secondOrdinals, [4, 5, 6]);
});

test('일제 3기 — 출발·궤도 위상·타격 시점이 갈라진다', () => {
  const pool = createCapitalCraftPool();
  resetCapitalCraftPool(pool);
  const scratch = createCapitalCraftImpactScratch(16);
  const agents = poses();
  const policy: WeaponCraftLoiterPolicy = {
    ...FAST_DRONE,
    craftCount: 3,
    maxAlivePerOwner: 3,
    orbitMsMax: 4000,
  };
  assert.equal(
    trySpawnCapitalCraftVolley(pool, {
      family: 'drone',
      ownerAgentId: 1,
      targetAgentId: 2,
      weaponId: 'w_missile_arc_003',
      x: 0,
      y: 100,
      headingRad: 0,
      speedPxPerMs: 0.4,
      policy,
    }, 0, 1, 9),
    3,
  );
  const alive = pool.filter((c) => c.alive).sort((a, b) => a.volleyIndex - b.volleyIndex);
  assert.equal(alive.length, 3);
  assert.equal(alive[0]!.launchDelayMs, 0);
  assert.equal(alive[1]!.launchDelayMs, CRAFT_VOLLEY_LAUNCH_STAGGER_MS);
  assert.equal(alive[2]!.launchDelayMs, CRAFT_VOLLEY_LAUNCH_STAGGER_MS * 2);
  assert.ok(Math.abs(alive[1]!.orbitPhaseOffset - (Math.PI * 2) / 3) < 1e-9);
  assert.ok(Math.abs(alive[2]!.orbitPhaseOffset - (Math.PI * 4) / 3) < 1e-9);

  const strikeAt: number[] = [-1, -1, -1];
  for (let i = 0; i < 220; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    for (let k = 0; k < scratch.count; k++) {
      if (scratch.events[k]!.kind !== 'drone_strike') continue;
      for (let vi = 0; vi < alive.length; vi++) {
        if (strikeAt[vi] < 0 && !alive[vi]!.alive) strikeAt[vi] = i;
      }
    }
  }
  assert.ok(strikeAt[0] >= 0 && strikeAt[1] >= 0 && strikeAt[2] >= 0, `타격 시각 ${strikeAt.join(',')}`);
  assert.ok(strikeAt[0] < strikeAt[1], `1기 ${strikeAt[0]} < 2기 ${strikeAt[1]}`);
  assert.ok(strikeAt[1] < strikeAt[2], `2기 ${strikeAt[1]} < 3기 ${strikeAt[2]}`);

  resetCapitalCraftPool(pool);
  trySpawnCapitalCraftVolley(pool, {
    family: 'drone',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_003',
    x: 0,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.4,
    policy,
  }, 0, 1, 9);
  const spaced = pool.filter((c) => c.alive).sort((a, b) => a.volleyIndex - b.volleyIndex);
  for (let i = 0; i < 80; i++) {
    tickCapitalCrafts(pool, 16, agents, scratch);
    if (spaced.every((c) => c.phase === 'orbit' || c.phase === 'strike' || !c.alive)) break;
  }
  const inOrbit = spaced.filter((c) => c.phase === 'orbit');
  if (inOrbit.length >= 2) {
    const a0 = inOrbit[0]!.orbitAngle;
    for (let i = 1; i < inOrbit.length; i++) {
      let d = Math.abs(inOrbit[i]!.orbitAngle - a0) % (Math.PI * 2);
      if (d > Math.PI) d = Math.PI * 2 - d;
      assert.ok(d > 0.7, `궤도 간격 ${d}`);
    }
  }
});

test('드론·함재기 짧은 꼬리 — 고정 링버퍼, 이동 후 샘플, 사망 시 리셋', () => {
  const pool = createCapitalCraftPool();
  const scratch = createCapitalCraftImpactScratch(8);
  const agents = poses();
  const xs0 = pool[0]!.trailXs;
  const ys0 = pool[0]!.trailYs;
  assert.equal(xs0.length, CRAFT_TRAIL_SAMPLES);
  assert.equal(ys0.length, CRAFT_TRAIL_SAMPLES);

  trySpawnCapitalCraft(pool, {
    family: 'drone',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_003',
    x: 0,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.4,
    policy: FAST_DRONE,
  });
  assert.equal(pool[0]!.trailLen, 1);
  for (let i = 0; i < 8; i++) tickCapitalCrafts(pool, 16, agents, scratch);
  const drone = pool[0]!;
  assert.equal(drone.trailXs, xs0);
  assert.equal(drone.trailYs, ys0);
  assert.ok(drone.trailLen >= 2);
  assert.ok(drone.trailLen <= CRAFT_TRAIL_SAMPLES);

  resetCapitalCraftPool(pool);
  assert.equal(pool[0]!.trailLen, 0);

  trySpawnCapitalCraft(pool, {
    family: 'carrier',
    ownerAgentId: 1,
    targetAgentId: 2,
    weaponId: 'w_missile_arc_006',
    x: 40,
    y: 100,
    headingRad: 0,
    speedPxPerMs: 0.35,
    policy: FAST_CARRIER,
  });
  for (let i = 0; i < 12; i++) tickCapitalCrafts(pool, 16, agents, scratch);
  const carrier = pool.find((c) => c.alive && c.family === 'carrier');
  assert.ok(carrier);
  assert.ok(carrier.trailLen >= 2);
  assert.ok(carrier.trailLen <= CRAFT_TRAIL_SAMPLES);
});

console.log('capitalCraftPool.test.ts — ALL PASS');
