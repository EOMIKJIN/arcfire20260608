/**
 * 은하계 바 종업원 시드 — tables/content/bar_attendants.csv 재생성
 * 정본은 생성 결과 CSV. 재현: node tools/content-tables/seed-bar-attendants-galaxy.mjs
 *
 * 계약 (2026-09-16 · 1등급 고유 초상):
 * - 바당 1~2명만 (번영 허브 2 · 그 외·프론티어 1)
 * - 1등급 11명 = 고유 이름 1:1 고유 초상. 돌려쓰기 금지
 * - 나머지 행 portraitImageAssetKey 공란 (2·3등급 예정)
 * - planetId='*' 없음 · id(ta_att_NNN) 글로벌 유일
 * - 1등급 이름은 은하 전체 1회만
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../..');
const TABLE_DIR = resolve(ROOT, 'tables', 'content');
const OUT_PATH = resolve(TABLE_DIR, 'bar_attendants.csv');
const ROSTER_POLICY_PATH = resolve(TABLE_DIR, 'bar_planet_roster_policy.csv');
const SYNTH_COLONIZATION_PATH = resolve(ROOT, 'tables', 'balance', 'synth_system_colonization.csv');
const CORE_BAR_PLANET_COUNT = 18;
const FRONTIER_ROSTER_BASE = 1;
const FRONTIER_POOL_SIZE = 1;
const FRONTIER_QUALITY_TIER = 1;

/** 1등급 · 고유 이름 → 고유 PNG. 순서 = char006…016 */
const GRADE1_CAST = [
  { ko: '미라', en: 'Mira', tagKo: '밝은 미소의 오케스트라 바텐더', tagEn: 'Bright-smiled orchestra bartender', portrait: 'assets/images/npc/bar_att_char006.png', dialog: 'dset_star' },
  { ko: '레나', en: 'Lena', tagKo: '느긋한 재즈 톤의 안내원', tagEn: 'Laid-back jazz-toned hostess', portrait: 'assets/images/npc/bar_att_char007.png', dialog: 'dset_ballroom' },
  { ko: '소라', en: 'Sora', tagKo: '별빛 노래가 특기인 종업원', tagEn: 'Attendant known for starlight songs', portrait: 'assets/images/npc/bar_att_char008.png', dialog: 'dset_cheerful' },
  { ko: '유나', en: 'Yuna', tagKo: '차분한 포스포 조명 아래의 파트너', tagEn: 'Calm partner under phosphor lights', portrait: 'assets/images/npc/bar_att_char009.png', dialog: 'dset_jazz' },
  { ko: '키라', en: 'Kira', tagKo: '빠른 스텝의 무도회 안내', tagEn: 'Quick-step ballroom guide', portrait: 'assets/images/npc/bar_att_char010.png', dialog: 'dset_star' },
  { ko: '노바', en: 'Nova', tagKo: '항로 이야기를 좋아하는 동료', tagEn: 'Colleague who loves system-route tales', portrait: 'assets/images/npc/bar_att_char011.png', dialog: 'dset_ballroom' },
  { ko: '아이리스', en: 'Iris', tagKo: '은밀한 소문을 속삭이는 안내원', tagEn: 'Guide who whispers soft rumors', portrait: 'assets/images/npc/bar_att_char012.png', dialog: 'dset_whisper' },
  { ko: '베가', en: 'Vega', tagKo: '달빛 리듬의 댄스 메이트', tagEn: 'Dance mate of moonlight rhythm', portrait: 'assets/images/npc/bar_att_char013.png', dialog: 'dset_jazz' },
  { ko: '루나', en: 'Luna', tagKo: '고음이 아름다운 합창 파트너', tagEn: 'Chorus partner with a clear high note', portrait: 'assets/images/npc/bar_att_char014.png', dialog: 'dset_star' },
  { ko: '아리아', en: 'Aria', tagKo: '깃털처럼 가벼운 스텝', tagEn: 'Feather-light steps', portrait: 'assets/images/npc/bar_att_char015.png', dialog: 'dset_ballroom' },
  { ko: '플룸', en: 'Plume', tagKo: '낮은 톤의 밤 이야기꾼', tagEn: 'Low-voiced night storyteller', portrait: 'assets/images/npc/bar_att_char016.png', dialog: 'dset_calm' },
];

/** 초반 동선·허브에 1등급 11명 배치 (바당 1~2) */
const GRADE1_BY_PLANET = {
  arcadia_prime: ['미라', '레나'],
  solar_station: ['소라', '유나'],
  vega_base: ['키라', '노바'],
  eden_city: ['아이리스', '베가'],
  minerva_deep: ['루나'],
  iron_remnant: ['아리아'],
  draco_haven: ['플룸'],
};

const CORE_ROSTER_SPEC = [
  ['arcadia_prime', 2, 2, 5, '수도·1등급 2명'],
  ['solar_station', 2, 2, 5, '무역 허브·1등급 2명'],
  ['vega_base', 2, 2, 4, '전초·1등급 2명'],
  ['eden_city', 2, 2, 5, '상업수도·1등급 2명'],
  ['minerva_deep', 1, 1, 4, '광업·1등급 1명'],
  ['iron_remnant', 1, 1, 2, '잔해·1등급 1명'],
  ['draco_haven', 1, 1, 3, '성운·1등급 1명'],
  ['omega_hub', 1, 1, 4, '교차 허브·2등급 예정'],
  ['sirius_border', 1, 1, 3, '변경·2등급 예정'],
  ['titan_ruins', 1, 1, 3, '유적·2등급 예정'],
  ['perseus_memorial', 1, 1, 3, '기념·2등급 예정'],
  ['crimson_base', 1, 1, 2, '전선·2등급 예정'],
  ['dark_haven', 1, 1, 2, '외곽·2등급 예정'],
  ['blood_station', 1, 1, 1, '변방·2등급 예정'],
  ['shadow_market', 1, 1, 2, '시장·2등급 예정'],
  ['abyss_gate', 1, 1, 2, '심연·2등급 예정'],
  ['core_prime', 1, 1, 4, '코어·2등급 예정'],
  ['genesis_origin', 1, 1, 4, '엔드·2등급 예정'],
];

const RESERVE_CAST = [
  { ko: '세이블', en: 'Sable', tagKo: '불꽃 같은 응원 박수', tagEn: 'Cheers like sparks', dialog: 'dset_ember' },
  { ko: '신더', en: 'Cinder', tagKo: '보석처럼 반짝이는 눈인사', tagEn: 'Greeting that sparkles like gems', dialog: 'dset_echo' },
  { ko: '오팔', en: 'Opal', tagKo: '메아리처럼 이어지는 화음', tagEn: 'Harmony that echoes on', dialog: 'dset_calm' },
  { ko: '에코', en: 'Echo', tagKo: '새벽 항로를 여는 목소리', tagEn: 'Voice that opens the dawn lane', dialog: 'dset_cheerful' },
  { ko: '니온', en: 'Neon', tagKo: '네온 잔에 기대는 파트너', tagEn: 'Partner leaning on a neon glass', dialog: 'dset_jazz' },
  { ko: '제이드', en: 'Jade', tagKo: '수도 살롱의 상급 안내', tagEn: 'Senior host of the capital salon', dialog: 'dset_star' },
  { ko: '루미', en: 'Lumi', tagKo: '번영 허브의 리드 퍼포머', tagEn: 'Lead performer of a prosperous hub', dialog: 'dset_ballroom' },
  { ko: '카일라', en: 'Kayla', tagKo: '항로 교차점의 마스터 호스트', tagEn: 'Master host at the crossroads', dialog: 'dset_whisper' },
  { ko: '세레', en: 'Sere', tagKo: '코어 살롱의 시그니처 파트너', tagEn: 'Signature partner of the core lounge', dialog: 'dset_echo' },
];

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

function loadCsvRows(path) {
  if (!existsSync(path)) throw new Error(`[seed-bar-attendants] missing ${path}`);
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
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

function parseCsvBool(v) {
  return String(v ?? '').trim().toLowerCase() === 'true';
}

function csvCell(s) {
  const t = String(s ?? '');
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function pad3(n) {
  return String(n).padStart(3, '0');
}

function synthPlanetId(systemId) {
  return `${String(systemId ?? '').trim()}_p`;
}

function listCoreBarPlanetIds() {
  return loadCsvRows(resolve(TABLE_DIR, 'planets.csv'))
    .filter((r) => parseCsvBool(r.hasBar) && String(r.id ?? '').trim())
    .map((r) => String(r.id).trim());
}

function listFrontierBarEntries() {
  return loadCsvRows(SYNTH_COLONIZATION_PATH)
    .filter((r) => parseCsvBool(r.hasBar) && String(r.synthSystemId ?? '').trim())
    .map((r) => {
      const systemId = String(r.synthSystemId).trim();
      const label = String(r.systemNameKo ?? '').trim() || systemId;
      return {
        planetId: synthPlanetId(systemId),
        note: `${label}·2등급 예정`,
      };
    });
}

function writeRosterPolicy(coreIds, frontierEntries) {
  const specById = new Map(
    CORE_ROSTER_SPEC.map((row) => [row[0], row]),
  );
  const out = [];
  for (const planetId of coreIds) {
    const spec = specById.get(planetId);
    if (!spec) {
      throw new Error(`[seed-bar-attendants] missing CORE_ROSTER_SPEC for ${planetId}`);
    }
    out.push({
      planetId,
      rosterBase: String(spec[1]),
      poolSize: String(spec[2]),
      qualityTier: String(spec[3]),
      note: spec[4],
    });
  }
  for (const entry of frontierEntries) {
    out.push({
      planetId: entry.planetId,
      rosterBase: String(FRONTIER_ROSTER_BASE),
      poolSize: String(FRONTIER_POOL_SIZE),
      qualityTier: String(FRONTIER_QUALITY_TIER),
      note: entry.note,
    });
  }
  const header = ['planetId', 'rosterBase', 'poolSize', 'qualityTier', 'note'];
  const csv =
    [
      header.join(','),
      ...out.map((r) => header.map((h) => csvCell(r[h])).join(',')),
    ].join('\n') + '\n';
  writeFileSync(ROSTER_POLICY_PATH, csv, 'utf8');
  return out;
}

function main() {
  const grade1ByName = new Map(GRADE1_CAST.map((c) => [c.ko, c]));
  const grade1Names = new Set(GRADE1_CAST.map((c) => c.ko));
  const placedGrade1 = [];
  for (const names of Object.values(GRADE1_BY_PLANET)) {
    for (const name of names) placedGrade1.push(name);
  }
  if (placedGrade1.length !== GRADE1_CAST.length) {
    throw new Error(
      `[seed-bar-attendants] GRADE1_BY_PLANET size ${placedGrade1.length} != ${GRADE1_CAST.length}`,
    );
  }
  if (new Set(placedGrade1).size !== GRADE1_CAST.length) {
    throw new Error('[seed-bar-attendants] GRADE1_BY_PLANET duplicate name');
  }
  for (const name of placedGrade1) {
    if (!grade1ByName.has(name)) {
      throw new Error(`[seed-bar-attendants] unknown grade1 name ${name}`);
    }
  }

  const coreIds = listCoreBarPlanetIds();
  if (coreIds.length !== CORE_BAR_PLANET_COUNT) {
    throw new Error(
      `[seed-bar-attendants] expected ${CORE_BAR_PLANET_COUNT} core hasBar planets, got ${coreIds.length}: ${coreIds.join(',')}`,
    );
  }
  const frontierEntries = listFrontierBarEntries();
  if (frontierEntries.length < 1) {
    throw new Error('[seed-bar-attendants] expected synth hasBar planets, got 0');
  }
  const policyRows = writeRosterPolicy(coreIds, frontierEntries);
  const policyByPlanet = new Map(
    policyRows.map((r) => [
      r.planetId,
      {
        rosterBase: Number(r.rosterBase),
        poolSize: Number(r.poolSize),
        qualityTier: Number(r.qualityTier),
      },
    ]),
  );

  const planets = [...coreIds, ...frontierEntries.map((e) => e.planetId)];
  const header = [
    'attendantId',
    'planetId',
    'displayNameKo',
    'displayNameEn',
    'taglineKo',
    'taglineEn',
    'portraitImageAssetKey',
    'minBarLevel',
    'rosterWeight',
    'dialogSetId',
    'animSetId',
    'songId',
    'enabled',
  ];

  const rows = [];
  let globalIndex = 0;
  let reserveCursor = 0;
  const seenIds = new Set();
  const seenGrade1 = new Set();

  for (const planetId of planets) {
    const policy = policyByPlanet.get(planetId);
    if (!policy) throw new Error(`[seed-bar-attendants] missing roster policy for ${planetId}`);
    const { poolSize, qualityTier } = policy;
    if (poolSize < 1 || poolSize > 2) {
      throw new Error(`[seed-bar-attendants] ${planetId} poolSize ${poolSize} not in 1..2`);
    }
    const assigned = GRADE1_BY_PLANET[planetId] ?? [];
    if (assigned.length > poolSize) {
      throw new Error(`[seed-bar-attendants] ${planetId} grade1 ${assigned.length} > pool ${poolSize}`);
    }
    const seenNamesKo = new Set();
    const seenNamesEn = new Set();
    for (let slot = 0; slot < poolSize; slot++) {
      globalIndex += 1;
      const attendantId = `ta_att_${pad3(globalIndex)}`;
      if (seenIds.has(attendantId)) throw new Error(`dup id ${attendantId}`);
      seenIds.add(attendantId);

      const grade1Name = assigned[slot];
      let displayNameKo;
      let displayNameEn;
      let taglineKo;
      let taglineEn;
      let portraitImageAssetKey;
      let dialogSetId;
      if (grade1Name) {
        const cast = grade1ByName.get(grade1Name);
        if (seenGrade1.has(cast.ko)) {
          throw new Error(`[seed-bar-attendants] grade1 reused ${cast.ko}`);
        }
        seenGrade1.add(cast.ko);
        displayNameKo = cast.ko;
        displayNameEn = cast.en;
        taglineKo = cast.tagKo;
        taglineEn = cast.tagEn;
        portraitImageAssetKey = cast.portrait;
        dialogSetId = cast.dialog;
      } else {
        const reserve = RESERVE_CAST[reserveCursor % RESERVE_CAST.length];
        reserveCursor += 1;
        if (grade1Names.has(reserve.ko)) {
          throw new Error(`[seed-bar-attendants] reserve collided grade1 ${reserve.ko}`);
        }
        displayNameKo = reserve.ko;
        displayNameEn = reserve.en;
        taglineKo = reserve.tagKo;
        taglineEn = reserve.tagEn;
        portraitImageAssetKey = '';
        dialogSetId = reserve.dialog;
      }

      if (seenNamesKo.has(displayNameKo) || seenNamesEn.has(displayNameEn)) {
        throw new Error(`dup name ${displayNameKo} on ${planetId}`);
      }
      seenNamesKo.add(displayNameKo);
      seenNamesEn.add(displayNameEn);

      rows.push({
        attendantId,
        planetId,
        displayNameKo,
        displayNameEn,
        taglineKo,
        taglineEn,
        portraitImageAssetKey,
        minBarLevel: 1,
        rosterWeight: 10 + qualityTier,
        dialogSetId,
        animSetId: 'aset_soft',
        songId: `song_0${((globalIndex - 1) % 5) + 1}`,
        enabled: 1,
      });
    }
  }

  if (seenGrade1.size !== GRADE1_CAST.length) {
    throw new Error(
      `[seed-bar-attendants] placed grade1 ${seenGrade1.size} != ${GRADE1_CAST.length}`,
    );
  }

  const csv =
    [
      header.join(','),
      ...rows.map((r) => header.map((h) => csvCell(r[h])).join(',')),
    ].join('\n') + '\n';
  writeFileSync(OUT_PATH, csv, 'utf8');

  const filled = rows.filter((r) => r.portraitImageAssetKey).length;
  const empty = rows.length - filled;
  console.log(
    `[seed-bar-attendants] wrote ${rows.length} attendants · grade1=${filled} empty=${empty} · planets=${planets.length} → ${OUT_PATH}`,
  );
}

main();
