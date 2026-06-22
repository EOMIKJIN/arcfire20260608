/**
 * 함선 장비 — 라인당 3등급(이름+숫자) item_defs 행 생성
 * npm run build:content-tables 전에 item_defs에 병합하거나 stdout으로 출력
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ITEM_DEFS = resolve(ROOT, 'tables/content/item_defs.csv');

/** 기획: 1등급=100% · 2등급=150% · 3등급=200% (효과 수치 배율) */
const GRADE_PERFORMANCE_MUL = [1, 1.5, 2];
const GRADE_PRICE_MUL = [1, 2, 3.5];
const GRADE_LEVEL_STEP = [0, 9, 20];

/** @type {Array<{ stem: string, name: string, desc: string, category: string, basePrice: number, baseReq: number, statKey: string, baseStat: number }>} */
const LINES = [
  { stem: 'eq_prop_ion_booster', name: '이온가속부스터', desc: '추진 노즐 가속으로 기동 반응을 높인다(추후 연동).', category: 'propulsion', basePrice: 1800, baseReq: 3, statKey: 'speedBonusPct', baseStat: 5 },
  { stem: 'eq_prop_fusion_core', name: '핵융합코어', desc: '동력 효율을 개선해 장비 전력 여유를 확보한다(추후 연동).', category: 'propulsion', basePrice: 2000, baseReq: 5, statKey: 'powerEfficiencyPct', baseStat: 6 },
  { stem: 'eq_prop_vector_thruster', name: '벡터추력기', desc: '세밀한 자세 제어와 급가속을 지원한다(추후 연동).', category: 'propulsion', basePrice: 2200, baseReq: 7, statKey: 'maneuverBonusPct', baseStat: 7 },
  { stem: 'eq_def_molecular_armor', name: '분자장갑판', desc: '물리 충격을 분산해 선체 피해를 줄인다(추후 연동).', category: 'defense', basePrice: 2200, baseReq: 4, statKey: 'armorBonusPct', baseStat: 6 },
  { stem: 'eq_def_shield_amp', name: '실드증폭기', desc: '실드 용량과 재생 효율을 보조한다(추후 연동).', category: 'defense', basePrice: 2400, baseReq: 6, statKey: 'shieldBonusPct', baseStat: 7 },
  { stem: 'eq_def_ablative_plate', name: '외장장갑', desc: '일회성 충격 흡수층으로 급격한 피해를 완화한다(추후 연동).', category: 'defense', basePrice: 2600, baseReq: 8, statKey: 'damageReductionPct', baseStat: 8 },
  { stem: 'eq_sens_long_scan', name: '장거리스캔', desc: '교전 전 적 탐지 범위를 확장한다(추후 연동).', category: 'sensor', basePrice: 1600, baseReq: 2, statKey: 'detectRangeBonusPct', baseStat: 6 },
  { stem: 'eq_sens_secure_comms', name: '암호통신모듈', desc: '데이터 링크 안정성과 전술 공유를 보조한다(추후 연동).', category: 'sensor', basePrice: 1800, baseReq: 4, statKey: 'linkStabilityPct', baseStat: 7 },
  { stem: 'eq_sens_passive_array', name: '패시브센서', desc: '저출력 은밀 탐지를 지원한다(추후 연동).', category: 'sensor', basePrice: 2000, baseReq: 6, statKey: 'stealthDetectBonusPct', baseStat: 8 },
  { stem: 'eq_ew_ecm_jammer', name: '전자파재머', desc: '적 유도·락온을 교란한다(추후 연동).', category: 'ew', basePrice: 2400, baseReq: 5, statKey: 'ecmStrengthPct', baseStat: 6 },
  { stem: 'eq_ew_tac_datalink', name: '전술데이터링크', desc: '아군 교전 시 정보 공유를 강화한다(추후 연동).', category: 'ew', basePrice: 2600, baseReq: 7, statKey: 'allyBuffPct', baseStat: 7 },
  { stem: 'eq_ew_decoy_launcher', name: '미끼발사기', desc: '미사일 추적을 유인·분산한다(추후 연동).', category: 'ew', basePrice: 2800, baseReq: 9, statKey: 'decoyStrengthPct', baseStat: 8 },
  { stem: 'eq_sup_nano_repair', name: '나노수리로봇', desc: '전투 중 선체·시스템 손상을 점진 복구한다(추후 연동).', category: 'support', basePrice: 2600, baseReq: 6, statKey: 'hullRepairPerMinPct', baseStat: 4 },
  { stem: 'eq_sup_fire_control', name: '화재진압시스템', desc: '내부 화재·과열을 신속히 억제한다(추후 연동).', category: 'support', basePrice: 2800, baseReq: 8, statKey: 'overheatReductionPct', baseStat: 6 },
  { stem: 'eq_sup_hull_patch', name: '선체패치베이', desc: '격전 후 내구도를 신속 회복한다(추후 연동).', category: 'support', basePrice: 3000, baseReq: 10, statKey: 'postCombatRepairPct', baseStat: 7 },
  { stem: 'eq_nav_ai_assist', name: '보조항법장치', desc: '자동 회피·코스 보정을 지원한다(추후 연동).', category: 'navigation', basePrice: 1400, baseReq: 1, statKey: 'evasionBonusPct', baseStat: 4 },
  { stem: 'eq_nav_tac_processor', name: '전술연산프로세서', desc: '교전 판단·연사 스케줄 연산을 가속한다(추후 연동).', category: 'navigation', basePrice: 1600, baseReq: 3, statKey: 'cooldownReductionPct', baseStat: 5 },
  { stem: 'eq_nav_jump_calc', name: '워프항법계산기', desc: '장거리 항로 계산과 진입 안정성을 보조한다(추후 연동).', category: 'navigation', basePrice: 1800, baseReq: 5, statKey: 'routeEfficiencyPct', baseStat: 6 },
  { stem: 'eq_mining_drone', name: '채굴드론', desc: '궤도 채굴 효율을 높여준다(추후 기능 연동).', category: 'mining', basePrice: 2400, baseReq: 5, statKey: 'miningYieldBonusPct', baseStat: 8 },
];

function csvEscape(s) {
  const t = String(s);
  return t.includes(',') || t.includes('"') ? `"${t.replace(/"/g, '""')}"` : t;
}

function buildRows() {
  const rows = [];
  for (const line of LINES) {
    for (let g = 1; g <= 3; g += 1) {
      const gi = g - 1;
      const id = `${line.stem}_${g}`;
      const name = `${line.name}${g}`;
      const price = Math.round(line.basePrice * GRADE_PRICE_MUL[gi]);
      const req = line.baseReq + GRADE_LEVEL_STEP[gi];
      const perfMul = GRADE_PERFORMANCE_MUL[gi];
      const statVal = Math.round(line.baseStat * perfMul * 10) / 10;
      const desc = line.desc.replace(/\(추후 연동\)/g, '').replace(/\(추후 기능 연동\)/g, '').trim();
      const attrs = {
        equipmentCategory: line.category,
        equipmentGrade: g,
        equipmentLineKey: line.stem,
        equipmentRequiredLevel: req,
        equipmentPerformanceMul: perfMul,
        [line.statKey]: statVal,
        effectPending: line.category === 'mining',
      };
      if (line.category === 'mining' && g === 1) {
        attrs.miningCycleTimeBonusPct = 0;
      }
      const tags = `ship_equipment|${line.category}|trade_port|grade${g}`;
      const attrsJson = JSON.stringify(attrs).replace(/"/g, '""');
      rows.push([
        id,
        name,
        desc,
        desc,
        price,
        14 + g * 2,
        1,
        'tech',
        'equipment',
        'ship_equipment',
        'true',
        'true',
        'true',
        'false',
        tags,
        `"${attrsJson}"`,
        'true',
      ].join(','));
    }
  }
  return rows;
}

const raw = readFileSync(ITEM_DEFS, 'utf8');
const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/);
const header = lines[0];
const startIdx = lines.findIndex((l) => l.startsWith('eq_prop_ion_booster_1,') || l.startsWith('eq_prop_ion_booster,'));
const endIdx = lines.findIndex((l, i) => i > startIdx && (l.startsWith('capital_ship_') || l.startsWith('tg_')));
if (startIdx < 0 || endIdx < 0) {
  console.error('Could not find equipment block in item_defs.csv');
  process.exit(1);
}

const newBlock = buildRows();
const out = [
  ...lines.slice(0, startIdx),
  ...newBlock,
  ...lines.slice(endIdx),
].join('\n');
if (!out.endsWith('\n')) {
  writeFileSync(ITEM_DEFS, `${out}\n`, 'utf8');
} else {
  writeFileSync(ITEM_DEFS, out, 'utf8');
}
console.log(`Replaced equipment block with ${newBlock.length} rows (${LINES.length} lines × 3 grades)`);
