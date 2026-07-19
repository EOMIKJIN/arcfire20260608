// ============================================================
// 부트·진입 구간 성능 마커 (__DEV__ 전용) — Phase 0 기준선
// ============================================================

export type BootPerfMark =
  | 'layout_effect_start'
  | 'csv_indexes_start'
  | 'csv_indexes_end'
  | 'storage_load_start'
  | 'storage_load_end'
  | 'boot_ready'
  | 'arc_core_start'
  | 'post_boot_settled'
  | 'continue_prewarm_start'
  | 'continue_prewarm_end'
  | 'planet_first_render';

type BootPerfEntry = {
  mark: BootPerfMark;
  atMs: number;
  deltaMs: number;
  detail?: string;
};

const bootOriginMs = typeof performance !== 'undefined' ? performance.now() : 0;
const entries: BootPerfEntry[] = [];
let lastMarkMs = bootOriginMs;

function isBootPerfEnabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__;
}

/** 부트 구간 마커 — prod 빌드 no-op */
export function markBootPerf(mark: BootPerfMark, detail?: string): void {
  if (!isBootPerfEnabled()) return;
  const atMs = performance.now();
  entries.push({
    mark,
    atMs,
    deltaMs: atMs - lastMarkMs,
    detail,
  });
  lastMarkMs = atMs;
}

/** async 단계 래퍼 — 시작/종료 마커 + 소요 ms 반환 */
export async function measureBootPhase<T>(
  startMark: BootPerfMark,
  endMark: BootPerfMark,
  fn: () => Promise<T>,
  detail?: string,
): Promise<T> {
  markBootPerf(startMark, detail);
  try {
    return await fn();
  } finally {
    markBootPerf(endMark, detail);
  }
}

/** 동기 단계 래퍼 */
export function measureBootPhaseSync<T>(
  startMark: BootPerfMark,
  endMark: BootPerfMark,
  fn: () => T,
  detail?: string,
): T {
  markBootPerf(startMark, detail);
  try {
    return fn();
  } finally {
    markBootPerf(endMark, detail);
  }
}

export function getBootPerfEntries(): readonly BootPerfEntry[] {
  return entries;
}

/** 콘솔 1줄 요약 + 구간별 delta */
export function logBootPerfSummary(label = 'boot'): void {
  if (!isBootPerfEnabled() || entries.length === 0) return;
  const totalMs = Math.round(performance.now() - bootOriginMs);
  const parts = entries.map((e) => {
    const d = e.detail ? `(${e.detail})` : '';
    return `${e.mark}${d}+${Math.round(e.deltaMs)}ms`;
  });
  console.log(`[boot-perf] ${label} total=${totalMs}ms | ${parts.join(' → ')}`);
}

/** 테스트/핫 리로드용 */
export function resetBootPerfForTests(): void {
  entries.length = 0;
  lastMarkMs = typeof performance !== 'undefined' ? performance.now() : 0;
}
