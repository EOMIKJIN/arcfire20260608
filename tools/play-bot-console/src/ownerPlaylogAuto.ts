/** 대표님 실기 자동 수집 — 회전·사람 판정 규칙. 앱 틱/persist 없음. */

export const AUTO_POLL_MS = 15_000;
/** 마지막 「사용자 조작」 이후 이 시간이 지나면 세션을 닫는다(로그 mtime 아님 — [MEM] 주기 로그가 mtime을 계속 갱신). */
export const AUTO_IDLE_MS = 20 * 60 * 1000;
export const AUTO_MAX_SPAN_MS = 3 * 60 * 60 * 1000;
/** 사람 플레이로 인정하는 최소 조작 마커 수(화면 켜짐 상태에서 관측). 미만이면 무조작 체류·자동 QA·진단 세션. */
export const AUTO_MIN_USER_ACTIONS = 3;

/**
 * 사용자 조작으로만 생기는 [MEM_PROFILE] 마커 — 허브 진입(행성 상세 포함)·지도 출항·성계 이동.
 * 주기 reclaim·ingress 정리·dodge 등 자동 마커는 제외.
 */
const USER_ACTION_RE = /\[MEM_PROFILE\]\s+stage=\S+\s+event=(route_focus|transit_hop_start|system_change|planet_change)\b/;

export function countUserActionMarkers(text: string): number {
  let n = 0;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (USER_ACTION_RE.test(lines[i])) n += 1;
  }
  return n;
}

export function classifyAutoSession(userActions: number): 'human' | 'profiler' {
  return userActions >= AUTO_MIN_USER_ACTIONS ? 'human' : 'profiler';
}

/** D1·D2 — since 없는 과거버퍼·조작 증거 부족 세션은 시드에 넣지 않는다. */
export function shouldImportAutoSession(input: {
  userActions: number;
  memProfileMarkers: number;
  deviceSince?: string;
}): boolean {
  if (!input.deviceSince) return false;
  if (input.memProfileMarkers <= 0) return false;
  return classifyAutoSession(input.userActions) === 'human';
}

export function shouldRotateAutoSession(input: {
  idleMs: number;
  spanMs: number;
  deviceGone: boolean;
  appPidChanged: boolean;
  dayChanged: boolean;
}): { rotate: boolean; reason: string } {
  if (input.deviceGone) return { rotate: true, reason: 'device_gone' };
  if (input.appPidChanged) return { rotate: true, reason: 'app_pid' };
  if (input.dayChanged) return { rotate: true, reason: 'day' };
  if (input.spanMs >= AUTO_MAX_SPAN_MS) return { rotate: true, reason: 'max_span' };
  if (input.idleMs >= AUTO_IDLE_MS) return { rotate: true, reason: 'idle' };
  return { rotate: false, reason: 'hold' };
}

/** `adb shell` 인자는 원격 셸에서 다시 쪼개지므로 date 포맷은 한 문자열로 넘긴다(D1). */
export const ADB_DATE_ARGS: readonly string[] = ['shell', "date '+%m-%d %H:%M:%S'"];

export function parseDeviceSince(stdout: string | null | undefined): string {
  const raw = (stdout ?? '').trim();
  return /^\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? `${raw}.000` : '';
}
