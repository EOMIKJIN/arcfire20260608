// ============================================================
// 채굴 재개 스냅샷 — 메인스테이지 출발(은하지도 이동) 시 채굴 세션을 안전 종료하고
// 같은 행성으로 돌아왔을 때 그대로 재개하기 위한 단일 저장소.
//
// 정책:
//   - 출발 시점에만 캡처(`captureMiningResumeSnapshot`).
//   - 같은 행성에 다시 진입하면 1회 소비(`consumeMiningResumeSnapshotForPlanet`).
//   - 다른 행성으로 갈아타거나 사용자가 수동으로 채굴 중단·완료를 누르면 즉시 폐기.
//
// 영속성: AsyncStorage 1키(`arcfire_mining_resume_v1`). 인벤토리·지급 카운트는
// 사이클 완료 시 이미 `playerStore.persist()`로 저장되므로 본 스냅샷은 *세션 진척*만 보존한다.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MiningSessionState } from './types';

const STORAGE_KEY = 'arcfire_mining_resume_v1';

export interface MiningResumeSnapshot {
  /** 어떤 행성을 떠날 때 채굴 중이었는지 — 같은 행성으로 돌아왔을 때만 재개 */
  planetId: string;
  miningGoodId: string;
  /** 사이클 기점 — 재개 시 이 값을 그대로 복원해 부분 사이클을 잃지 않게 한다(wall clock ms). */
  lastTickAtMs: number;
  /** 이번 세션 누적 광물 단위 합 — 상한(`ORBIT_MINING_SESSION_MAX_UNITS`)까지만 의미 있음 */
  orbitSessionOreTotal: number;
  /** 디버깅·만료 판정용 wall clock(ms) */
  suspendedAtMs: number;
}

let cached: MiningResumeSnapshot | null = null;
let hydrated = false;
let hydratingPromise: Promise<void> | null = null;

/** 앱 부팅 또는 메인스테이지 진입 시 1회 호출. idempotent. */
export async function hydrateMiningResumeStore(): Promise<void> {
  if (hydrated) return;
  if (hydratingPromise) return hydratingPromise;
  hydratingPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MiningResumeSnapshot | null;
        if (
          parsed
          && typeof parsed === 'object'
          && typeof parsed.planetId === 'string'
          && typeof parsed.miningGoodId === 'string'
          && Number.isFinite(parsed.lastTickAtMs)
          && Number.isFinite(parsed.orbitSessionOreTotal)
        ) {
          cached = {
            planetId: parsed.planetId,
            miningGoodId: parsed.miningGoodId,
            lastTickAtMs: parsed.lastTickAtMs,
            orbitSessionOreTotal: Math.max(0, parsed.orbitSessionOreTotal),
            suspendedAtMs: Number.isFinite(parsed.suspendedAtMs) ? parsed.suspendedAtMs : Date.now(),
          };
        }
      }
    } catch {
      cached = null;
    } finally {
      hydrated = true;
      hydratingPromise = null;
    }
  })();
  return hydratingPromise;
}

/**
 * `running` 세션을 스냅샷으로 저장. 그 외 상태이면 기존 스냅샷을 비운다.
 * 동기 부분에서 메모리 캐시를 즉시 갱신하고, AsyncStorage 기록은 fire-and-forget.
 */
export function captureMiningResumeSnapshot(
  session: MiningSessionState,
  nowMs: number,
): void {
  if (
    session.status !== 'running'
    || !session.planetId
    || !session.miningGoodId
    || session.lastTickAtMs == null
  ) {
    cached = null;
    hydrated = true;
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return;
  }
  const snap: MiningResumeSnapshot = {
    planetId: session.planetId,
    miningGoodId: session.miningGoodId,
    lastTickAtMs: session.lastTickAtMs,
    orbitSessionOreTotal: Math.max(0, session.orbitSessionOreTotal ?? 0),
    suspendedAtMs: nowMs,
  };
  cached = snap;
  hydrated = true;
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snap)).catch(() => {});
}

/**
 * 현재 행성에 대한 스냅샷을 *소비*(반환 후 삭제)한다.
 * - 다른 행성 스냅샷이라면 null만 반환하고 보존(다른 행성에 다시 갈 때 살아 있어야 함).
 *   다만 정책상 채굴 진행은 행성 단위라 무한 보존은 의미가 적으므로 호출자(planet.tsx)에서
 *   필요 시 `clearMiningResumeSnapshot`을 추가로 호출해 만료할 수 있다.
 */
export function consumeMiningResumeSnapshotForPlanet(
  planetId: string,
): MiningResumeSnapshot | null {
  if (!hydrated || !cached) return null;
  if (cached.planetId !== planetId) return null;
  const snap = cached;
  cached = null;
  void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  return snap;
}

/** 외부 정책(채굴 수동 중단·세션 캡 도달)에서 즉시 폐기하고 싶을 때 사용. */
export function clearMiningResumeSnapshot(): void {
  cached = null;
  hydrated = true;
  void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

/** 디버깅·테스트용 — 비파괴 조회. */
export function peekMiningResumeSnapshot(): MiningResumeSnapshot | null {
  return cached;
}

/** 스냅샷을 새 `MiningSessionState`(`running`)로 변환. lastTickAtMs는 보존. */
export function miningResumeSnapshotToSession(snap: MiningResumeSnapshot): MiningSessionState {
  return {
    planetId: snap.planetId,
    miningGoodId: snap.miningGoodId,
    status: 'running',
    startedAtMs: snap.lastTickAtMs,
    lastTickAtMs: snap.lastTickAtMs,
    orbitSessionOreTotal: snap.orbitSessionOreTotal,
  };
}
