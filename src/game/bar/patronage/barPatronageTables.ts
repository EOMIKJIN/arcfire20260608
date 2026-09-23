// ============================================================
// 바 후원 — 로스터·술·정책 O(1) 조회 (Table-First)
// ============================================================

import {
  BAR_ANIM_CLIPS_FROM_CSV,
  BAR_ATTENDANT_HELLO_FROM_CSV,
  BAR_ATTENDANTS_FROM_CSV,
  BAR_DIALOG_TURNS_FROM_CSV,
  BAR_DRINKS_FROM_CSV,
  BAR_PATRONAGE_POLICY_FROM_CSV,
  BAR_PLANET_DRINK_PRICES_FROM_CSV,
  BAR_PLANET_ROSTER_POLICY_FROM_CSV,
  BAR_SONGS_FROM_CSV,
  type BarAnimClipCsvRow,
  type BarAttendantCsvRow,
  type BarAttendantHelloCsvRow,
  type BarDialogTurnCsvRow,
  type BarDrinkCsvRow,
  type BarPlanetRosterPolicyCsvRow,
  type BarSongCsvRow,
} from '../../../data/generated/csvBarPatronage';

/** 정찰제 1잔 크레딧 구간 (Table-First · 행성 차등) */
export const BAR_DRINK_UNIT_PRICE_MIN = 150;
export const BAR_DRINK_UNIT_PRICE_MAX = 250;

function clampBarDrinkUnitPrice(n: number): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return 200;
  return Math.min(BAR_DRINK_UNIT_PRICE_MAX, Math.max(BAR_DRINK_UNIT_PRICE_MIN, v));
}

const planetDrinkPriceIndex: ReadonlyMap<string, number> = (() => {
  const m = new Map<string, number>();
  for (let i = 0; i < BAR_PLANET_DRINK_PRICES_FROM_CSV.length; i++) {
    const row = BAR_PLANET_DRINK_PRICES_FROM_CSV[i]!;
    const planetId = String(row.planetId ?? '').trim();
    const drinkId = String(row.drinkId ?? '').trim();
    if (!planetId || !drinkId) continue;
    m.set(`${planetId}|${drinkId}`, clampBarDrinkUnitPrice(row.priceCredits));
  }
  return m;
})();

/** 행성 바 정찰 단가 — Map O(1). 누락 시 카탈로그를 150–250 clamp */
export function resolveBarDrinkUnitPrice(planetId: string, drinkId: string): number {
  const pid = String(planetId ?? '').trim();
  const did = String(drinkId ?? '').trim();
  if (pid && did) {
    const hit = planetDrinkPriceIndex.get(`${pid}|${did}`);
    if (hit != null) return hit;
  }
  const catalog = (did ? getBarDrinkById(did) : undefined) ?? getDefaultBarDrink();
  return clampBarDrinkUnitPrice(catalog.priceCredits);
}

export function getBarPatronagePolicy() {
  return BAR_PATRONAGE_POLICY_FROM_CSV;
}

export function getBarDrinkById(drinkId: string): BarDrinkCsvRow | undefined {
  const id = String(drinkId ?? '').trim();
  if (!id) return undefined;
  return BAR_DRINKS_FROM_CSV.find((d) => d.drinkId === id);
}

export function getDefaultBarDrink(): BarDrinkCsvRow {
  const policy = getBarPatronagePolicy();
  return getBarDrinkById(policy.defaultDrinkId) ?? BAR_DRINKS_FROM_CSV[0]!;
}

/** 돔/바 레벨로 해금된 술. 틱 경로 아님 — 구매 시에만. */
export function listBarDrinksUnlockedForLevel(barLevel: number): BarDrinkCsvRow[] {
  const lv = Math.max(1, Math.floor(Number(barLevel) || 1));
  const out: BarDrinkCsvRow[] = [];
  for (let i = 0; i < BAR_DRINKS_FROM_CSV.length; i += 1) {
    const drink = BAR_DRINKS_FROM_CSV[i]!;
    if (drink.minBarLevel > lv) continue;
    out.push(drink);
  }
  return out;
}

/** 해금된 술 중 minBarLevel 최고. 없으면 하우스 에일. */
export function resolveBarDrinkForBarLevel(barLevel: number): BarDrinkCsvRow {
  const unlocked = listBarDrinksUnlockedForLevel(barLevel);
  if (unlocked.length === 0) return getDefaultBarDrink();
  let best = unlocked[0]!;
  for (let i = 1; i < unlocked.length; i += 1) {
    const drink = unlocked[i]!;
    if (drink.minBarLevel > best.minBarLevel) best = drink;
  }
  return best;
}

const attendantById: ReadonlyMap<string, BarAttendantCsvRow> = (() => {
  const m = new Map<string, BarAttendantCsvRow>();
  for (let i = 0; i < BAR_ATTENDANTS_FROM_CSV.length; i++) {
    const row = BAR_ATTENDANTS_FROM_CSV[i]!;
    const id = String(row.attendantId ?? '').trim();
    if (!id) continue;
    m.set(id, row);
  }
  return m;
})();

const songById: ReadonlyMap<string, BarSongCsvRow> = (() => {
  const m = new Map<string, BarSongCsvRow>();
  for (let i = 0; i < BAR_SONGS_FROM_CSV.length; i++) {
    const row = BAR_SONGS_FROM_CSV[i]!;
    const id = String(row.songId ?? '').trim();
    if (!id) continue;
    m.set(id, row);
  }
  return m;
})();

const planetRosterById: ReadonlyMap<string, BarPlanetRosterPolicyCsvRow> = (() => {
  const m = new Map<string, BarPlanetRosterPolicyCsvRow>();
  for (let i = 0; i < BAR_PLANET_ROSTER_POLICY_FROM_CSV.length; i++) {
    const row = BAR_PLANET_ROSTER_POLICY_FROM_CSV[i]!;
    const id = String(row.planetId ?? '').trim();
    if (!id) continue;
    m.set(id, row);
  }
  return m;
})();

export function getBarPlanetRosterPolicy(
  planetId: string,
): BarPlanetRosterPolicyCsvRow | undefined {
  const id = String(planetId ?? '').trim();
  if (!id) return undefined;
  return planetRosterById.get(id);
}

export function getBarAttendantById(attendantId: string): BarAttendantCsvRow | undefined {
  const id = String(attendantId ?? '').trim();
  if (!id) return undefined;
  return attendantById.get(id);
}

export type BarAttendantSpokenName = {
  ko: string;
  en: string;
};

/** 고유 표시명 — 행성별 중복 이름 1회. 채팅 파서용 */
export function listUniqueBarAttendantSpokenNames(): readonly BarAttendantSpokenName[] {
  const seen = new Set<string>();
  const out: BarAttendantSpokenName[] = [];
  for (let i = 0; i < BAR_ATTENDANTS_FROM_CSV.length; i++) {
    const row = BAR_ATTENDANTS_FROM_CSV[i]!;
    const ko = String(row.displayNameKo ?? '').trim();
    if (!ko || seen.has(ko)) continue;
    seen.add(ko);
    out.push({ ko, en: String(row.displayNameEn ?? '').trim() });
  }
  return out;
}

/** 이름 → 종업원. 현재 행성 행이 있으면 우선 */
export function findBarAttendantByDisplayName(
  spoken: string,
  preferPlanetId?: string,
): BarAttendantCsvRow | undefined {
  const name = String(spoken ?? '').trim();
  if (!name) return undefined;
  const lower = name.toLowerCase();
  const hits: BarAttendantCsvRow[] = [];
  for (let i = 0; i < BAR_ATTENDANTS_FROM_CSV.length; i++) {
    const row = BAR_ATTENDANTS_FROM_CSV[i]!;
    const ko = String(row.displayNameKo ?? '').trim();
    const en = String(row.displayNameEn ?? '').trim();
    if (ko === name || (en && en.toLowerCase() === lower)) hits.push(row);
  }
  if (hits.length === 0) return undefined;
  const prefer = String(preferPlanetId ?? '').trim();
  if (prefer) {
    for (let i = 0; i < hits.length; i++) {
      if (hits[i]!.planetId === prefer) return hits[i];
    }
  }
  return hits[0];
}

const attendantHelloByNameKo: ReadonlyMap<string, BarAttendantHelloCsvRow> = (() => {
  const m = new Map<string, BarAttendantHelloCsvRow>();
  for (let i = 0; i < BAR_ATTENDANT_HELLO_FROM_CSV.length; i++) {
    const row = BAR_ATTENDANT_HELLO_FROM_CSV[i]!;
    const name = String(row.displayNameKo ?? '').trim();
    if (!name) continue;
    m.set(name, row);
  }
  return m;
})();

export function getBarAttendantHelloByName(
  displayNameKo: string,
): BarAttendantHelloCsvRow | undefined {
  const name = String(displayNameKo ?? '').trim();
  if (!name) return undefined;
  return attendantHelloByNameKo.get(name);
}

/** attendant_hello 전용 — 이름 키 O(1). 미매칭이면 undefined → 세트 대사 폴백 */
export function resolveBarAttendantHelloOverlay(
  attendantId: string | undefined,
  locale: 'ko' | 'en',
): string | undefined {
  const id = String(attendantId ?? '').trim();
  if (!id) return undefined;
  const att = attendantById.get(id);
  if (!att) return undefined;
  const hello = attendantHelloByNameKo.get(String(att.displayNameKo ?? '').trim());
  if (!hello) return undefined;
  const text = locale === 'en' ? hello.textEn || hello.textKo : hello.textKo || hello.textEn;
  const trimmed = String(text ?? '').trim();
  return trimmed || undefined;
}

export function getBarSongById(songId: string): BarSongCsvRow | undefined {
  const id = String(songId ?? '').trim();
  if (!id) return undefined;
  return songById.get(id);
}

export function listBarSongs(): readonly BarSongCsvRow[] {
  return BAR_SONGS_FROM_CSV;
}

export function listBarAnimClipsForSet(animSetId: string): BarAnimClipCsvRow[] {
  const id = String(animSetId ?? '').trim();
  return BAR_ANIM_CLIPS_FROM_CSV.filter((c) => c.animSetId === id);
}

/** dayKey(YYYY-MM-DD) + planetId 고정 시드 — 당일 리스트 깜빡임 방지 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function resolveRosterSize(planetId: string, barLevel: number): number {
  const policy = getBarPatronagePolicy();
  const planet = getBarPlanetRosterPolicy(planetId);
  const midFallback = Math.ceil((policy.rosterMin + policy.rosterMax) / 2);
  const rosterBase = planet
    ? Math.floor(planet.rosterBase || midFallback)
    : midFallback;
  /** 바당 1~2. 행성 rosterBase가 전역 min보다 낮아도 행성 값을 바닥으로 쓴다. */
  const floor = planet
    ? Math.min(policy.rosterMin, Math.max(1, rosterBase))
    : policy.rosterMin;
  const base = Math.min(policy.rosterMax, Math.max(floor, rosterBase));
  const bonusCap = Math.max(0, Math.floor(policy.rosterDevBonusCap ?? 0));
  const lv = Math.max(1, Math.floor(barLevel || 1));
  const raw = base + Math.min(bonusCap, lv - 1);
  return Math.min(policy.rosterMax, Math.max(floor, raw));
}

function compareByDailySeed(
  a: BarAttendantCsvRow,
  b: BarAttendantCsvRow,
  seed: number,
): number {
  const ha = hashSeed(`${a.attendantId}|${seed}`);
  const hb = hashSeed(`${b.attendantId}|${seed}`);
  if (ha !== hb) return ha - hb;
  return a.attendantId.localeCompare(b.attendantId);
}

/**
 * 행성별 종업원 — 바당 1~2. 해당 planet 전용만 · `*` 유랑 풀 없음.
 * 해당 planet 전용만 · `*` 유랑 풀 없음.
 * 후보 < target 이면 그 행성 enabled(레벨 게이트 통과) 전원.
 */
export function buildBarPatronageRoster(params: {
  planetId: string;
  barLevel: number;
  dayKey: string;
}): BarAttendantCsvRow[] {
  const planetId = String(params.planetId ?? '').trim();
  const level = Math.max(1, Math.floor(params.barLevel || 1));
  const target = resolveRosterSize(planetId, level);
  if (!planetId) return [];

  const candidates: BarAttendantCsvRow[] = [];
  for (let i = 0; i < BAR_ATTENDANTS_FROM_CSV.length; i++) {
    const a = BAR_ATTENDANTS_FROM_CSV[i]!;
    if (a.planetId !== planetId) continue;
    if (a.minBarLevel > level) continue;
    candidates.push(a);
  }
  if (candidates.length === 0) return [];

  const seed = hashSeed(`${planetId}|${params.dayKey}|patronage`);
  if (candidates.length <= target) {
    return candidates.slice().sort((a, b) => {
      const dw = (b.rosterWeight || 0) - (a.rosterWeight || 0);
      if (dw !== 0) return dw;
      return compareByDailySeed(a, b, seed);
    });
  }

  return candidates
    .slice()
    .sort((a, b) => {
      const dw = (b.rosterWeight || 0) - (a.rosterWeight || 0);
      if (dw !== 0) return dw;
      return compareByDailySeed(a, b, seed);
    })
    .slice(0, target);
}

export function listDialogTurnsForAttendant(params: {
  dialogSetId: string;
  maxBundleTier: number;
}): BarDialogTurnCsvRow[] {
  const setId = String(params.dialogSetId ?? '').trim();
  const maxTier = Math.max(1, Math.floor(params.maxBundleTier || 1));
  const own = BAR_DIALOG_TURNS_FROM_CSV.filter(
    (t) => t.dialogSetId === setId && t.bundleTier >= 1 && t.bundleTier <= maxTier,
  );
  const shared = BAR_DIALOG_TURNS_FROM_CSV.filter(
    (t) => t.dialogSetId === 'dset_shared' && t.bundleTier <= maxTier,
  );
  return [...own, ...shared].sort((a, b) => a.bundleTier - b.bundleTier || a.sortOrder - b.sortOrder);
}

export function listHostDialogTurns(): BarDialogTurnCsvRow[] {
  return BAR_DIALOG_TURNS_FROM_CSV.filter((t) => t.dialogSetId === 'dset_host').sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function kstDayKey(nowMs = Date.now()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(nowMs);
}

/** RN 수량 피커 상한(세션 잔수 캡 없음 · 실제 결제는 confirm 시 spendCredits) */
export const PATRONAGE_DRINK_QTY_UI_CAP = 1000;

/** 수량 피커 maxQty — 크레딧과 무관하게 UI 상한만 반환 */
export function resolvePatronageDrinkMaxQty(): number {
  return PATRONAGE_DRINK_QTY_UI_CAP;
}

/** 크레딧으로 살 수 있는 최대 잔 수(0 허용) — demandLabel 힌트용 */
export function resolvePatronageDrinkAffordableQty(params: {
  unitPrice: number;
  playerCredits: number;
}): number {
  const price = Math.max(1, Math.floor(params.unitPrice));
  return Math.floor(Math.max(0, params.playerCredits) / price);
}
