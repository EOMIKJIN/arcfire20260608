// 1회성: planet_governor_reserve_commanders.csv 에 combatTacticsGrade(-5..+5) 컬럼 추가.
// 등급은 계급·역할(rankKo·governorTitleKo) 분석 기반 — 총사령관 전용 [전투전술영향].
// 같은 reserveOrder 의 BLUE/RED 등급 차 ≤2 (분쟁지역 고착 방지 배치 규칙).
import fs from 'node:fs';

const CSV = 'tables/content/planet_governor_reserve_commanders.csv';

/** captainId → 전술등급. 계급 서열·참모/방어 역할 가점, 초계·호위 0, 하위 예비 음수. */
const GRADE_BY_CAPTAIN = {
  // BLUE (스텔리움) — 제독/전략장 상위, 실무사령 중위, 후순위 예비 음수
  npc_cpt_gov_reserve_blue_01: 3, npc_cpt_gov_reserve_blue_02: 2,
  npc_cpt_gov_reserve_blue_03: 2, npc_cpt_gov_reserve_blue_04: 1,
  npc_cpt_gov_reserve_blue_05: 3, npc_cpt_gov_reserve_blue_06: 1,
  npc_cpt_gov_reserve_blue_07: 2, npc_cpt_gov_reserve_blue_08: 0,
  npc_cpt_gov_reserve_blue_09: 0, npc_cpt_gov_reserve_blue_10: 1,
  npc_cpt_gov_reserve_blue_11: -1, npc_cpt_gov_reserve_blue_12: 0,
  npc_cpt_gov_reserve_blue_13: -2, npc_cpt_gov_reserve_blue_14: -1,
  npc_cpt_gov_reserve_blue_15: 1, npc_cpt_gov_reserve_blue_16: -2,
  npc_cpt_gov_reserve_blue_17: 0, npc_cpt_gov_reserve_blue_18: -3,
  npc_cpt_gov_reserve_blue_19: -1, npc_cpt_gov_reserve_blue_20: 0,
  // RED (크림슨) — 군주/전략가 상위, 하위 습격대 음수 (동일 order 대비 ≤2 차)
  npc_cpt_gov_reserve_red_01: 3, npc_cpt_gov_reserve_red_02: 2,
  npc_cpt_gov_reserve_red_03: 1, npc_cpt_gov_reserve_red_04: 1,
  npc_cpt_gov_reserve_red_05: 2, npc_cpt_gov_reserve_red_06: 1,
  npc_cpt_gov_reserve_red_07: 1, npc_cpt_gov_reserve_red_08: 1,
  npc_cpt_gov_reserve_red_09: 0, npc_cpt_gov_reserve_red_10: 0,
  npc_cpt_gov_reserve_red_11: 0, npc_cpt_gov_reserve_red_12: -1,
  npc_cpt_gov_reserve_red_13: -1, npc_cpt_gov_reserve_red_14: -2,
  npc_cpt_gov_reserve_red_15: 0, npc_cpt_gov_reserve_red_16: -3,
  npc_cpt_gov_reserve_red_17: -1, npc_cpt_gov_reserve_red_18: -2,
  npc_cpt_gov_reserve_red_19: -3, npc_cpt_gov_reserve_red_20: -1,
  // NEUTRAL — 자치 성향, 전술 영향 없음
  npc_cpt_gov_reserve_neutral_01: 0, npc_cpt_gov_reserve_neutral_02: 0,
  npc_cpt_gov_reserve_neutral_03: 0, npc_cpt_gov_reserve_neutral_04: 0,
  npc_cpt_gov_reserve_neutral_05: 0,
};

const raw = fs.readFileSync(CSV, 'utf8');
const lines = raw.split(/\r?\n/);
const out = [];
for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i];
  if (!line.trim()) { out.push(line); continue; }
  if (i === 0) {
    if (line.includes('combatTacticsGrade')) {
      console.log('already has column — abort');
      process.exit(0);
    }
    out.push(`${line},combatTacticsGrade`);
    continue;
  }
  const captainId = line.split(',')[0].trim();
  const grade = GRADE_BY_CAPTAIN[captainId];
  if (grade === undefined) {
    console.error(`unknown captainId: ${captainId}`);
    process.exit(1);
  }
  out.push(`${line},${grade}`);
}
fs.writeFileSync(CSV, out.join('\n'), 'utf8');
console.log('done — rows:', out.filter((l, i) => i > 0 && l.trim()).length);
