/**
 * 무기·아이템 전수조사 덤프 (문서 작성용, 앱 무영향)
 * node tools/debug/audit-weapon-item-dev-gaps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);

function readCsv(rel) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        q = !q;
      }
    } else if (ch === ',' && !q) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const weapons = readCsv('tables/content/weapon_list.csv');
const craftPolicy = readCsv('tables/balance/weapon_craft_loiter_policy.csv');
const familyPolicy = readCsv('tables/balance/weapon_family_runtime_policy.csv');
const items = readCsv('tables/content/item_defs.csv');

const craftByWeapon = new Map();
for (const r of craftPolicy) {
  const id = String(r.weaponId ?? '').trim();
  if (id) craftByWeapon.set(id, r);
}

const flavorKeywords = [
  ['emp', /EMP|전자교란|시스템 정지|마비/],
  ['nova_aoe', /노바|차원 붕괴|시공간|60픽셀/],
  ['shield_ignore', /실드 무시|내부 폭격|장갑 관통|실드를 무시/],
  ['slow', /감속|속박|격리| entrop|엔트로피|수용/],
  ['aoe', /광역|반경|폭발 범위|주위/],
  ['intercept', /요격|미사일 격추|접근 미사일/],
  ['kamikaze', /자폭|돌격|들이받/],
  ['swarm', /군집|편대|다수|여러 기/],
  ['heal_ally', /아군.*회복|수리/],
  ['stealth', /은신|스텔스|투명/],
  ['dot', /지속 피해|부식|독|출혈/],
  ['chain', /연쇄|체인|튕/],
  ['split', /분열|갈라/],
  ['mine', /기뢰|지뢰|부설/],
  ['beam_charge', /충전|차징/],
  ['pierce_ship', /관통.*함|함선.*관통/],
];

function tagsFromDesc(desc) {
  const hits = [];
  for (const [tag, re] of flavorKeywords) {
    if (re.test(desc)) hits.push(tag);
  }
  return hits;
}

const weaponAudit = weapons.map((w) => {
  const family = String(w.무기분류 || w.종류 || '').trim();
  const id = w.id.trim();
  const desc = `${w.특징설명 || ''} ${w.타격범위 || ''} ${w.피격효과 || ''}`;
  const flavor = tagsFromDesc(desc);
  const listed = String(w.tradePortListed).toUpperCase() === 'TRUE';
  const nova = String(w.타격범위 || '').includes('60');
  const craft = craftByWeapon.get(id);
  return {
    id,
    name: w.이름,
    kind: w.종류,
    familyKind: family || w.종류,
    level: w.요구레벨,
    listed,
    dmg: w.대미지,
    cd: w.재장전ms,
    range: w.사거리px,
    desc: (w.특징설명 || '').trim(),
    flavor,
    novaSig: nova,
    craftProfile: craft?.profileId || '',
    craftFlags: craft
      ? {
          craftCount: craft.craftCount,
          orbitAttack: craft.orbitAttack,
          ignoreShield: craft.ignoreShield,
          aoe: craft.aoeRadiusPx,
          intercept: craft.interceptMissiles,
          pierce: craft.pierceAfterStrike,
          ram: craft.ramThenRtb,
          slow: craft.slowMul,
        }
      : null,
  };
});

const itemAudit = items.map((it) => {
  let attrs = {};
  try {
    attrs = it.attrsJson ? JSON.parse(it.attrsJson) : {};
  } catch {
    attrs = { _parseError: true };
  }
  return {
    id: it.id,
    name: it.name,
    kind: it.kind,
    type: it.type,
    category: it.category,
    tradeable: it.tradeable,
    mountable: it.capitalShipMountable,
    desc: (it.특징설명 || it.description || '').trim(),
    tags: (it.tagsPipe || '').split('|').filter(Boolean),
    attrsKeys: Object.keys(attrs),
    attrs,
  };
});

const byKind = {};
const byType = {};
for (const it of itemAudit) {
  byKind[it.kind] = (byKind[it.kind] || 0) + 1;
  const k = `${it.kind}/${it.type}`;
  byType[k] = (byType[k] || 0) + 1;
}

const out = {
  generatedAt: '2026-09-13',
  familyPolicy,
  weaponCount: weapons.length,
  weapons: weaponAudit,
  itemCount: items.length,
  itemsByKind: byKind,
  itemsByKindType: byType,
  items: itemAudit,
};

const dest = path.join(root, 'tools/kim-team-lead/reports/_weapon_item_gap_dump.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(`weapons=${weapons.length} items=${items.length} -> ${dest}`);
console.log('itemsByKind', byKind);
console.log('itemsByKindType', byType);
const fam = {};
for (const w of weaponAudit) {
  const k = `${w.familyKind}|listed=${w.listed}`;
  fam[k] = (fam[k] || 0) + 1;
}
console.log('weapons', fam);
