/**
 * Table-First — 바 후원 테이블 생성
 * 정본: tables/content/bar_*.csv
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TABLE_DIR = resolve(ROOT, 'tables', 'content');
const OUT_DIR = resolve(ROOT, 'src', 'data', 'generated');

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      field = '';
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  }
  return rows;
}

function loadCsv(name) {
  const path = resolve(TABLE_DIR, name);
  if (!existsSync(path)) throw new Error(`[bar-patronage] missing ${name}`);
  const raw = readFileSync(path, 'utf8');
  const matrix = parseCsv(raw);
  if (matrix.length < 2) return [];
  const headers = matrix[0].map((h) => h.trim());
  return matrix.slice(1).map((cells) => {
    const o = {};
    headers.forEach((h, idx) => {
      o[h] = cells[idx] ?? '';
    });
    return o;
  });
}

function q(s) {
  return JSON.stringify(String(s ?? ''));
}

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

const DRINK_PRICE_MIN = 150;
const DRINK_PRICE_MAX = 250;

function parseCsvBool(v) {
  return String(v ?? '').trim().toLowerCase() === 'true';
}

function fnv1a(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 행성+술 안정 해시 → 정찰제 [150, 250] */
function hashDrinkPrice(planetId, drinkId) {
  const span = DRINK_PRICE_MAX - DRINK_PRICE_MIN + 1;
  return DRINK_PRICE_MIN + (fnv1a(`${planetId}|${drinkId}|bar_drink_price`) % span);
}

function clampDrinkPrice(n, fallback) {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(DRINK_PRICE_MAX, Math.max(DRINK_PRICE_MIN, v));
}

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

/**
 * planets.csv(hasBar=true) × enabled drinks.
 * 기존 행 가격은 유지(150–250 clamp), 누락만 해시 채움.
 */
function syncPlanetDrinkPrices(drinks) {
  const priceName = 'bar_planet_drink_prices.csv';
  const pricePath = resolve(TABLE_DIR, priceName);
  const planets = loadCsv('planets.csv').filter(
    (r) => parseCsvBool(r.hasBar) && String(r.id ?? '').trim(),
  );
  const existing = existsSync(pricePath) ? loadCsv(priceName) : [];
  const existingMap = new Map();
  for (const r of existing) {
    const planetId = String(r.planetId ?? '').trim();
    const drinkId = String(r.drinkId ?? '').trim();
    if (!planetId || !drinkId) continue;
    existingMap.set(`${planetId}|${drinkId}`, r);
  }
  const rows = [];
  for (const p of planets) {
    const planetId = String(p.id).trim();
    for (const d of drinks) {
      const drinkId = String(d.drinkId).trim();
      const prev = existingMap.get(`${planetId}|${drinkId}`);
      const hashed = hashDrinkPrice(planetId, drinkId);
      const priceCredits = prev ? clampDrinkPrice(prev.priceCredits, hashed) : hashed;
      const note =
        prev && String(prev.note ?? '').trim() ? String(prev.note).trim() : '정찰제';
      rows.push({ planetId, drinkId, priceCredits, note });
    }
  }
  const csv =
    ['planetId,drinkId,priceCredits,note', ...rows.map((r) =>
      [r.planetId, r.drinkId, r.priceCredits, csvCell(r.note)].join(','),
    )].join('\n') + '\n';
  writeFileSync(pricePath, csv, 'utf8');
  return rows;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const attendants = loadCsv('bar_attendants.csv').filter((r) => String(r.enabled) !== '0');
  const songs = loadCsv('bar_songs.csv').filter((r) => String(r.enabled) !== '0');
  const drinks = loadCsv('bar_drink_defs.csv').filter((r) => String(r.enabled) !== '0');
  const planetDrinkPrices = syncPlanetDrinkPrices(drinks);
  const turns = loadCsv('bar_dialog_turns.csv');
  const hellos = loadCsv('bar_attendant_hello.csv').filter((r) =>
    String(r.displayNameKo ?? '').trim(),
  );
  const clips = loadCsv('bar_anim_clips.csv').filter((r) => String(r.enabled) !== '0');
  const policyRows = loadCsv('bar_patronage_policy.csv');
  const policy = {};
  for (const r of policyRows) {
    policy[String(r.key).trim()] = String(r.value).trim();
  }
  const planetRosterPolicy = loadCsv('bar_planet_roster_policy.csv').filter(
    (r) => String(r.planetId ?? '').trim(),
  );

  const attendantBody = attendants
    .map(
      (r) => `  {
    attendantId: ${q(r.attendantId)},
    planetId: ${q(r.planetId)},
    displayNameKo: ${q(r.displayNameKo)},
    displayNameEn: ${q(r.displayNameEn)},
    taglineKo: ${q(r.taglineKo)},
    taglineEn: ${q(r.taglineEn)},
    portraitImageAssetKey: ${q(r.portraitImageAssetKey)},
    minBarLevel: ${toInt(r.minBarLevel, 1)},
    rosterWeight: ${toInt(r.rosterWeight, 1)},
    dialogSetId: ${q(r.dialogSetId)},
    animSetId: ${q(r.animSetId)},
    songId: ${q(r.songId)},
  }`,
    )
    .join(',\n');

  const songBody = songs
    .map(
      (r) => `  {
    songId: ${q(r.songId)},
    titleKo: ${q(r.titleKo)},
    titleEn: ${q(r.titleEn)},
    assetKey: ${q(r.assetKey)},
    durationSec: ${toInt(r.durationSec, 180)},
    note: ${q(r.note)},
  }`,
    )
    .join(',\n');

  const drinkBody = drinks
    .map(
      (r) => `  {
    drinkId: ${q(r.drinkId)},
    displayNameKo: ${q(r.displayNameKo)},
    displayNameEn: ${q(r.displayNameEn)},
    priceCredits: ${toInt(r.priceCredits, 0)},
    durationSec: ${toInt(r.durationSec, 900)},
    unlockBundleTier: ${toInt(r.unlockBundleTier, 1)},
    bmSkuId: ${q(r.bmSkuId)},
    minBarLevel: ${toInt(r.minBarLevel, 1)},
  }`,
    )
    .join(',\n');

  const planetDrinkPriceBody = planetDrinkPrices
    .map(
      (r) => `  {
    planetId: ${q(r.planetId)},
    drinkId: ${q(r.drinkId)},
    priceCredits: ${toInt(r.priceCredits, 200)},
    note: ${q(r.note)},
  }`,
    )
    .join(',\n');

  const turnBody = turns
    .map(
      (r) => `  {
    turnId: ${q(r.turnId)},
    dialogSetId: ${q(r.dialogSetId)},
    bundleTier: ${toInt(r.bundleTier, 1)},
    sortOrder: ${toInt(r.sortOrder, 0)},
    speechAct: ${q(r.speechAct)},
    nlTopicId: ${q(r.nlTopicId)},
    delivery: ${q(r.delivery)},
    speakerRole: ${q(r.speakerRole)},
    textKo: ${q(r.textKo)},
    textEn: ${q(r.textEn)},
  }`,
    )
    .join(',\n');

  const helloBody = hellos
    .map(
      (r) => `  {
    displayNameKo: ${q(r.displayNameKo)},
    displayNameEn: ${q(r.displayNameEn)},
    textKo: ${q(r.textKo)},
    textEn: ${q(r.textEn)},
    note: ${q(r.note)},
  }`,
    )
    .join(',\n');

  const clipBody = clips
    .map(
      (r) => `  {
    clipId: ${q(r.clipId)},
    animSetId: ${q(r.animSetId)},
    loop: ${String(r.loop) === '1' || String(r.loop).toLowerCase() === 'true'},
    durationMs: ${toInt(r.durationMs, 2000)},
    motionHint: ${q(r.motionHint)},
  }`,
    )
    .join(',\n');

  const planetRosterBody = planetRosterPolicy
    .map(
      (r) => `  {
    planetId: ${q(r.planetId)},
    rosterBase: ${toInt(r.rosterBase, 8)},
    poolSize: ${toInt(r.poolSize, 8)},
    qualityTier: ${toInt(r.qualityTier, 3)},
    note: ${q(r.note)},
  }`,
    )
    .join(',\n');

  const content = `// AUTO-GENERATED by tools/content-tables/build-bar-patronage-tables.mjs
/** Table-First 정본: tables/content/bar_*.csv */

export type BarSpeechAct =
  | 'host_greet'
  | 'host_ask_drink'
  | 'host_decline_ack'
  | 'attendant_hello'
  | 'attendant_thanks_drink'
  | 'attendant_banter'
  | 'attendant_dance_cue'
  | 'attendant_more_drink_nudge'
  | 'attendant_farewell'
  | string;

export type BarDialogDelivery = 'scripted' | 'nl_preferred' | string;
export type BarSpeakerRole = 'host' | 'attendant' | 'system' | string;

export type BarAttendantCsvRow = {
  attendantId: string;
  planetId: string;
  displayNameKo: string;
  displayNameEn: string;
  taglineKo: string;
  taglineEn: string;
  portraitImageAssetKey: string;
  minBarLevel: number;
  rosterWeight: number;
  dialogSetId: string;
  animSetId: string;
  songId: string;
};

export type BarSongCsvRow = {
  songId: string;
  titleKo: string;
  titleEn: string;
  assetKey: string;
  durationSec: number;
  note: string;
};

export type BarDrinkCsvRow = {
  drinkId: string;
  displayNameKo: string;
  displayNameEn: string;
  priceCredits: number;
  durationSec: number;
  unlockBundleTier: number;
  bmSkuId: string;
  minBarLevel: number;
};

/** 행성별 정찰제 단가 — 정본 tables/content/bar_planet_drink_prices.csv */
export type BarPlanetDrinkPriceCsvRow = {
  planetId: string;
  drinkId: string;
  priceCredits: number;
  note: string;
};

/**
 * 대화 턴 — 스크립트 폴백 + 향후 자연어(NL) 연계 슬롯.
 * nlTopicId / delivery=nl_preferred 는 ArcCore·LLM 채널 연결 시 동일 키로 resolve.
 */
export type BarDialogTurnCsvRow = {
  turnId: string;
  dialogSetId: string;
  bundleTier: number;
  sortOrder: number;
  speechAct: BarSpeechAct;
  nlTopicId: string;
  delivery: BarDialogDelivery;
  speakerRole: BarSpeakerRole;
  textKo: string;
  textEn: string;
};

/** 이름별 고유 첫 문장 — 정본 tables/content/bar_attendant_hello.csv */
export type BarAttendantHelloCsvRow = {
  displayNameKo: string;
  displayNameEn: string;
  textKo: string;
  textEn: string;
  note: string;
};

export type BarAnimClipCsvRow = {
  clipId: string;
  animSetId: string;
  loop: boolean;
  durationMs: number;
  motionHint: string;
};

export type BarPatronagePolicy = {
  drinkDurationSecDefault: number;
  rosterMin: number;
  rosterMax: number;
  /** 인구돔 등 발전 레벨 가산 상한 (+0..cap) */
  rosterDevBonusCap: number;
  timerUiTickSec: number;
  defaultDrinkId: string;
};

/** 행성별 바 로스터·품질 — 정본 tables/content/bar_planet_roster_policy.csv */
export type BarPlanetRosterPolicyCsvRow = {
  planetId: string;
  rosterBase: number;
  poolSize: number;
  qualityTier: number;
  note: string;
};

export const BAR_ATTENDANTS_FROM_CSV: readonly BarAttendantCsvRow[] = [
${attendantBody}
];

export const BAR_SONGS_FROM_CSV: readonly BarSongCsvRow[] = [
${songBody}
];

export const BAR_DRINKS_FROM_CSV: readonly BarDrinkCsvRow[] = [
${drinkBody}
];

export const BAR_PLANET_DRINK_PRICES_FROM_CSV: readonly BarPlanetDrinkPriceCsvRow[] = [
${planetDrinkPriceBody}
];

export const BAR_DIALOG_TURNS_FROM_CSV: readonly BarDialogTurnCsvRow[] = [
${turnBody}
];

export const BAR_ATTENDANT_HELLO_FROM_CSV: readonly BarAttendantHelloCsvRow[] = [
${helloBody}
];

export const BAR_ANIM_CLIPS_FROM_CSV: readonly BarAnimClipCsvRow[] = [
${clipBody}
];

export const BAR_PLANET_ROSTER_POLICY_FROM_CSV: readonly BarPlanetRosterPolicyCsvRow[] = [
${planetRosterBody}
];

export const BAR_PATRONAGE_POLICY_FROM_CSV: BarPatronagePolicy = {
  drinkDurationSecDefault: ${toInt(policy.drink_duration_sec_default, 900)},
  rosterMin: ${toInt(policy.roster_min, 5)},
  rosterMax: ${toInt(policy.roster_max, 20)},
  rosterDevBonusCap: ${toInt(policy.roster_dev_bonus_cap, 3)},
  timerUiTickSec: ${toInt(policy.timer_ui_tick_sec, 15)},
  defaultDrinkId: ${q(policy.default_drink_id || 'drink_house_ale')},
};
`;

  writeFileSync(resolve(OUT_DIR, 'csvBarPatronage.ts'), content, 'utf8');
  console.log(
    `[bar-patronage] attendants=${attendants.length} songs=${songs.length} drinks=${drinks.length} planetDrinkPrices=${planetDrinkPrices.length} planetRoster=${planetRosterPolicy.length} turns=${turns.length} hellos=${hellos.length} clips=${clips.length}`,
  );
}

main();
