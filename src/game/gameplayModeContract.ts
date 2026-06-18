/**
 * 운영(릴리스·첫 설치) vs 개발 하네스 계약.
 * 테스트·임시 덮어쓰기(강제 개방·단축 간격·원샷 등)는 isDevHarnessAllowed() 일 때만 허용.
 */

/** Hermes release 번들 (__DEV__ === false) */
export function isReleaseBundle(): boolean {
  return typeof __DEV__ !== 'undefined' && !__DEV__;
}

/**
 * ArcCore 확장 테스트·레거시 강제 개방 등 DEV 전용 하네스.
 * - release: 항상 false (EXPO_PUBLIC_* 무시)
 * - debug: EXPO_PUBLIC_ARCFIRE_DEV_HARNESS=1 일 때만 true
 */
export function isDevHarnessAllowed(): boolean {
  if (isReleaseBundle()) return false;
  return process.env.EXPO_PUBLIC_ARCFIRE_DEV_HARNESS === '1';
}

/** 운영 플레이 경로 — 하네스 비활성 */
export function isProductionGameplayMode(): boolean {
  return !isDevHarnessAllowed();
}
