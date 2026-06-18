/**
 * synth_system_colonization.csv — systemNameEn, planetNameEn, *DescriptionEn 주입
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../../tables/balance/synth_system_colonization.csv');

const WORD = {
  실버: 'Silver',
  오로라: 'Aurora',
  네뷸라: 'Nebula',
  크림슨: 'Crimson',
  아스트라: 'Astra',
  페가수스: 'Pegasus',
  리갈리아: 'Regalia',
  세레니티: 'Serenity',
  볼타: 'Volta',
  헤일로: 'Halo',
  프로스트: 'Frost',
  엠버: 'Ember',
  테라: 'Terra',
  루나: 'Luna',
  솔: 'Sol',
  카론: 'Charon',
  오리온: 'Orion',
  알타: 'Alta',
  벡터: 'Vector',
  프리즘: 'Prism',
  퀘이사: 'Quasar',
  이클립스: 'Eclipse',
  포지: 'Forge',
  마그마: 'Magma',
  시트린: 'Citrine',
  코발트: 'Cobalt',
  제니스: 'Zenith',
  아틀라스: 'Atlas',
  헤르메스: 'Hermes',
  노바: 'Nova',
  펄: 'Pearl',
  쿼츠: 'Quartz',
  제피르: 'Zephyr',
  바이퍼: 'Viper',
  스펙터: 'Specter',
  글레이: 'Gray',
  세이지: 'Sage',
  루비: 'Ruby',
  사파이어: 'Sapphire',
  오팔: 'Opal',
  티탄: 'Titan',
  바이킹: 'Viking',
  드리프트: 'Drift',
  하버: 'Harbor',
  크레스트: 'Crest',
  포트: 'Port',
  게이트: 'Gate',
  리지: 'Ridge',
  베이: 'Bay',
  코브: 'Cove',
  섀도: 'Shadow',
  아우라: 'Aura',
  미스트: 'Mist',
  글로우: 'Glow',
  스파크: 'Spark',
  플레어: 'Flare',
  비콘: 'Beacon',
  시그널: 'Signal',
  패스: 'Pass',
  트레일: 'Trail',
  크로스: 'Cross',
  링: 'Ring',
  아크: 'Arc',
  스톤: 'Stone',
  필드: 'Field',
  마크: 'Mark',
  포인트: 'Point',
  노드: 'Node',
  허브: 'Hub',
  코어: 'Core',
  프론티어: 'Frontier',
  보더: 'Border',
  아웃포스트: 'Outpost',
  베이스: 'Base',
  캠프: 'Camp',
  거점: 'Stronghold',
  관문: 'Gate',
  요새: 'Fortress',
  성역: 'Sanctum',
  프라임: 'Prime',
  딥: 'Deep',
  시타델: 'Citadel',
  스테이션: 'Station',
  오리진: 'Origin',
};

const SUFFIX = {
  ' 관측국': ' Observatory',
  ' 성채': ' Citadel',
  ' 전초기지': ' Outpost',
  ' 채굴지': ' Mining Site',
  ' 에너지 벨트': ' Energy Belt',
  ' 무역 거점': ' Trade Hub',
  ' 국경': ' Border',
  ' 개척지': ' Colony',
  ' 항로': ' Route',
  ' 베이스': ' Base',
};

function translateKoName(ko) {
  let s = String(ko ?? '').trim();
  for (const [suffix, en] of Object.entries(SUFFIX)) {
    if (s.endsWith(suffix)) {
      const prefix = s.slice(0, -suffix.length).trim();
      const words = prefix.split(/\s+/);
      const enWords = words.map((w) => WORD[w] ?? w);
      return `${enWords.join(' ')}${en}`.trim();
    }
  }
  const words = s.split(/\s+/);
  return words.map((w) => WORD[w] ?? w).join(' ');
}

function systemDescEn(ordinal) {
  return `Frontier system #${ordinal} colonized by ArcCore. Routes are connecting and factions are arriving.`;
}

function planetDescEn(planetNameEn) {
  return `${planetNameEn} — hub planet activated by ArcCore auto-development protocol.`;
}

function parseCsvLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function escapeCsv(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const raw = fs.readFileSync(CSV_PATH, 'utf8');
const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
const extraCols = ['systemNameEn', 'planetNameEn', 'systemDescriptionEn', 'planetDescriptionEn'];
const colIdx = {};
for (const col of extraCols) {
  let idx = header.indexOf(col);
  if (idx < 0) {
    idx = header.length;
    header.push(col);
  }
  colIdx[col] = idx;
}

const outLines = [header.map(escapeCsv).join(',')];
for (let li = 1; li < lines.length; li += 1) {
  const cols = parseCsvLine(lines[li]);
  if (!cols.some((c) => String(c ?? '').trim())) continue;
  while (cols.length < header.length) cols.push('');

  const koSystem = cols[header.indexOf('systemNameKo')]?.trim() ?? '';
  const koPlanet = cols[header.indexOf('planetNameKo')]?.trim() ?? '';
  const ordinal = cols[header.indexOf('synthOrdinal')]?.trim() ?? '';

  const systemNameEn = translateKoName(koSystem);
  const planetNameEn = translateKoName(koPlanet);

  if (!cols[colIdx.systemNameEn]?.trim()) cols[colIdx.systemNameEn] = systemNameEn;
  if (!cols[colIdx.planetNameEn]?.trim()) cols[colIdx.planetNameEn] = planetNameEn;
  if (!cols[colIdx.systemDescriptionEn]?.trim()) {
    cols[colIdx.systemDescriptionEn] = systemDescEn(ordinal);
  }
  if (!cols[colIdx.planetDescriptionEn]?.trim()) {
    cols[colIdx.planetDescriptionEn] = planetDescEn(planetNameEn);
  }

  outLines.push(cols.map(escapeCsv).join(','));
}

fs.writeFileSync(CSV_PATH, `${outLines.join('\n')}\n`, 'utf8');
console.log('patched synth_system_colonization.csv');
