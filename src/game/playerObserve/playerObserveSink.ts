// 플레이어 행동 관찰 — 스텔라 능동 판단의 입력. store·RN import 금지 (missionStore·playerStore 가 부름).
// 출시 빌드에서도 동작한다. console·파일·네트워크로 내보내지 않는다.

export type PlayerObserveVerb =
  | 'quest'
  | 'combat'
  | 'trade'
  | 'annex'
  | 'skill'
  | 'ship'
  | 'mine'
  | 'scan'
  | 'talk'
  | 'develop'
  | 'land'
  | 'level'
  | 'destroy'
  | 'repair'
  | 'equip'
  | 'session';

export type PlayerObserveNotable = { v: PlayerObserveVerb; s: string; p: string; r: string; d: number };

export type PlayerObserveDayCounts = Partial<Record<PlayerObserveVerb, number>>;

export type PlayerObserveDigest = {
  day: number;
  c: PlayerObserveDayCounts;
  loss: number;
  dstr: number;
  runP: string;
  run: number;
  firsts: number;
  notable: PlayerObserveNotable[];
  prev: Array<{ d: number; c: PlayerObserveDayCounts; dstr: number }>;
  lastAt: number;
  lastLand: string;
};

export type PlayerObserveEntry = { verb: PlayerObserveVerb | ''; sub: string; planet: string; ref: string; at: number };

export const PLAYER_OBSERVE_RING = 64;
export const PLAYER_OBSERVE_NOTABLE_MAX = 4;
export const PLAYER_OBSERVE_PREV_DAYS = 2;
export const PLAYER_OBSERVE_MAX_BYTES = 512;

export const PLAYER_OBSERVE_FIRST = {
  ship: 1,
  annex: 2,
  develop: 4,
  destroy: 8,
  questComplete: 16,
} as const;

const KST_OFFSET_MS = 9 * 3600 * 1000;
const DAY_MS = 86_400_000;
const COUNT_CAP = 999;

const VERBS: ReadonlySet<string> = new Set<PlayerObserveVerb>([
  'quest', 'combat', 'trade', 'annex', 'skill', 'ship', 'mine', 'scan', 'talk', 'develop',
  'land', 'level', 'destroy', 'repair', 'equip', 'session',
]);

export function playerObserveDayOf(atMs: number): number {
  return Math.floor((atMs + KST_OFFSET_MS) / DAY_MS);
}

export function emptyPlayerObserveDigest(): PlayerObserveDigest {
  return {
    day: 0,
    c: {},
    loss: 0,
    dstr: 0,
    runP: '',
    run: 0,
    firsts: 0,
    notable: [],
    prev: [],
    lastAt: 0,
    lastLand: '',
  };
}

const ring: PlayerObserveEntry[] = [];
for (let i = 0; i < PLAYER_OBSERVE_RING; i += 1) {
  ring.push({ verb: '', sub: '', planet: '', ref: '', at: 0 });
}
let head = 0;
let filled = 0;
let digest: PlayerObserveDigest = emptyPlayerObserveDigest();
let flush: (() => void) | null = null;

/** 눈에 띄는 사건 뒤 디스크 기록을 요청. 대화 store 가 hydrate 이후에만 연결한다. */
export function registerPlayerObserveFlush(fn: (() => void) | null): void {
  flush = fn;
}

function rollDay(day: number): void {
  if (digest.day === day) return;
  if (digest.day > 0 && (digest.dstr > 0 || Object.keys(digest.c).length > 0)) {
    const prev = [{ d: digest.day, c: digest.c, dstr: digest.dstr }, ...digest.prev];
    digest.prev = prev.slice(0, PLAYER_OBSERVE_PREV_DAYS);
  }
  digest.day = day;
  digest.c = {};
  digest.dstr = 0;
  digest.loss = 0;
  digest.run = 0;
  digest.runP = '';
}

function pushNotable(n: PlayerObserveNotable): void {
  digest.notable.unshift(n);
  if (digest.notable.length > PLAYER_OBSERVE_NOTABLE_MAX) digest.notable.length = PLAYER_OBSERVE_NOTABLE_MAX;
}

function markFirst(bit: number): boolean {
  if ((digest.firsts & bit) !== 0) return false;
  digest.firsts |= bit;
  return true;
}

function head2(detail: string): [string, string] {
  const i = detail.indexOf(':');
  if (i < 0) return [detail, ''];
  return [detail.slice(0, i), detail.slice(i + 1)];
}

/** emitPlayVerb detail 문자열을 (sub, planet, ref) 로. 형식은 기존 방출 지점과 같다. */
export function parsePlayerObserveDetail(
  verb: PlayerObserveVerb,
  detail: string,
  lastLand: string,
): { sub: string; planet: string; ref: string } {
  const d = detail.trim();
  switch (verb) {
    case 'quest': {
      const [sub, ref] = head2(d);
      return { sub, planet: lastLand, ref };
    }
    case 'combat': {
      const [venue, outcome] = head2(d);
      return { sub: outcome, planet: lastLand, ref: venue };
    }
    case 'trade': {
      const [side, planet] = head2(d);
      return { sub: side, planet: planet || lastLand, ref: '' };
    }
    case 'develop': {
      const [step, rest] = head2(d);
      const j = rest.lastIndexOf(':');
      return j < 0
        ? { sub: step, planet: lastLand, ref: rest }
        : { sub: step, planet: rest.slice(j + 1), ref: rest.slice(0, j) };
    }
    case 'mine': {
      const [planet, good] = head2(d);
      return { sub: '', planet: planet || lastLand, ref: good };
    }
    case 'land':
    case 'scan':
      return { sub: '', planet: d || lastLand, ref: '' };
    default: {
      const [first, rest] = head2(d);
      return rest ? { sub: first, planet: lastLand, ref: rest } : { sub: '', planet: lastLand, ref: first };
    }
  }
}

/** 행동 1회 — O(1). 눈에 띄는 사건이면 flush 요청. */
export function recordPlayerObserve(verb: PlayerObserveVerb, detail = '', atMs: number = Date.now()): void {
  if (!VERBS.has(verb)) return;
  rollDay(playerObserveDayOf(atMs));
  const parsed = parsePlayerObserveDetail(verb, detail, digest.lastLand);

  const slot = ring[head]!;
  slot.verb = verb;
  slot.sub = parsed.sub;
  slot.planet = parsed.planet;
  slot.ref = parsed.ref;
  slot.at = atMs;
  head = (head + 1) % PLAYER_OBSERVE_RING;
  if (filled < PLAYER_OBSERVE_RING) filled += 1;

  const cur = digest.c[verb] ?? 0;
  if (cur < COUNT_CAP) digest.c[verb] = cur + 1;
  digest.lastAt = atMs;

  let notable = false;
  let persist = false;
  const day = digest.day;
  if (verb === 'land') {
    digest.lastLand = parsed.planet;
    persist = true;
  } else if (verb === 'combat') {
    if (parsed.sub === 'lose') digest.loss = Math.min(COUNT_CAP, digest.loss + 1);
    else if (parsed.sub === 'win') digest.loss = 0;
    if (parsed.planet && parsed.planet === digest.runP) digest.run = Math.min(COUNT_CAP, digest.run + 1);
    else {
      digest.runP = parsed.planet;
      digest.run = 1;
    }
  } else if (verb === 'destroy') {
    digest.dstr = Math.min(COUNT_CAP, digest.dstr + 1);
    markFirst(PLAYER_OBSERVE_FIRST.destroy);
    notable = true;
  } else if (verb === 'ship') {
    markFirst(PLAYER_OBSERVE_FIRST.ship);
    notable = true;
  } else if (verb === 'annex') {
    markFirst(PLAYER_OBSERVE_FIRST.annex);
    notable = true;
  } else if (verb === 'develop') {
    notable = markFirst(PLAYER_OBSERVE_FIRST.develop);
  } else if (verb === 'quest' && parsed.sub === 'complete') {
    markFirst(PLAYER_OBSERVE_FIRST.questComplete);
    notable = true;
  } else if (verb === 'level' || verb === 'session') {
    notable = verb === 'level';
    persist = true;
  }
  if (notable) {
    pushNotable({ v: verb, s: parsed.sub, p: parsed.planet, r: parsed.ref, d: day });
    persist = true;
  }
  if (persist && flush) flush();
}

/** 결정 순간에 읽는다. 날짜가 지났으면 먼저 넘긴다. */
export function readPlayerObserveDigest(nowMs: number = Date.now()): Readonly<PlayerObserveDigest> {
  rollDay(playerObserveDayOf(nowMs));
  return digest;
}

/** 최근 행동 최신순으로 최대 max 개. 결정 순간 전용. */
export function forEachRecentPlayerObserve(max: number, fn: (e: Readonly<PlayerObserveEntry>) => void): void {
  const n = Math.min(max, filled);
  for (let k = 0; k < n; k += 1) {
    const idx = (head - 1 - k + PLAYER_OBSERVE_RING) % PLAYER_OBSERVE_RING;
    fn(ring[idx]!);
  }
}

function utf8Bytes(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c <= 0x7f) n += 1;
    else if (c <= 0x7ff) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff) {
      n += 4;
      i += 1;
    } else n += 3;
  }
  return n;
}

/** persist 직렬화용 사본. 자기 상한만 지킨다 — 스텔라 life 클램프와 섞지 않음. */
export function exportPlayerObserveDigest(): PlayerObserveDigest {
  const out: PlayerObserveDigest = {
    ...digest,
    c: { ...digest.c },
    notable: digest.notable.slice(),
    prev: digest.prev.slice(),
  };
  let guard = 0;
  while (utf8Bytes(JSON.stringify(out)) > PLAYER_OBSERVE_MAX_BYTES && guard < 12) {
    guard += 1;
    if (out.notable.length > 0) {
      out.notable.pop();
      continue;
    }
    if (out.prev.length > 0) {
      out.prev.pop();
      continue;
    }
    break;
  }
  return out;
}

export function isPlayerObserveDigestEmpty(d: PlayerObserveDigest): boolean {
  return d.lastAt === 0 && d.firsts === 0 && d.notable.length === 0 && d.prev.length === 0;
}

function num(v: unknown, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.trunc(v))) : 0;
}

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function parseCounts(raw: unknown): PlayerObserveDayCounts {
  const out: PlayerObserveDayCounts = {};
  if (!raw || typeof raw !== 'object') return out;
  const o = raw as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    if (!VERBS.has(k)) continue;
    const n = num(o[k], COUNT_CAP);
    if (n > 0) out[k as PlayerObserveVerb] = n;
  }
  return out;
}

export function parsePlayerObserveDigest(raw: unknown): PlayerObserveDigest {
  const d = emptyPlayerObserveDigest();
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Record<string, unknown>;
  d.day = num(o.day, 1e7);
  d.c = parseCounts(o.c);
  d.loss = num(o.loss, COUNT_CAP);
  d.dstr = num(o.dstr, COUNT_CAP);
  d.runP = str(o.runP, 48);
  d.run = num(o.run, COUNT_CAP);
  d.firsts = num(o.firsts, 0xffff);
  d.lastAt = num(o.lastAt, Number.MAX_SAFE_INTEGER);
  d.lastLand = str(o.lastLand, 48);
  if (Array.isArray(o.notable)) {
    for (let i = 0; i < o.notable.length && d.notable.length < PLAYER_OBSERVE_NOTABLE_MAX; i += 1) {
      const r = o.notable[i] as Record<string, unknown> | null;
      if (!r || typeof r !== 'object') continue;
      const v = str(r.v, 12);
      if (!VERBS.has(v)) continue;
      d.notable.push({ v: v as PlayerObserveVerb, s: str(r.s, 16), p: str(r.p, 48), r: str(r.r, 48), d: num(r.d, 1e7) });
    }
  }
  if (Array.isArray(o.prev)) {
    for (let i = 0; i < o.prev.length && d.prev.length < PLAYER_OBSERVE_PREV_DAYS; i += 1) {
      const r = o.prev[i] as Record<string, unknown> | null;
      if (!r || typeof r !== 'object') continue;
      const day = num(r.d, 1e7);
      if (day <= 0) continue;
      d.prev.push({ d: day, c: parseCounts(r.c), dstr: num(r.dstr, COUNT_CAP) });
    }
  }
  return d;
}

/**
 * 디스크 요약을 받는다. 대화 store 는 늦게 hydrate 되므로, 그 전에 이 프로세스에서 쌓인 행동을 덮지 않고 합친다.
 * 디스크 = 과거 · 메모리 = 이번 실행 이후.
 */
export function hydratePlayerObserveDigest(raw: unknown): void {
  const disk = parsePlayerObserveDigest(raw);
  const live = digest;
  if (live.lastAt === 0) {
    digest = disk;
    return;
  }
  const diskDay = disk.day;
  const diskLoss = disk.loss;
  const diskRun = disk.run;
  const diskRunP = disk.runP;
  const merged = disk;
  merged.firsts |= live.firsts;
  if (disk.day === live.day) {
    for (const k of Object.keys(live.c) as PlayerObserveVerb[]) {
      merged.c[k] = Math.min(COUNT_CAP, (merged.c[k] ?? 0) + (live.c[k] ?? 0));
    }
    merged.dstr = Math.min(COUNT_CAP, merged.dstr + live.dstr);
  } else if (live.day > disk.day) {
    if (disk.day > 0 && (disk.dstr > 0 || Object.keys(disk.c).length > 0)) {
      merged.prev = [{ d: disk.day, c: disk.c, dstr: disk.dstr }, ...disk.prev].slice(0, PLAYER_OBSERVE_PREV_DAYS);
    }
    merged.day = live.day;
    merged.c = live.c;
    merged.dstr = live.dstr;
  }
  const liveFights = live.c.combat ?? 0;
  if (liveFights > 0) {
    const sameDay = diskDay === live.day;
    merged.loss = live.loss === liveFights && sameDay ? Math.min(COUNT_CAP, diskLoss + live.loss) : live.loss;
    const sameRun = sameDay && live.run === liveFights && live.runP === diskRunP;
    merged.run = sameRun ? Math.min(COUNT_CAP, diskRun + live.run) : live.run;
    merged.runP = live.runP;
  } else if (live.day > diskDay) {
    merged.loss = live.loss;
    merged.run = live.run;
    merged.runP = live.runP;
  }
  merged.notable = [...live.notable, ...disk.notable].slice(0, PLAYER_OBSERVE_NOTABLE_MAX);
  merged.lastAt = Math.max(disk.lastAt, live.lastAt);
  merged.lastLand = live.lastLand || disk.lastLand;
  digest = merged;
}

export function resetPlayerObserve(): void {
  digest = emptyPlayerObserveDigest();
  head = 0;
  filled = 0;
  for (let i = 0; i < PLAYER_OBSERVE_RING; i += 1) {
    const s = ring[i]!;
    s.verb = '';
    s.sub = '';
    s.planet = '';
    s.ref = '';
    s.at = 0;
  }
}
