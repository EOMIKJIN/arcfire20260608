// ============================================================
// 자본 실시간 전투 재개 스냅샷 — 메인스테이지 출발(은하지도 이동) 시
// 활성 전투 sim 의 핵심 진척(전함 HP·생사·리스폰·세션 시간)을 보존하고,
// 같은 행성·성계로 돌아왔을 때 그대로 이어가게 한다.
//
// 보존 범위(의도적으로 좁게):
//   - sessionKey(`<planetId>:<systemId>`)
//   - 시뮬 누적 시간(elapsed)
//   - 에이전트별: team / npcShipId / captainId / hullHp / shieldHp / alive / lastDestroyedAtMs
//   - 리스폰 타이머(있으면) — elapsed 기준 절대값
//   - waveOutcomeAwarded — 같은 세션의 보상 중복 지급 방지
//   - duelSpawnVariant — 동일 진형으로 재시작
//
// 의도적으로 *제외*:
//   - 미사일·이펙트 in-flight (시각 진행 상태일 뿐, 게임 진척에 큰 영향 없음)
//   - 함선 위치/속도/요각속도 (재배치는 `initAgents` 결과를 그대로 재사용)
//   - 표적 잠금·살보 진행 (재교전 시작이 자연스러움)
//
// 영속성: in-memory only. 앱 재시작·프로세스 재기동 시 전투는 깨끗하게 초기화된다.
// (이 정책은 의도적이며, 영속이 필요하다면 추후 AsyncStorage로 확장.)
// ============================================================

import type { Agent } from '../components/planet/PlanetEdenRaidTestLayer';

export type CombatResumeAgentTeam = 'red' | 'blue' | 'orange';
export type CombatResumeDuelSpawnVariant = 0 | 1 | 2;

export interface CombatResumeAgentEntry {
  team: CombatResumeAgentTeam;
  /** 슬롯 매칭용 — null도 그대로 보존 */
  npcShipId: string | null;
  captainId: string | null;
  hullHp: number;
  maxHullHp: number;
  shieldHp: number;
  maxShieldHp: number;
  alive: boolean;
  lastDestroyedAtMs: number;
}

export interface CombatResumeSnapshot {
  /** `<planetId>:<systemId>` — sim의 sessionCombatKeyRef와 동일 형식 */
  sessionKey: string;
  /** sim elapsed(ms) — 다음 sim의 elapsedCarry로 사용 */
  elapsedMs: number;
  agents: CombatResumeAgentEntry[];
  /** elapsed 기준 절대 시각. 격침 후 리스폰 진행 중일 때만 값 보존. */
  respawnAtElapsedMs: number | null;
  waveOutcomeAwarded: boolean;
  duelSpawnVariant: CombatResumeDuelSpawnVariant;
  /** 디버깅·만료 판정용 wall clock(ms) */
  suspendedAtMs: number;
}

let cached: CombatResumeSnapshot | null = null;

export function makeCombatSessionKey(planetId: string, systemId: string | null): string {
  return `${planetId}:${systemId ?? ''}`;
}

/**
 * 활성 sim 의 refs로부터 스냅샷을 캡처한다.
 *
 * @param sessionKey   `makeCombatSessionKey(planetId, systemId)` 결과
 * @param elapsedMs    sim의 lastElapsedRef(또는 elapsedCarryRef) 현재 값
 * @param agents       sim.agentsRef.current — 호출 시점에 그대로 사용
 * @param respawnAtElapsedMs  sim.respawnAtWallRef.current — null도 그대로
 * @param waveOutcomeAwarded  sim.waveOutcomeAwardedRef.current
 * @param duelSpawnVariant    sim.duelSpawnVariantRef.current
 * @param suspendedAtMs       wall clock(ms) — 보통 Date.now()
 *
 * 적합한 sim 상태가 아니거나 에이전트가 없으면 스냅샷을 비운다.
 */
export function captureCombatResumeSnapshot(opts: {
  sessionKey: string;
  elapsedMs: number;
  agents: Agent[];
  respawnAtElapsedMs: number | null;
  waveOutcomeAwarded: boolean;
  duelSpawnVariant: CombatResumeDuelSpawnVariant;
  suspendedAtMs: number;
}): void {
  const {
    sessionKey,
    elapsedMs,
    agents,
    respawnAtElapsedMs,
    waveOutcomeAwarded,
    duelSpawnVariant,
    suspendedAtMs,
  } = opts;
  if (!sessionKey || agents.length === 0) {
    cached = null;
    return;
  }
  const entries: CombatResumeAgentEntry[] = agents.map((a) => ({
    team: a.team,
    npcShipId: a.npcShipId,
    captainId: a.captainId,
    hullHp: Math.max(0, a.hullHp),
    maxHullHp: Math.max(1, a.maxHullHp),
    shieldHp: Math.max(0, a.shieldHp),
    maxShieldHp: Math.max(0, a.maxShieldHp),
    alive: !!a.alive,
    lastDestroyedAtMs: Number.isFinite(a.lastDestroyedAtMs) ? a.lastDestroyedAtMs : -1e9,
  }));
  cached = {
    sessionKey,
    elapsedMs: Math.max(0, elapsedMs),
    agents: entries,
    respawnAtElapsedMs:
      respawnAtElapsedMs == null || !Number.isFinite(respawnAtElapsedMs)
        ? null
        : Math.max(0, respawnAtElapsedMs),
    waveOutcomeAwarded: !!waveOutcomeAwarded,
    duelSpawnVariant,
    suspendedAtMs,
  };
}

/**
 * 같은 sessionKey 의 스냅샷을 *소비*(반환 후 삭제)한다.
 * 다른 sessionKey 면 null만 반환하고 보존(다른 행성/성계 전투 후 복귀 가능성).
 */
export function consumeCombatResumeSnapshotForSession(
  sessionKey: string,
): CombatResumeSnapshot | null {
  if (!cached) return null;
  if (cached.sessionKey !== sessionKey) return null;
  const snap = cached;
  cached = null;
  return snap;
}

/** 외부 정책(전투 종료 처리·세션 강제 초기화)에서 즉시 폐기. */
export function clearCombatResumeSnapshot(): void {
  cached = null;
}

/** 디버깅·테스트용 — 비파괴 조회. */
export function peekCombatResumeSnapshot(): CombatResumeSnapshot | null {
  return cached;
}

/**
 * 새로 `initAgents`로 만들어진 에이전트 배열에 스냅샷의 HP/생사 등을 적용한다.
 * 매칭 키: `(team, npcShipId, captainId)` 우선, 누락은 같은 팀 내 순서로 폴백.
 *
 * 에이전트 배열은 in-place로 수정한다. 매칭되지 않은 슬롯은 `initAgents` 기본값을 유지.
 */
export function applyCombatResumeSnapshotToAgents(
  agents: Agent[],
  snap: CombatResumeSnapshot,
): void {
  if (agents.length === 0 || snap.agents.length === 0) return;
  const remaining: CombatResumeAgentEntry[] = snap.agents.slice();
  // 1) 정확 매칭(team + npcShipId + captainId)
  for (const ag of agents) {
    const idx = remaining.findIndex((e) =>
      e.team === ag.team
      && e.npcShipId === ag.npcShipId
      && e.captainId === ag.captainId,
    );
    if (idx >= 0) {
      const e = remaining[idx]!;
      remaining.splice(idx, 1);
      patchAgentFromEntry(ag, e);
    }
  }
  // 2) 동일 팀 + npcShipId 매칭
  for (const ag of agents) {
    if (ag.hullHp !== ag.maxHullHp && ag.alive) continue; // 이미 패치됨
    if (!ag.alive) continue;
    const idx = remaining.findIndex((e) => e.team === ag.team && e.npcShipId === ag.npcShipId);
    if (idx >= 0) {
      const e = remaining[idx]!;
      remaining.splice(idx, 1);
      patchAgentFromEntry(ag, e);
    }
  }
  // 3) 동일 팀 순서 매칭(폴백)
  for (const ag of agents) {
    if (ag.hullHp !== ag.maxHullHp || !ag.alive) continue;
    const idx = remaining.findIndex((e) => e.team === ag.team);
    if (idx >= 0) {
      const e = remaining[idx]!;
      remaining.splice(idx, 1);
      patchAgentFromEntry(ag, e);
    }
  }
}

function patchAgentFromEntry(ag: Agent, e: CombatResumeAgentEntry): void {
  // maxHp는 함선 정의에서 온 값을 신뢰하되, 현재 HP는 스냅샷 기준으로 클램프
  ag.hullHp = Math.max(0, Math.min(ag.maxHullHp, e.hullHp));
  ag.shieldHp = Math.max(0, Math.min(ag.maxShieldHp, e.shieldHp));
  ag.alive = e.alive && ag.hullHp > 0;
  if (!ag.alive) {
    ag.lastDestroyedAtMs = e.lastDestroyedAtMs;
  }
}
