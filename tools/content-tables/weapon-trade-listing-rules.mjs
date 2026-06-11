/**
 * 무역소 제외 규칙 — NPC 슬롯용 번호 복제(vmock·wave)만 제외.
 * 경량 레이저(w_laser_light_01) 등 실제 게임 무기·NPC 기본 무장은 판매 대상.
 */

export function isNpcSlotCloneWeapon(id, tierLabel = '') {
  const normalized = String(id ?? '').trim().toLowerCase();
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
