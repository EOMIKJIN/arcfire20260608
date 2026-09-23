// ============================================================
// STAGE 3 드론·함재기 — 사전할당 CapitalCraft 풀
// 미사일 베지어와 분리. 틱에서 신규 객체/배열 할당 금지.
// ============================================================

import type { WeaponCraftFamilyKind, WeaponCraftLoiterPolicy } from './weaponCraftLoiterPolicy';

export type CapitalCraftFamily = WeaponCraftFamilyKind;

export type CapitalCraftPhase =
  | 'dead'
  | 'approach'
  | 'orbit'
  | 'strike'
  | 'figure8'
  | 'rtb'
  | 'pierce';

export type CapitalCraft = {
  slot: number;
  alive: boolean;
  family: CapitalCraftFamily;
  phase: CapitalCraftPhase;
  ownerAgentId: number;
  targetAgentId: number;
  weaponId: string;
  x: number;
  y: number;
  headingRad: number;
  hp: number;
  lastTargetX: number;
  lastTargetY: number;
  lastOwnerX: number;
  lastOwnerY: number;
  approachSpeedPxPerMs: number;
  orbitRadiusPx: number;
  orbitEnterPx: number;
  orbitLaps: number;
  orbitMsMax: number;
  strikeHitPx: number;
  orbitAngle: number;
  orbitAccumRad: number;
  orbitElapsedMs: number;
  standoffPx: number;
  figure8RadiusPx: number;
  figure8PeriodMs: number;
  engageRemainMs: number;
  attackPeriodMs: number;
  attackCooldownMs: number;
  figure8ElapsedMs: number;
  figure8HeadingRad: number;
  recoverPx: number;
  orbitAttack: boolean;
  ignoreShield: boolean;
  aoeRadiusPx: number;
  pierceAfterStrike: boolean;
  ramThenRtb: boolean;
  interceptMissiles: boolean;
  pierceRemainMs: number;
  slowMul: number;
  slowMs: number;
  spawnOrdinal: number;
  /** 일제 발사 순번(0..) — 출발·궤도·타격 시차 */
  volleyIndex: number;
  launchHeadingRad: number;
  orbitPhaseOffset: number;
  orbitExtraRad: number;
  launchDelayMs: number;
  /** 짧은 꼬리 — 풀 생성 시 고정 배열. 틱에서 신규 할당 금지 */
  trailXs: number[];
  trailYs: number[];
  trailLen: number;
  trailWrite: number;
};

export type CapitalCraftAgentPose = {
  x: number;
  y: number;
  alive: boolean;
};

export type CapitalCraftImpactKind = 'drone_strike' | 'carrier_attack' | 'orbit_strafe';

export type CapitalCraftImpactEvent = {
  ownerAgentId: number;
  targetAgentId: number;
  weaponId: string;
  x: number;
  y: number;
  family: CapitalCraftFamily;
  kind: CapitalCraftImpactKind;
  ignoreShield: boolean;
  aoeRadiusPx: number;
  slowMul: number;
  slowMs: number;
};

export type CapitalCraftImpactScratch = {
  events: CapitalCraftImpactEvent[];
  count: number;
};

export type CapitalCraftSpawnInput = {
  family: CapitalCraftFamily;
  ownerAgentId: number;
  targetAgentId: number;
  weaponId: string;
  x: number;
  y: number;
  headingRad: number;
  speedPxPerMs: number;
  policy: WeaponCraftLoiterPolicy;
  volleyIndex?: number;
  volleyCount?: number;
};

/** 드론 8 + 함재기 8. 패밀리별 poolHardCap 과 맞춤 */
export const CAPITAL_CRAFT_POOL_SIZE = 16;
/** 일제 2기째부터 출발 간격. 틱 할당 없음 */
export const CRAFT_VOLLEY_LAUNCH_STAGGER_MS = 140;
/** 짧은 꼬리 샘플. 4px 간격이면 약 20px 잔상 */
export const CRAFT_TRAIL_SAMPLES = 6;
const CRAFT_TRAIL_MIN_SPACING_SQ = 16;

/** 항창 회수 FIFO. 풀 리셋 때 0 */
let nextCraftSpawnOrdinal = 1;

function createEmptyCraft(slot: number): CapitalCraft {
  return {
    slot,
    alive: false,
    family: 'drone',
    phase: 'dead',
    ownerAgentId: 0,
    targetAgentId: 0,
    weaponId: '',
    x: 0,
    y: 0,
    headingRad: 0,
    hp: 0,
    lastTargetX: 0,
    lastTargetY: 0,
    lastOwnerX: 0,
    lastOwnerY: 0,
    approachSpeedPxPerMs: 0,
    orbitRadiusPx: 0,
    orbitEnterPx: 0,
    orbitLaps: 0,
    orbitMsMax: 0,
    strikeHitPx: 0,
    orbitAngle: 0,
    orbitAccumRad: 0,
    orbitElapsedMs: 0,
    standoffPx: 0,
    figure8RadiusPx: 0,
    figure8PeriodMs: 0,
    engageRemainMs: 0,
    attackPeriodMs: 0,
    attackCooldownMs: 0,
    figure8ElapsedMs: 0,
    figure8HeadingRad: 0,
    recoverPx: 0,
    orbitAttack: false,
    ignoreShield: false,
    aoeRadiusPx: 0,
    pierceAfterStrike: false,
    ramThenRtb: false,
    interceptMissiles: false,
    pierceRemainMs: 0,
    slowMul: 0,
    slowMs: 0,
    spawnOrdinal: 0,
    volleyIndex: 0,
    launchHeadingRad: 0,
    orbitPhaseOffset: 0,
    orbitExtraRad: 0,
    launchDelayMs: 0,
    trailXs: new Array<number>(CRAFT_TRAIL_SAMPLES).fill(0),
    trailYs: new Array<number>(CRAFT_TRAIL_SAMPLES).fill(0),
    trailLen: 0,
    trailWrite: 0,
  };
}

function resetCraftTrail(c: CapitalCraft): void {
  c.trailLen = 0;
  c.trailWrite = 0;
}

function recordCraftTrail(c: CapitalCraft): void {
  const xs = c.trailXs;
  const ys = c.trailYs;
  if (c.trailLen > 0) {
    const last = (c.trailWrite - 1 + CRAFT_TRAIL_SAMPLES) % CRAFT_TRAIL_SAMPLES;
    const dx = c.x - xs[last]!;
    const dy = c.y - ys[last]!;
    if (dx * dx + dy * dy < CRAFT_TRAIL_MIN_SPACING_SQ) return;
  }
  xs[c.trailWrite] = c.x;
  ys[c.trailWrite] = c.y;
  c.trailWrite = (c.trailWrite + 1) % CRAFT_TRAIL_SAMPLES;
  if (c.trailLen < CRAFT_TRAIL_SAMPLES) c.trailLen += 1;
}

function createEmptyImpact(): CapitalCraftImpactEvent {
  return {
    ownerAgentId: 0,
    targetAgentId: 0,
    weaponId: '',
    x: 0,
    y: 0,
    family: 'drone',
    kind: 'drone_strike',
    ignoreShield: false,
    aoeRadiusPx: 0,
    slowMul: 0,
    slowMs: 0,
  };
}

export function createCapitalCraftPool(): CapitalCraft[] {
  const pool = new Array<CapitalCraft>(CAPITAL_CRAFT_POOL_SIZE);
  for (let i = 0; i < CAPITAL_CRAFT_POOL_SIZE; i++) {
    pool[i] = createEmptyCraft(i);
  }
  return pool;
}

export function createCapitalCraftImpactScratch(cap: number): CapitalCraftImpactScratch {
  const n = Math.max(1, cap);
  const events = new Array<CapitalCraftImpactEvent>(n);
  for (let i = 0; i < n; i++) {
    events[i] = createEmptyImpact();
  }
  return { events, count: 0 };
}

export function resetCapitalCraftPool(pool: CapitalCraft[]): void {
  nextCraftSpawnOrdinal = 1;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i]!;
    c.alive = false;
    c.phase = 'dead';
    c.weaponId = '';
    c.hp = 0;
    c.spawnOrdinal = 0;
    resetCraftTrail(c);
  }
}

export function countAliveCapitalCrafts(pool: CapitalCraft[]): number {
  let n = 0;
  for (let i = 0; i < pool.length; i++) {
    if (pool[i]!.alive) n += 1;
  }
  return n;
}

function countAliveFamily(pool: CapitalCraft[], family: CapitalCraftFamily): number {
  let n = 0;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i]!;
    if (c.alive && c.family === family) n += 1;
  }
  return n;
}

function countAliveOwnerFamily(
  pool: CapitalCraft[],
  ownerAgentId: number,
  family: CapitalCraftFamily,
): number {
  let n = 0;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i]!;
    if (c.alive && c.family === family && c.ownerAgentId === ownerAgentId) n += 1;
  }
  return n;
}

function hasEmptyCraftSlot(pool: CapitalCraft[]): boolean {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i]!.alive) return true;
  }
  return false;
}

function canAcceptCapitalCraftSpawn(pool: CapitalCraft[], input: CapitalCraftSpawnInput): boolean {
  if (countAliveFamily(pool, input.family) >= input.policy.poolHardCap) return false;
  if (countAliveOwnerFamily(pool, input.ownerAgentId, input.family) >= input.policy.maxAlivePerOwner) {
    return false;
  }
  return hasEmptyCraftSlot(pool);
}

/** 재장전 < 선회수명일 때 항창 회수. 소유 함선 기체를 우선. */
function recycleBlockingCraft(
  pool: CapitalCraft[],
  family: CapitalCraftFamily,
  ownerAgentId: number,
  ownerOnly: boolean,
): boolean {
  let best: CapitalCraft | null = null;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i]!;
    if (!c.alive || c.family !== family) continue;
    if (ownerOnly && c.ownerAgentId !== ownerAgentId) continue;
    if (!best) {
      best = c;
      continue;
    }
    const cOwner = c.ownerAgentId === ownerAgentId;
    const bOwner = best.ownerAgentId === ownerAgentId;
    if (cOwner !== bOwner) {
      if (cOwner) best = c;
      continue;
    }
    if (c.spawnOrdinal < best.spawnOrdinal) best = c;
  }
  if (!best) return false;
  killCraft(best);
  return true;
}

function recycleForSpawn(pool: CapitalCraft[], input: CapitalCraftSpawnInput): boolean {
  if (countAliveOwnerFamily(pool, input.ownerAgentId, input.family) >= input.policy.maxAlivePerOwner) {
    return recycleBlockingCraft(pool, input.family, input.ownerAgentId, true);
  }
  if (countAliveFamily(pool, input.family) >= input.policy.poolHardCap || !hasEmptyCraftSlot(pool)) {
    return recycleBlockingCraft(pool, input.family, input.ownerAgentId, false);
  }
  return false;
}

function pushImpact(
  scratch: CapitalCraftImpactScratch,
  c: CapitalCraft,
  kind: CapitalCraftImpactKind,
): void {
  if (scratch.count >= scratch.events.length) return;
  const ev = scratch.events[scratch.count]!;
  ev.ownerAgentId = c.ownerAgentId;
  ev.targetAgentId = c.targetAgentId;
  ev.weaponId = c.weaponId;
  ev.x = c.x;
  ev.y = c.y;
  ev.family = c.family;
  ev.kind = kind;
  ev.ignoreShield = c.ignoreShield;
  ev.aoeRadiusPx = c.aoeRadiusPx;
  ev.slowMul = c.slowMul;
  ev.slowMs = c.slowMs;
  scratch.count += 1;
}

function killCraft(c: CapitalCraft): void {
  c.alive = false;
  c.phase = 'dead';
  resetCraftTrail(c);
}

function moveToward(c: CapitalCraft, tx: number, ty: number, dtMs: number): number {
  const dx = tx - c.x;
  const dy = ty - c.y;
  const d = Math.hypot(dx, dy);
  if (d <= 1e-6) {
    return 0;
  }
  const step = Math.max(1e-5, c.approachSpeedPxPerMs) * dtMs;
  if (step >= d) {
    c.x = tx;
    c.y = ty;
    c.headingRad = Math.atan2(dy, dx);
    return 0;
  }
  const inv = 1 / d;
  c.x += dx * inv * step;
  c.y += dy * inv * step;
  c.headingRad = Math.atan2(dy, dx);
  return d - step;
}

function refreshAnchors(
  c: CapitalCraft,
  agentsById: (CapitalCraftAgentPose | undefined)[],
): { targetAlive: boolean; ownerAlive: boolean } {
  const target = agentsById[c.targetAgentId];
  const owner = agentsById[c.ownerAgentId];
  let targetAlive = false;
  let ownerAlive = false;
  if (target?.alive) {
    c.lastTargetX = target.x;
    c.lastTargetY = target.y;
    targetAlive = true;
  }
  if (owner?.alive) {
    c.lastOwnerX = owner.x;
    c.lastOwnerY = owner.y;
    ownerAlive = true;
  }
  return { targetAlive, ownerAlive };
}

function enterOrbit(c: CapitalCraft): void {
  c.phase = 'orbit';
  c.orbitAngle = Math.atan2(c.y - c.lastTargetY, c.x - c.lastTargetX);
  c.orbitAccumRad = 0;
  c.orbitElapsedMs = 0;
  c.attackCooldownMs = 0;
  const r = Math.max(4, c.orbitRadiusPx);
  c.x = c.lastTargetX + Math.cos(c.orbitAngle) * r;
  c.y = c.lastTargetY + Math.sin(c.orbitAngle) * r;
}

function enterFigure8(c: CapitalCraft): void {
  c.phase = 'figure8';
  // 접근 측 날개에서 시작 — 적함 중심(u=0)으로 순간이동하지 않음
  c.figure8ElapsedMs = Math.max(1, c.figure8PeriodMs) * 0.75;
  c.figure8HeadingRad = c.headingRad;
  c.attackCooldownMs = 0;
}

function tickOrbitAttack(c: CapitalCraft, dtMs: number, targetAlive: boolean, scratch: CapitalCraftImpactScratch): void {
  if (!c.orbitAttack || !targetAlive || c.attackPeriodMs <= 0) return;
  c.attackCooldownMs -= dtMs;
  if (c.attackCooldownMs <= 0) {
    pushImpact(scratch, c, 'orbit_strafe');
    c.attackCooldownMs += Math.max(1, c.attackPeriodMs);
  }
}

function finishStrike(c: CapitalCraft, targetAlive: boolean, scratch: CapitalCraftImpactScratch): void {
  if (targetAlive) {
    pushImpact(scratch, c, c.family === 'carrier' ? 'carrier_attack' : 'drone_strike');
  }
  if (c.pierceAfterStrike && c.pierceRemainMs > 0) {
    c.phase = 'pierce';
    return;
  }
  if (c.ramThenRtb) {
    c.phase = 'rtb';
    return;
  }
  killCraft(c);
}

function tickStrike(c: CapitalCraft, dtMs: number, targetAlive: boolean, scratch: CapitalCraftImpactScratch): void {
  const remain = moveToward(c, c.lastTargetX, c.lastTargetY, dtMs);
  if (remain <= c.strikeHitPx) {
    finishStrike(c, targetAlive, scratch);
  }
}

function tickPierce(c: CapitalCraft, dtMs: number): void {
  const step = Math.max(1e-5, c.approachSpeedPxPerMs) * dtMs;
  c.x += Math.cos(c.headingRad) * step;
  c.y += Math.sin(c.headingRad) * step;
  c.pierceRemainMs -= dtMs;
  if (c.pierceRemainMs <= 0) {
    killCraft(c);
  }
}

function tickDrone(
  c: CapitalCraft,
  dtMs: number,
  targetAlive: boolean,
  scratch: CapitalCraftImpactScratch,
): void {
  if (c.phase === 'approach') {
    if (c.launchDelayMs > 0) {
      c.launchDelayMs -= dtMs;
      return;
    }
    let destX = c.lastTargetX;
    let destY = c.lastTargetY;
    if (c.orbitLaps > 0) {
      const enterR = Math.max(4, c.orbitEnterPx);
      const entryAngle = c.launchHeadingRad + Math.PI + c.orbitPhaseOffset;
      destX = c.lastTargetX + Math.cos(entryAngle) * enterR;
      destY = c.lastTargetY + Math.sin(entryAngle) * enterR;
    }
    const remain = moveToward(c, destX, destY, dtMs);
    if (c.orbitLaps <= 0) {
      if (remain <= Math.max(c.orbitEnterPx, c.strikeHitPx + 4)) {
        c.phase = 'strike';
      }
      return;
    }
    if (remain <= 2) {
      enterOrbit(c);
    }
    return;
  }
  if (c.phase === 'orbit') {
    const r = Math.max(4, c.orbitRadiusPx);
    const omega = Math.max(1e-5, c.approachSpeedPxPerMs) / r;
    const dAngle = omega * dtMs;
    c.orbitAngle += dAngle;
    c.orbitAccumRad += dAngle;
    c.orbitElapsedMs += dtMs;
    c.x = c.lastTargetX + Math.cos(c.orbitAngle) * r;
    c.y = c.lastTargetY + Math.sin(c.orbitAngle) * r;
    c.headingRad = c.orbitAngle + Math.PI * 0.5;
    tickOrbitAttack(c, dtMs, targetAlive, scratch);
    const lapsDone = c.orbitAccumRad >= c.orbitLaps * Math.PI * 2 + c.orbitExtraRad;
    const timeUp = c.orbitMsMax > 0 && c.orbitElapsedMs >= c.orbitMsMax;
    if (lapsDone || timeUp || !targetAlive) {
      c.phase = 'strike';
    }
    return;
  }
  if (c.phase === 'strike') {
    tickStrike(c, dtMs, targetAlive, scratch);
    return;
  }
  if (c.phase === 'pierce') {
    tickPierce(c, dtMs);
  }
}

function tickCarrier(
  c: CapitalCraft,
  dtMs: number,
  targetAlive: boolean,
  scratch: CapitalCraftImpactScratch,
): void {
  if (c.phase === 'approach') {
    const remain = moveToward(c, c.lastTargetX, c.lastTargetY, dtMs);
    if (remain <= c.standoffPx || !targetAlive) {
      if (!targetAlive) {
        c.phase = 'rtb';
        return;
      }
      enterFigure8(c);
    }
    return;
  }
  if (c.phase === 'figure8') {
    if (!targetAlive) {
      c.phase = 'rtb';
      return;
    }
    c.figure8ElapsedMs += dtMs;
    c.engageRemainMs -= dtMs;
    const period = Math.max(1, c.figure8PeriodMs);
    const a = Math.max(4, c.figure8RadiusPx);
    const u = (Math.PI * 2 * c.figure8ElapsedMs) / period;
    const lx = a * Math.sin(u);
    const ly = a * Math.sin(u) * Math.cos(u);
    const h = c.figure8HeadingRad;
    const cos = Math.cos(h);
    const sin = Math.sin(h);
    c.x = c.lastTargetX + lx * cos - ly * sin;
    c.y = c.lastTargetY + lx * sin + ly * cos;
    const dlx = a * Math.cos(u);
    const dly = a * Math.cos(2 * u);
    c.headingRad = Math.atan2(dlx * sin + dly * cos, dlx * cos - dly * sin);
    c.attackCooldownMs -= dtMs;
    if (c.attackCooldownMs <= 0) {
      pushImpact(scratch, c, 'carrier_attack');
      c.attackCooldownMs += Math.max(1, c.attackPeriodMs);
    }
    if (c.engageRemainMs <= 0) {
      c.phase = c.ramThenRtb ? 'strike' : 'rtb';
    }
    return;
  }
  if (c.phase === 'strike') {
    tickStrike(c, dtMs, targetAlive, scratch);
    return;
  }
  if (c.phase === 'pierce') {
    tickPierce(c, dtMs);
    return;
  }
  if (c.phase === 'rtb') {
    const remain = moveToward(c, c.lastOwnerX, c.lastOwnerY, dtMs);
    if (remain <= c.recoverPx) {
      killCraft(c);
    }
  }
}

export function trySpawnCapitalCraft(pool: CapitalCraft[], input: CapitalCraftSpawnInput): boolean {
  const { family, policy } = input;
  if (countAliveFamily(pool, family) >= policy.poolHardCap) return false;
  if (countAliveOwnerFamily(pool, input.ownerAgentId, family) >= policy.maxAlivePerOwner) {
    return false;
  }
  let slot: CapitalCraft | null = null;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i]!;
    if (!c.alive) {
      slot = c;
      break;
    }
  }
  if (!slot) return false;
  slot.alive = true;
  slot.family = family;
  slot.phase = 'approach';
  slot.ownerAgentId = input.ownerAgentId;
  slot.targetAgentId = input.targetAgentId;
  slot.weaponId = input.weaponId;
  slot.x = input.x;
  slot.y = input.y;
  slot.headingRad = input.headingRad;
  slot.hp = policy.craftHp;
  slot.lastTargetX = input.x;
  slot.lastTargetY = input.y;
  slot.lastOwnerX = input.x;
  slot.lastOwnerY = input.y;
  slot.approachSpeedPxPerMs = Math.max(1e-5, input.speedPxPerMs);
  slot.orbitRadiusPx = policy.orbitRadiusPx;
  slot.orbitEnterPx = policy.orbitEnterPx;
  slot.orbitLaps = policy.orbitLaps;
  slot.orbitMsMax = policy.orbitMsMax;
  slot.strikeHitPx = policy.strikeHitPx;
  slot.orbitAngle = 0;
  slot.orbitAccumRad = 0;
  slot.orbitElapsedMs = 0;
  slot.standoffPx = policy.standoffPx;
  slot.figure8RadiusPx = policy.figure8RadiusPx;
  slot.figure8PeriodMs = policy.figure8PeriodMs;
  slot.engageRemainMs = policy.engageMs;
  slot.attackPeriodMs = policy.attackPeriodMs;
  slot.attackCooldownMs = 0;
  slot.figure8ElapsedMs = 0;
  slot.figure8HeadingRad = input.headingRad;
  slot.recoverPx = policy.recoverPx;
  slot.orbitAttack = policy.orbitAttack;
  slot.ignoreShield = policy.ignoreShield;
  slot.aoeRadiusPx = policy.aoeRadiusPx;
  slot.pierceAfterStrike = policy.pierceAfterStrike;
  slot.ramThenRtb = policy.ramThenRtb;
  slot.interceptMissiles = policy.interceptMissiles;
  slot.pierceRemainMs = policy.pierceMs;
  slot.slowMul = policy.slowMul;
  slot.slowMs = policy.slowMs;
  slot.spawnOrdinal = nextCraftSpawnOrdinal++;
  const volleyCount = Math.max(1, input.volleyCount ?? 1);
  const volleyIndex = Math.max(0, Math.floor(input.volleyIndex ?? 0));
  slot.volleyIndex = volleyIndex;
  slot.launchHeadingRad = input.headingRad;
  slot.orbitPhaseOffset = volleyCount > 1 ? (Math.PI * 2 * volleyIndex) / volleyCount : 0;
  slot.orbitExtraRad = volleyCount > 1 ? (Math.PI * 2 * volleyIndex) / volleyCount : 0;
  slot.launchDelayMs = volleyCount > 1 ? volleyIndex * CRAFT_VOLLEY_LAUNCH_STAGGER_MS : 0;
  slot.orbitMsMax = policy.orbitMsMax + slot.launchDelayMs;
  if (policy.orbitAttack && policy.attackPeriodMs > 0 && volleyCount > 1) {
    slot.attackCooldownMs = (volleyIndex * policy.attackPeriodMs) / volleyCount;
  }
  resetCraftTrail(slot);
  recordCraftTrail(slot);
  return true;
}

/**
 * 본선 발사 큐용 일제 스폰. craftCount 만큼 측면 전개.
 * 상한에 걸리면 가장 오래된 동패밀리 기체를 회수하고 다시 띄운다.
 */
export function trySpawnCapitalCraftVolley(
  pool: CapitalCraft[],
  input: CapitalCraftSpawnInput,
  lateralNx: number,
  lateralNy: number,
  lateralStepPx: number,
): number {
  const wanted = Math.max(1, input.policy.craftCount);
  const ox = input.x;
  const oy = input.y;
  let spawned = 0;
  for (let ci = 0; ci < wanted; ci++) {
    if (!canAcceptCapitalCraftSpawn(pool, input)) {
      recycleForSpawn(pool, input);
    }
    const lat = (ci - (wanted - 1) * 0.5) * lateralStepPx;
    input.x = ox + lateralNx * lat;
    input.y = oy + lateralNy * lat;
    input.volleyIndex = ci;
    input.volleyCount = wanted;
    if (trySpawnCapitalCraft(pool, input)) spawned += 1;
  }
  input.x = ox;
  input.y = oy;
  return spawned;
}

export function tickCapitalCrafts(
  pool: CapitalCraft[],
  dtMs: number,
  agentsById: (CapitalCraftAgentPose | undefined)[],
  scratch: CapitalCraftImpactScratch,
): void {
  scratch.count = 0;
  const step = Math.max(0, dtMs);
  if (step <= 0) return;
  for (let i = 0; i < pool.length; i++) {
    const c = pool[i]!;
    if (!c.alive) continue;
    const { targetAlive } = refreshAnchors(c, agentsById);
    if (c.family === 'drone') {
      tickDrone(c, step, targetAlive, scratch);
    } else {
      tickCarrier(c, step, targetAlive, scratch);
    }
    if (c.alive) recordCraftTrail(c);
  }
}
