/**
 * Instruments/Profiler 유사 마커 (logcat `[MEM_PROFILE]`).
 * 김경제 memory-profiler · retention audit 입력.
 *
 * - __DEV__: 항상 출력
 * - release soak: EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1 빌드 시 출력
 */

export type MemProfileStage =
  | 'planet_hub'
  | 'galaxy_map'
  | 'combat_transit'
  | 'sub_stage'
  | 'unknown';

export type MemProfileEvent =
  | 'route_blur'
  | 'route_focus'
  | 'ingress_reclaim'
  | 'deep_reclaim'
  | 'system_change'
  | 'transit_combat_nav'
  | 'transit_hop_start'
  | 'planet_change'
  | 'manual';

type EmitOpts = {
  stage: MemProfileStage;
  event: MemProfileEvent;
  detail?: string;
};

function isMemProfileLogEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  try {
    return process.env.EXPO_PUBLIC_ARCFIRE_MEM_PROFILE === '1';
  } catch {
    return false;
  }
}

type HermesHeapStats = {
  /** js_heapSize — GC 가 확보한 힙(hades-segment). 회수 지연이면 실사용보다 크다. */
  heapMb: number;
  /**
   * js_allocatedBytes — 힙에 할당된 바이트(아직 수거 안 된 쓰레기 포함 · GC 전후 톱니).
   * 판정은 hermes_gc 가 늘어난 직후 샘플들의 저점 추세로 한다. 저점이 오르면 참조 누적.
   */
  allocMb: number | null;
  /** js_externalBytes — JSI 호스트 객체(Skia SkPicture·SkPath 등)·ArrayBuffer 외부 메모리 */
  externalMb: number | null;
  gcCount: number | null;
};

function toMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

function readHermesHeapStats(): HermesHeapStats | null {
  if (typeof globalThis === 'undefined') return null;
  const hermes = (globalThis as { HermesInternal?: { getInstrumentedStats?: () => Record<string, number> } })
    .HermesInternal;
  if (!hermes?.getInstrumentedStats) return null;
  try {
    const stats = hermes.getInstrumentedStats();
    const bytes = stats.js_heapSize ?? stats['JS heap size'] ?? 0;
    if (!Number.isFinite(bytes) || bytes <= 0) return null;
    const alloc = stats.js_allocatedBytes;
    const external = stats.js_externalBytes;
    const gc = stats.js_numGCs;
    return {
      heapMb: toMb(bytes),
      allocMb: Number.isFinite(alloc) && alloc > 0 ? toMb(alloc) : null,
      externalMb: Number.isFinite(external) && external >= 0 ? toMb(external) : null,
      gcCount: Number.isFinite(gc) ? gc : null,
    };
  } catch {
    return null;
  }
}

/** 기존 파서(retentionAuditCore · memProfileToSessionTrace)는 `hermes_mb= … detail=` 순서를 기대한다 → 새 값은 줄 끝에만 붙인다. */
function formatHermesTail(stats: HermesHeapStats | null): string {
  if (!stats) return '';
  const alloc = stats.allocMb != null ? ` hermes_alloc_mb=${stats.allocMb}` : '';
  const external = stats.externalMb != null ? ` hermes_ext_mb=${stats.externalMb}` : '';
  const gc = stats.gcCount != null ? ` hermes_gc=${stats.gcCount}` : '';
  return `${alloc}${external}${gc}`;
}

/** Metro logcat — `pull-mem-profile-logcat.ps1` / retention audit 입력 */
export function emitMemProfileMarker(opts: EmitOpts): void {
  if (!isMemProfileLogEnabled()) return;
  ensureDevHermesHeapSampler();
  const stats = readHermesHeapStats();
  const hermesPart = stats ? ` hermes_mb=${stats.heapMb}` : '';
  const detail = opts.detail?.trim() ? ` detail=${opts.detail.trim().replace(/\s+/g, '_')}` : '';
  // eslint-disable-next-line no-console
  console.log(`[MEM_PROFILE] stage=${opts.stage} event=${opts.event}${hermesPart}${detail}${formatHermesTail(stats)}`);
}

/**
 * 개발 계측 — 60초마다 `[MEM_HEAP]` 한 줄. 허브 체류처럼 MEM_PROFILE 이벤트가 드문 구간의
 * Hermes 확보량(heap)과 실사용(alloc)을 나눠 본다(2026-10-09 Unknown=hades-segment 단조 증가 조사).
 * MEM_PROFILE 출력이 켜진 빌드에서만, 첫 마커 때 한 번 시작한다. 할당은 문자열 1개.
 */
const HERMES_HEAP_SAMPLE_MS = 60_000;
let hermesHeapSamplerStarted = false;

type SamplerHost = { __arcfireHermesHeapSampler?: ReturnType<typeof setInterval> };

function ensureDevHermesHeapSampler(): void {
  if (hermesHeapSamplerStarted) return;
  hermesHeapSamplerStarted = true;
  // Fast Refresh 로 모듈이 다시 올라오면 모듈 변수는 초기화되지만 이전 타이머는 산다 → 핸들을 전역에 두고 교체.
  const host = globalThis as SamplerHost;
  if (host.__arcfireHermesHeapSampler != null) clearInterval(host.__arcfireHermesHeapSampler);
  host.__arcfireHermesHeapSampler = setInterval(() => {
    const stats = readHermesHeapStats();
    if (!stats) return;
    // eslint-disable-next-line no-console
    console.log(`[MEM_HEAP] hermes_mb=${stats.heapMb}${formatHermesTail(stats)}`);
  }, HERMES_HEAP_SAMPLE_MS);
}
