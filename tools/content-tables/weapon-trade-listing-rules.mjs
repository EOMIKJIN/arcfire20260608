/**
 * 무역소 제외 규칙 — NPC 슬롯용 번호 복제(vmock·wave)만 제외.
 * 경량 레이저(w_laser_light_01) 등 실제 게임 무기·NPC 기본 무장은 판매 대상.
 */

/**
 * 웨이브 디펜스 테스트 무기 — 테스트 단계 한정 상점 판매 허용(예외).
 * `_wave$`/등급 '웨이브'·'테스트' 일괄 제외 규칙에서 이 2종만 되돌린다.
 * (재생성해도 유지) 운영 무기 풀에는 영향 없음.
 */
export const WAVE_TEST_TRADE_ALLOWLIST = new Set(['w_laser_wave', 'w_missile_wave']);

export function isWaveTestTradeWeapon(id) {
  return WAVE_TEST_TRADE_ALLOWLIST.has(String(id ?? '').trim().toLowerCase());
}

export function isNpcSlotCloneWeapon(id, tierLabel = '') {
  const normalized = String(id ?? '').trim().toLowerCase();
  if (isWaveTestTradeWeapon(normalized)) return false;
  const tier = String(tierLabel ?? '').trim();
  if (!normalized.startsWith('w_')) return false;
  if (/_vmock_/.test(normalized)) return true;
  if (/_wave$/.test(normalized)) return true;
  if (tier === '웨이브' || tier === '테스트') return true;
  return false;
}

export function isTradePortEligibleWeapon(id, tierLabel = '') {
  const normalized = String(id ?? '').trim();
  if (!normalized.startsWith('w_')) return false;
  return !isNpcSlotCloneWeapon(normalized, tierLabel);
}

/** 입문 기본 무장 — 전 무역소 상시 진열(등급라벨 기본) */
export function isPinnedStarterTradeWeapon(tierLabel = '') {
  return String(tierLabel ?? '').trim() === '기본';
}
