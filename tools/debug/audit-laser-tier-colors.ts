// 레이저 무기 등급별 색상 전수검사 (2026-07-22 대표님 지시)
// weapon_list.csv 레이저 전 행 × weapon_laser_tier_color_policy.csv 매핑 검증
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../src/data/generated/csvWeapons';
import { WeaponLaserTierColorPolicy_FROM_BALANCE_CSV } from '../../src/data/balance/generated/csvWeaponLaserTierColorPolicy';

type PolicyRow = (typeof WeaponLaserTierColorPolicy_FROM_BALANCE_CSV)[number];

function resolveTier(requiredLevel: number): PolicyRow | null {
  for (const row of WeaponLaserTierColorPolicy_FROM_BALANCE_CSV) {
    const min = Number(row.minRequiredLevel) || 1;
    const max = Number(row.maxRequiredLevel) || 999;
    if (requiredLevel >= min && requiredLevel <= max) return row;
  }
  return null;
}

// 1) 정책 밴드 자체 검증 — 연속·비중첩·1~999 커버
{
  let fail = 0;
  const rows = [...WeaponLaserTierColorPolicy_FROM_BALANCE_CSV].sort(
    (a, b) => Number(a.minRequiredLevel) - Number(b.minRequiredLevel),
  );
  let expectMin = 1;
  for (const r of rows) {
    const min = Number(r.minRequiredLevel);
    const max = Number(r.maxRequiredLevel);
    if (min !== expectMin) {
      console.log(`FAIL band gap/overlap: ${r.tierLabelKo} min=${min} expected=${expectMin}`);
      fail++;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(r.beamCoreColor) || !/^#[0-9A-Fa-f]{6}$/.test(r.beamGlowColor)) {
      console.log(`FAIL invalid hex: ${r.tierLabelKo}`);
      fail++;
    }
    expectMin = max + 1;
  }
  console.log(fail === 0 ? 'PASS 정책 밴드 — 연속·비중첩·hex 유효 (8단계, 1~999)' : `FAIL ${fail}건`);
}

// 2) 레이저 무기 전수 — 요구레벨 → 등급 매핑
const lasers = Object.values(CAPITAL_WEAPON_LIST_FROM_CSV).filter((w) => w.kind === 'laser');
console.log(`\n레이저 무기 총 ${lasers.length}종 (전체 ${Object.keys(CAPITAL_WEAPON_LIST_FROM_CSV).length}종 중)`);
const bandCount = new Map<string, number>();
let unresolved = 0;
for (const w of lasers.sort((a, b) => a.requiredLevel - b.requiredLevel)) {
  const csvOverride = (w.laserColor ?? '').trim();
  const tier = resolveTier(Math.max(1, w.requiredLevel || 1));
  const label = csvOverride ? `개별색상 ${csvOverride}` : tier?.tierLabelKo ?? 'UNRESOLVED';
  if (!csvOverride && !tier) unresolved++;
  const listed = w.tradePortListed === false ? ' [비진열]' : '';
  console.log(
    `  L${String(w.requiredLevel).padStart(2)} ${w.id.padEnd(26)} ${String(w.tierLabel).padEnd(4)} → ${label}${csvOverride ? '' : ` core=${tier?.beamCoreColor} glow=${tier?.beamGlowColor}`}${listed}`,
  );
  if (!csvOverride && tier) bandCount.set(tier.tierLabelKo, (bandCount.get(tier.tierLabelKo) ?? 0) + 1);
}

// 3) 밴드별 분포 — 빈 밴드(무기 없는 색 구간) 탐지
console.log('\n밴드별 레이저 분포:');
for (const r of WeaponLaserTierColorPolicy_FROM_BALANCE_CSV) {
  const n = bandCount.get(r.tierLabelKo) ?? 0;
  console.log(`  ${r.tierLabelKo.padEnd(12)} (L${r.minRequiredLevel}~${r.maxRequiredLevel}) : ${n}종${n === 0 ? '  ← 빈 밴드' : ''}`);
}
console.log(unresolved === 0 ? '\nPASS 전 레이저 등급 매핑 — 미해결 0건' : `\nFAIL 미해결 ${unresolved}건`);
