// ============================================================
// 심리스 PVP(최대 10:10) Mock 전투 엔진 — 난입/이탈/가변 인원 루프
// ============================================================

import type {
  FirestoreUserDocMock,
  SeamlessBattlePerformanceProfile,
  SeamlessCombatantRuntime,
  Vec2,
} from './seamlessPvpTypes';

export const SEAMLESS_BATTLE_MAX_COMBATANTS = 20;
const SEAMLESS_BATTLE_MAX_TEAM_SIZE = 10;

const PLANET_INFLUENCE_RADIUS = 120;

export function resolveSeamlessBattlePerformanceMode(isLowSpec: boolean): SeamlessBattlePerformanceProfile {
  return isLowSpec
    ? { mode: 'low_spec', targetScanIntervalMs: 1000, particleScale: 0.3 }
    : { mode: 'normal', targetScanIntervalMs: 500, particleScale: 1 };
}

/** 일정 거리 이내면 행성 영향권 진입 */
export function checkProximity(userPos: Vec2, planetPos: Vec2, radius: number = PLANET_INFLUENCE_RADIUS): boolean {
  const dx = userPos.x - planetPos.x;
  const dy = userPos.y - planetPos.y;
  return dx * dx + dy * dy <= radius * radius;
}

function isAutoJoinStatus(status: FirestoreUserDocMock['status']): boolean {
  return status === 'moving' || status === 'planet_landed' || status === 'combat_ready';
}

function inferTeamForJoin(users: FirestoreUserDocMock[], activeCombatants: string[]): 'alpha' | 'beta' | null {
  const active = users.filter(u => activeCombatants.includes(u.uid));
  const alpha = active.filter(u => u.team === 'alpha').length;
  const beta = active.filter(u => u.team === 'beta').length;
  if (alpha >= SEAMLESS_BATTLE_MAX_TEAM_SIZE && beta >= SEAMLESS_BATTLE_MAX_TEAM_SIZE) return null;
  if (alpha <= beta && alpha < SEAMLESS_BATTLE_MAX_TEAM_SIZE) return 'alpha';
  if (beta < SEAMLESS_BATTLE_MAX_TEAM_SIZE) return 'beta';
  return null;
}

function upsertRuntime(
  runtimes: Record<string, SeamlessCombatantRuntime>,
  user: FirestoreUserDocMock,
  nowMs: number,
  profile: SeamlessBattlePerformanceProfile,
): void {
  const maxHp = Math.max(1, Math.round(user.shipStats.hull + user.shipStats.shield));
  const existing = runtimes[user.uid];
  if (!existing) {
    runtimes[user.uid] = {
      uid: user.uid,
      team: user.team === 'beta' ? 'beta' : 'alpha',
      hp: maxHp,
      maxHp,
      alive: true,
      targetUid: null,
      nextTargetScanAtMs: nowMs + profile.targetScanIntervalMs,
    };
    return;
  }
  existing.team = user.team === 'beta' ? 'beta' : 'alpha';
  existing.maxHp = maxHp;
  existing.hp = Math.min(existing.hp, maxHp);
}

function pickNearestEnemyUid(
  selfUid: string,
  usersByUid: Record<string, FirestoreUserDocMock>,
  runtimes: Record<string, SeamlessCombatantRuntime>,
  activeCombatants: string[],
): string | null {
  const self = usersByUid[selfUid];
  const selfRt = runtimes[selfUid];
  if (!self || !selfRt) return null;
  const enemies = activeCombatants.filter(uid => {
    if (uid === selfUid) return false;
    const rt = runtimes[uid];
    return Boolean(rt?.alive && rt.team !== selfRt.team);
  });
  if (enemies.length === 0) return null;

  let bestUid: string | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  enemies.forEach(uid => {
    const other = usersByUid[uid];
    if (!other) return;
    const dx = other.position.x - self.position.x;
    const dy = other.position.y - self.position.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      bestUid = uid;
    }
  });
  return bestUid;
}

export interface SeamlessBattleTickInput {
  users: FirestoreUserDocMock[];
  activeCombatants: string[];
  runtimes: Record<string, SeamlessCombatantRuntime>;
  planetPos: Vec2;
  nowMs: number;
  isLowSpec: boolean;
}

export interface SeamlessBattleTickOutput {
  users: FirestoreUserDocMock[];
  activeCombatants: string[];
  runtimes: Record<string, SeamlessCombatantRuntime>;
  performance: SeamlessBattlePerformanceProfile;
}

/**
 * 난입형 무한 루프의 1 tick.
 * - push/splice 기반으로 activeCombatants를 가변 유지
 * - 타겟 갱신은 0.5s(저사양 1.0s) 스로틀
 */
export function tickSeamlessBattle(input: SeamlessBattleTickInput): SeamlessBattleTickOutput {
  const users = input.users.map(u => ({ ...u, position: { ...u.position } }));
  const activeCombatants = [...input.activeCombatants];
  const runtimes: Record<string, SeamlessCombatantRuntime> = { ...input.runtimes };
  const performance = resolveSeamlessBattlePerformanceMode(input.isLowSpec);

  const usersByUid: Record<string, FirestoreUserDocMock> = {};
  users.forEach(u => {
    usersByUid[u.uid] = u;
  });

  // 1) 영향권 기반 즉시 난입 주입 (Injection)
  users.forEach(u => {
    if (!isAutoJoinStatus(u.status)) return;
    if (!checkProximity(u.position, input.planetPos)) return;
    if (activeCombatants.includes(u.uid)) return;
    if (activeCombatants.length >= SEAMLESS_BATTLE_MAX_COMBATANTS) return;
    const team = inferTeamForJoin(users, activeCombatants);
    if (!team) return;
    u.team = team;
    u.status = 'combat';
    u.planetId = u.planetId ?? 'seamless_battle_planet';
    activeCombatants.push(u.uid);
    upsertRuntime(runtimes, u, input.nowMs, performance);
  });

  // 2) 영향권 이탈/오프라인 이탈 처리 (splice)
  for (let i = activeCombatants.length - 1; i >= 0; i--) {
    const uid = activeCombatants[i];
    const u = usersByUid[uid];
    if (!u) {
      activeCombatants.splice(i, 1);
      delete runtimes[uid];
      continue;
    }
    const shouldLeave = u.status === 'offline' || !checkProximity(u.position, input.planetPos);
    if (!shouldLeave) continue;
    u.status = 'planet_landed';
    activeCombatants.splice(i, 1);
    delete runtimes[uid];
  }

  // 3) 타겟 탐색 스로틀 루프 (Array.filter + Array.forEach 기반)
  activeCombatants
    .filter(uid => Boolean(runtimes[uid]?.alive))
    .forEach(uid => {
      const rt = runtimes[uid];
      if (!rt) return;
      if (input.nowMs < rt.nextTargetScanAtMs) return;
      rt.targetUid = pickNearestEnemyUid(uid, usersByUid, runtimes, activeCombatants);
      rt.nextTargetScanAtMs = input.nowMs + performance.targetScanIntervalMs;
    });

  return { users, activeCombatants, runtimes, performance };
}
