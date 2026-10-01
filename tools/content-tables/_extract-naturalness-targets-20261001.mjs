/**
 * 김클로드 NPC_DIALOGUE_NATURALNESS_PROPOSAL.md §5-3 187행 + 잔여 단문3연속 추출.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

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
      } else field += ch;
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
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadCsv(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, '').trim());
  return rows.slice(1).filter((r) => r.some((c) => String(c ?? '').trim())).map((r) => {
    const o = {};
    header.forEach((h, i) => {
      o[h] = r[i] ?? '';
    });
    return o;
  });
}

function keyOf(sceneId, pageIndex) {
  return `${sceneId}#${pageIndex}`;
}

function isStaccato(text) {
  const t = String(text ?? '').replace(/\r/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  const sents = t.split(/(?<=[.!?다요군지마네까])\s+/).filter((s) => s.replace(/[.!?…\s]/g, '').length > 0);
  const periodSents = t.split(/[.。]/).map((s) => s.trim()).filter(Boolean);
  const use = periodSents.length >= sents.length ? periodSents : sents;
  if (use.length < 3) return false;
  const short = use.filter((s) => s.replace(/\s/g, '').length <= 16).length;
  return short >= 3;
}

const MAIN = [
  '002_d#1', '003_a#0', '003_b#0', '004_b#0', '006_c#0', '007_a#0', '007_a#1', '007_b#0', '007_e#0',
  '008_a#0', '008_c#0', '008_d#0', '009_b#0', '009_b#1', '009_d#0', '009_d#1', '010_b#0', '010_d#1',
  '010_e#0', '011_a#0', '011_a#1', '011_e#0', '012_a#0', '012_b#0', '012_d#1', '012_e#0', '013_b#0',
  '013_c#1', '013_d#0', '013_e#0', '013_e#1', '014_a#0', '014_b#0', '014_b#1', '014_c#0', '014_c#1',
  '014_e#0', '014_e#1', '015_b#0', '015_b#1', '015_e#0', '015_e#1', '016_c#0', '016_e#0', '016_e#1',
  '017_a#0', '017_a#1', '017_b#1', '017_d#0', '017_d#1', '017_e#0', '018_a#0', '018_b#0', '018_c#0',
  '018_d#1', '018_e#0', '019_a#0', '019_b#0', '019_c#0', '019_c#1', '019_d#0', '019_d#1', '020_a#0',
  '020_c#0', '020_c#1', '020_d#0', '021_a#0', '021_c#0', '021_d#0', '021_e#0', '022_a#0', '022_b#0',
  '022_c#0', '022_c#1', '022_d#0', '022_e#0', '023_b#1', '023_c#0', '024_b#0', '024_c#0', '025_b#0',
  '025_b#1', '025_c#0', '026_a#0', '026_b#0', '026_c#0', '027_a#0', '027_b#0', '029_a#0', '029_b#0',
  '029_c#0', '030_a#0', '030_b#0', '030_c#0', '030_c#1',
].map((s) => `story_dialog_obj_story_${s}`);

const SUB_OBJ = [
  's034_c#0', 's034_e#0', 's034_e#1', 's035_a#1', 's035_c#1', 's036_d#1', 's056_a#0', 's056_c#0',
  's056_c#1', 's056_e#0', 's057_a#1', 's057_c#0', 's057_e#0', 's058_a#0', 's058_a#1', 's058_c#0',
  's058_e#0', 's059_a#0', 's059_a#1', 's059_c#0', 's059_e#0', 's060_c#0', 's060_d#0', 's060_d#1',
  's060_e#0', 's061_c#0', 's061_d#0', 's061_d#1', 's061_e#0', 's062_c#0', 's062_d#0', 's062_d#1',
  's062_e#0', 's063_a#1', 's063_c#0', 's063_d#0', 's063_d#1', 's063_e#0',
].map((s) => `story_dialog_obj_${s}`);

const SQ_NPC = [
  'kett_mion#0', 'ren_coil#0', 'ren_coil#2', 'maya_belt#0', 'maya_belt#2', 'jor_finn#0', 'jor_finn#2',
  'sel_vane#0', 'sel_vane#2', 'has_quinn#0', 'has_quinn#2', 'iva_wren#0', 'iva_wren#2', 'peck_sorin#0',
  'peck_sorin#2', 'dain_rho#0', 'dain_rho#2', 'mir_kell#0', 'mir_kell#2', 'osa_pell#0', 'osa_pell#2',
  'brin_tack#0', 'brin_tack#2', 'nell_kay#0', 'nell_kay#2', 'kael_vonn#0', 'kael_vonn#2', 'sira_mek#0',
  'sira_mek#2', 'ev_holt#0', 'ev_holt#2', 'toma_kale#0', 'toma_kale#2',
].map((s) => `npc_dialog_sq_${s}`);

const MAIN_SCENE = [
  'story_dialog_story_003#0', 'story_dialog_story_004#0', 'story_dialog_story_007#0',
  'story_dialog_story_012#0', 'story_dialog_story_013#0', 'story_dialog_story_014#0',
  'story_dialog_story_015#0', 'story_dialog_story_017#0', 'story_dialog_story_019#0',
  'story_dialog_story_021#0', 'story_dialog_story_022#0', 'story_dialog_story_024#0',
  'story_dialog_story_026#0', 'story_dialog_story_029#0', 'story_dialog_story_030#0',
  'story_dialog_story_030#1',
];

const OTHER = [
  'mission_clear_mission_002#0', 'story_chapter_end_01#1', 'story_chapter_end_01#3',
  'npc_dialog_vega_blue_10#0', 'npc_dialog_story_gaon_tela#0',
];

const TARGET_KEYS = new Set([...MAIN, ...SUB_OBJ, ...SQ_NPC, ...MAIN_SCENE, ...OTHER]);

const pages = loadCsv('tables/content/story_scene_pages.csv');
const missions = loadCsv('tables/content/missions.csv');
const objectives = loadCsv('tables/content/mission_objectives.csv');

const missionById = new Map(missions.map((m) => [m.id, m]));
const objById = new Map(objectives.map((o) => [o.id, o]));

function missionHint(sceneId) {
  const m = String(sceneId);
  let missionId = '';
  let objectiveId = '';
  const storyObj = m.match(/^story_dialog_obj_(story_\d+_[a-z])$/);
  if (storyObj) {
    objectiveId = `obj_${storyObj[1]}`;
    missionId = storyObj[1].replace(/_[a-z]$/, '');
  }
  const subObj = m.match(/^story_dialog_obj_(s\d+_[a-z])$/);
  if (subObj) {
    objectiveId = `obj_${subObj[1]}`;
    const pack = subObj[1].match(/^s(\d+)/);
    missionId = pack ? `sandbox_${pack[1]}` : '';
  }
  const storyScene = m.match(/^story_dialog_story_(\d+)$/);
  if (storyScene) missionId = `story_${storyScene[1]}`;
  const sq = m.match(/^npc_dialog_sq_(.+)$/);
  const mission = missionById.get(missionId) ?? null;
  const objective = objById.get(objectiveId) ?? null;
  return {
    missionId,
    objectiveId,
    missionTitle: mission?.titleKo || mission?.title || '',
    missionSummary: mission?.summaryKo || mission?.loglineKo || mission?.descriptionKo || '',
    objectiveText: objective?.textKo || objective?.titleKo || objective?.descriptionKo || '',
    offerCaptain: mission?.offerCaptainId || '',
    sqHint: sq ? sq[1] : '',
  };
}

const byScene = new Map();
for (const p of pages) {
  const sid = String(p.sceneId ?? '').trim();
  if (!sid) continue;
  if (!byScene.has(sid)) byScene.set(sid, []);
  byScene.get(sid).push(p);
}

const listed = [];
const missing = [];
for (const key of TARGET_KEYS) {
  const [sceneId, pageStr] = key.split('#');
  const pageIndex = Number(pageStr);
  const scenePages = byScene.get(sceneId) ?? [];
  const page = scenePages.find((p) => Number(p.pageIndex) === pageIndex);
  if (!page) {
    missing.push(key);
    continue;
  }
  const hint = missionHint(sceneId);
  listed.push({
    key,
    sceneId,
    pageIndex,
    label: page.label,
    speakerNpcCaptainId: page.speakerNpcCaptainId,
    text: page.text,
    text_en: page.text_en,
    staccato: isStaccato(page.text),
    staccatoEn: isStaccato(page.text_en),
    hint,
    sceneTexts: scenePages
      .sort((a, b) => Number(a.pageIndex) - Number(b.pageIndex))
      .map((p) => ({ pageIndex: Number(p.pageIndex), text: p.text, text_en: p.text_en })),
  });
}

const extraStaccato = [];
for (const p of pages) {
  const sid = String(p.sceneId ?? '').trim();
  const pi = Number(p.pageIndex);
  const key = keyOf(sid, pi);
  if (TARGET_KEYS.has(key)) continue;
  if (!isStaccato(p.text)) continue;
  if (String(p.viewMode) === 'cinematic') continue;
  extraStaccato.push({
    key,
    sceneId: sid,
    pageIndex: pi,
    label: p.label,
    speakerNpcCaptainId: p.speakerNpcCaptainId,
    text: p.text,
    text_en: p.text_en,
  });
}

const out = {
  listedCount: listed.length,
  listedMissing: missing,
  listedStillStaccato: listed.filter((x) => x.staccato).length,
  listedEnStaccato: listed.filter((x) => x.staccatoEn).length,
  extraStaccatoCount: extraStaccato.length,
  listed,
  extraStaccato,
};

const outPath = resolve(ROOT, 'tools/kim-team-lead/reports/_naturalness-targets-20261001.json');
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({
  listedCount: out.listedCount,
  listedMissing: missing,
  listedStillStaccato: out.listedStillStaccato,
  listedEnStaccato: out.listedEnStaccato,
  extraStaccatoCount: out.extraStaccatoCount,
  extraKeys: extraStaccato.map((x) => x.key),
}, null, 2));
