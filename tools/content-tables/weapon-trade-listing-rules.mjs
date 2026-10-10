/**
 * 무역소 진열 규칙 — 판단 근거는 weapon_list.csv `specialUse` 열(Table-First · 2026-10-10).
 * 코드에 무기 id·id 패턴을 두지 않는다. 새 특수·테스트 무기는 CSV 행의 specialUse 로만 지정.
 *
 *   (빈칸)     운영 무기
 *   concept    콘셉트 무기 — 진열·적 무장 곡선 제외, 행은 유지(예: 피해 999 전설)
 *   npc_clone  NPC 슬롯 복제·테스트 — 진열·적 곡선·TTK 재조정 제외
 *   wave_test  웨이브 디펜스 테스트 — 전 무역소 상시 진열(pinned) · testTradePriceCredits 가격 · 적 곡선·TTK 제외
 */

export const WEAPON_SPECIAL_USES = new Set(['', 'concept', 'npc_clone', 'wave_test']);

export function readWeaponSpecialUse(raw) {
  const v = String(raw ?? '').trim().toLowerCase();
  if (!WEAPON_SPECIAL_USES.has(v)) throw new Error(`weapon_list.csv specialUse 값 오류: "${raw}"`);
  return v;
}

export function isWaveTestTradeWeapon(specialUse) {
  return specialUse === 'wave_test';
}

/** TTK 재조정·NPC 복제 판정 대상 밖(테스트 무기) */
export function isTestOnlyWeapon(specialUse) {
  return specialUse === 'npc_clone' || specialUse === 'wave_test';
}

export function isTradePortEligibleWeapon(id, specialUse) {
  if (!String(id ?? '').trim().startsWith('w_')) return false;
  return specialUse === '' || specialUse === 'wave_test';
}

/** 입문 기본 무장 — 전 무역소 상시 진열(등급라벨 기본) */
export function isPinnedStarterTradeWeapon(tierLabel = '') {
  return String(tierLabel ?? '').trim() === '기본';
}
