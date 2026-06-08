// ============================================================
// 행성 세션 레지스트리 — 메인스테이지(행성 허브) 콘텐츠 라이프사이클 단일 관리축
// ----------------------------------------------------------------------
// 목적: 향후 콘텐츠(월드오브젝트·NPC 함장/함선·스토리·이벤트 등)가 행성 진입 중 만든
// 타이머·캐시·구독·계산 결과 등을 행성 변경/이탈 시 누락 없이 정리하기 위한 표준 채널.
//
// 사용 패턴:
//   const releaseToken = registerPlanetSessionResource({
//     ownerId: 'my_content_system',
//     planetId,
//     dispose: () => { ... 정리 ... },
//   });
//   // 같은 시스템이 행성 변경 시에도 dispose가 자동 호출됨
//
// 호출 시점(자동):
//   - 행성 변경 (planet_change): 이전 행성 자원 전부 dispose
//   - 메인스테이지 이탈 (route_blur): 모든 자원 dispose (다른 화면 점유 중에는 보유하지 않음)
//
// 콘텐츠 추가 시 가이드:
//   1) 행성별 캐시·구독·타이머가 필요하면 반드시 본 레지스트리에 등록한다.
//   2) `dispose`는 idempotent해야 한다(같은 토큰이 여러 번 해제되어도 안전).
//   3) 글로벌 1회 캐시(예: 광물 deposit index)는 본 레지스트리 대상이 아니다 — 행성과 무관.
// ============================================================

export type PlanetSessionReleaseReason = 'route_blur' | 'planet_change' | 'manual';

interface PlanetSessionResourceEntry {
  id: number;
  ownerId: string;
  planetId: string | null;
  dispose: () => void;
  disposed: boolean;
}

const resources: PlanetSessionResourceEntry[] = [];
let idSeq = 1;

export interface PlanetSessionResourceInput {
  /** 시스템 식별자 (디버깅·로그용) */
  ownerId: string;
  /** 자원이 묶인 행성 id. null이면 메인스테이지 전체 라이프사이클에 묶임 */
  planetId: string | null;
  /** idempotent 정리 함수 */
  dispose: () => void;
}

export interface PlanetSessionReleaseToken {
  /** 자원을 즉시 해제(레지스트리에서 제거 + dispose 호출). 멀티 호출 안전. */
  release: () => void;
}

/**
 * 콘텐츠 시스템이 행성 세션 자원을 등록한다.
 * 반환된 토큰의 `release()`는 멀티 호출 안전.
 */
export function registerPlanetSessionResource(input: PlanetSessionResourceInput): PlanetSessionReleaseToken {
  const entry: PlanetSessionResourceEntry = {
    id: idSeq++,
    ownerId: input.ownerId,
    planetId: input.planetId,
    dispose: input.dispose,
    disposed: false,
  };
  resources.push(entry);
  return {
    release: () => disposeEntry(entry),
  };
}

function disposeEntry(entry: PlanetSessionResourceEntry): void {
  if (entry.disposed) return;
  entry.disposed = true;
  const idx = resources.indexOf(entry);
  if (idx >= 0) resources.splice(idx, 1);
  try {
    entry.dispose();
  } catch {
    /* 콘텐츠 정리 실패는 다른 자원 정리에 영향을 주지 않게 흡수 */
  }
}

/**
 * 메인스테이지에서 호출 — 행성 변경/이탈 시 콘텐츠 자원 일괄 정리.
 * - planet_change + previousPlanetId 지정: 해당 행성 자원만 정리
 * - route_blur 또는 previousPlanetId 미지정: 모든 자원 정리
 */
export function releaseAllPlanetSessionResources(opts: {
  reason: PlanetSessionReleaseReason;
  previousPlanetId?: string | null;
}): void {
  const targetPlanetId = opts.reason === 'planet_change' ? (opts.previousPlanetId ?? null) : null;
  const all = opts.reason !== 'planet_change';

  // 역순 순회 + 즉시 splice 안전: disposeEntry가 splice를 처리
  for (let i = resources.length - 1; i >= 0; i--) {
    const entry = resources[i]!;
    if (all) {
      disposeEntry(entry);
      continue;
    }
    if (targetPlanetId != null && entry.planetId === targetPlanetId) {
      disposeEntry(entry);
    }
  }
}

/** 디버깅·테스트용 — 현재 등록된 자원 개수 */
export function debugCountPlanetSessionResources(): number {
  return resources.length;
}
