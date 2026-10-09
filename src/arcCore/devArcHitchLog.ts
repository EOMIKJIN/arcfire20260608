// ============================================================
// [arc-hitch] dev 계측 — 30ms 이상 JS 정지를 이벤트마다 찍지 않고 1분에 한 줄로 묶는다.
// 이벤트마다 console.log 하면 분당 수십 줄 · 문자열 할당이 생겨 측정 자체를 오염시켰다(2026-10-09 분당 약 76줄).
// 출력: `[arc-hitch-min] <kind>:<label>=<횟수>/<합계ms>/<최대ms> …`
// 출시 빌드는 console 이 빠지고(transform-remove-console) 호출부도 __DEV__ 게이트 안에 있다.
// ============================================================

const ARC_HITCH_THRESHOLD_MS = 30;
const ARC_HITCH_FLUSH_MS = 60_000;

type HitchAgg = { count: number; sumMs: number; maxMs: number };

const buckets = new Map<string, HitchAgg>();

type FlushHost = { __arcfireArcHitchFlush?: ReturnType<typeof setInterval> };
let flushStarted = false;

function flushArcHitch(): void {
  if (buckets.size === 0) return;
  let line = '[arc-hitch-min]';
  for (const [key, agg] of buckets) {
    line += ` ${key}=${agg.count}/${Math.round(agg.sumMs)}/${Math.round(agg.maxMs)}`;
  }
  buckets.clear();
  // eslint-disable-next-line no-console
  console.log(line);
}

function ensureArcHitchFlush(): void {
  if (flushStarted) return;
  flushStarted = true;
  // Fast Refresh 로 모듈이 다시 올라와도 타이머가 겹치지 않게 전역 핸들을 교체한다.
  const host = globalThis as FlushHost;
  if (host.__arcfireArcHitchFlush != null) clearInterval(host.__arcfireArcHitchFlush);
  host.__arcfireArcHitchFlush = setInterval(flushArcHitch, ARC_HITCH_FLUSH_MS);
}

/** kind: tick·process·cmd·settle·plan · label: 서브코어 id 등(행성별 plan 은 호출부에서 묶어 넘긴다) */
export function recordArcHitch(kind: string, label: string, ms: number): void {
  if (!(ms >= ARC_HITCH_THRESHOLD_MS)) return;
  ensureArcHitchFlush();
  const key = `${kind}:${label}`;
  let agg = buckets.get(key);
  if (!agg) {
    agg = { count: 0, sumMs: 0, maxMs: 0 };
    buckets.set(key, agg);
  }
  agg.count += 1;
  agg.sumMs += ms;
  if (ms > agg.maxMs) agg.maxMs = ms;
}
