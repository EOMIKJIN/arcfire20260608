// ============================================================
// 행성 단위 메모 캐시 — 콘텐츠 추가 시 표준 캐싱 채널
// ----------------------------------------------------------------------
// 목적:
//   행성 id (또는 행성+성계) 키로 결정되는 순수 함수의 결과를 안전하게 캐싱한다.
//   행성 변경/메인스테이지 이탈 시 `releasePlanetMainStageSession`이
//   `invalidatePlanetMemoCachesForPlanet` / `invalidateAllPlanetMemoCaches`를 호출해
//   누적이 발생하지 않도록 단일 정책을 유지한다.
//
// 사용 예:
//   const resolveNearbyPresenceCached = memoizePerPlanet(
//     'nearbyPresence',
//     (planetId, systemId) => buildPlanetNearbyPresence(planetId, systemId),
//   );
//   const rows = resolveNearbyPresenceCached('eden_prime', 'eden');
//
// 콘텐츠 추가 시 가이드:
//   1) 결과가 행성 + 성계 + (정적 테이블)에만 의존하면 본 헬퍼로 감싼다.
//   2) 런타임 변동값(스토어 상태·시간)에 의존하면 캐싱 대상 아님.
//   3) 캐시 무효화 정책은 본 모듈만 단일 진입점이다 — 외부에서 직접 비우지 않는다.
// ============================================================

type PlanetMemoEntry<TValue> = {
  /** Map<planetCacheKey, value> */
  byKey: Map<string, TValue>;
  /** planetId → 사용된 키 목록 (행성 단위 일괄 무효화용) */
  keysByPlanetId: Map<string, Set<string>>;
};

const registry = new Map<string, PlanetMemoEntry<unknown>>();

function getOrCreateEntry<TValue>(name: string): PlanetMemoEntry<TValue> {
  let entry = registry.get(name) as PlanetMemoEntry<TValue> | undefined;
  if (!entry) {
    entry = {
      byKey: new Map<string, TValue>(),
      keysByPlanetId: new Map<string, Set<string>>(),
    };
    registry.set(name, entry as PlanetMemoEntry<unknown>);
  }
  return entry;
}

/**
 * 행성 id 1개 키 기반 메모.
 * 결과가 (planetId)에만 의존하는 순수 함수에 사용.
 */
export function memoizePerPlanet<TValue>(
  name: string,
  compute: (planetId: string) => TValue,
): (planetId: string) => TValue {
  return (planetId: string): TValue => {
    const entry = getOrCreateEntry<TValue>(name);
    const key = planetId;
    if (entry.byKey.has(key)) return entry.byKey.get(key) as TValue;
    const value = compute(planetId);
    entry.byKey.set(key, value);
    let set = entry.keysByPlanetId.get(planetId);
    if (!set) {
      set = new Set<string>();
      entry.keysByPlanetId.set(planetId, set);
    }
    set.add(key);
    return value;
  };
}

/**
 * 행성 + 성계 2-키 메모.
 * 결과가 (planetId, systemId)에만 의존하는 순수 함수에 사용.
 */
export function memoizePerPlanetSystem<TValue>(
  name: string,
  compute: (planetId: string, systemId: string) => TValue,
): (planetId: string, systemId: string) => TValue {
  return (planetId: string, systemId: string): TValue => {
    const entry = getOrCreateEntry<TValue>(name);
    const key = `${planetId}|${systemId}`;
    if (entry.byKey.has(key)) return entry.byKey.get(key) as TValue;
    const value = compute(planetId, systemId);
    entry.byKey.set(key, value);
    let set = entry.keysByPlanetId.get(planetId);
    if (!set) {
      set = new Set<string>();
      entry.keysByPlanetId.set(planetId, set);
    }
    set.add(key);
    return value;
  };
}

/**
 * 특정 행성의 모든 메모 캐시 항목 무효화.
 * `releasePlanetMainStageSession({ reason: 'planet_change', previousPlanetId })`에서 호출.
 */
export function invalidatePlanetMemoCachesForPlanet(planetId: string): void {
  for (const entry of registry.values()) {
    const keys = entry.keysByPlanetId.get(planetId);
    if (!keys) continue;
    for (const key of keys) {
      entry.byKey.delete(key);
    }
    entry.keysByPlanetId.delete(planetId);
  }
}

/**
 * 메인스테이지 이탈(`route_blur`) 시 모든 캐시 비움.
 * 다른 화면(은하맵·시설)에서 행성 콘텐츠를 메모리에 들고 있을 이유가 없다.
 */
export function invalidateAllPlanetMemoCaches(): void {
  for (const entry of registry.values()) {
    entry.byKey.clear();
    entry.keysByPlanetId.clear();
  }
}

/** 성계 이탈(worldmap) — 해당 성계 행성들의 memo만 비움 */
export function invalidatePlanetMemoCachesForPlanets(planetIds: readonly string[]): void {
  for (const planetId of planetIds) {
    if (planetId) invalidatePlanetMemoCachesForPlanet(planetId);
  }
}

/** invalidate 후 빈 registry shell 제거 — PID 수명 Map 누적 완화 */
export function compactPlanetMemoRegistryShells(): void {
  for (const [name, entry] of registry.entries()) {
    if (entry.byKey.size === 0 && entry.keysByPlanetId.size === 0) {
      registry.delete(name);
    }
  }
}

/** 디버깅·테스트용 — 등록된 캐시 이름과 행성별 항목 수 */
export function debugSnapshotPlanetMemoCaches(): Record<string, { totalEntries: number; planets: number }> {
  const out: Record<string, { totalEntries: number; planets: number }> = {};
  for (const [name, entry] of registry.entries()) {
    out[name] = {
      totalEntries: entry.byKey.size,
      planets: entry.keysByPlanetId.size,
    };
  }
  return out;
}
