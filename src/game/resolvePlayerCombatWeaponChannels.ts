// ============================================================
// 플레이어 기함 무기 채널 — equipSlots 정본
// 슬롯 해제('0'/빈값) = 그 채널 '' (CSV 기본무장·전역 근접 폴백 금지)
// 슬롯에 값이 있으나 카탈로그 미등록일 때만 runtime 기본값으로 방어 복구
// ============================================================

import type { PlayerShip } from '../types';
import { isKnownCapitalWeaponId } from './capitalWeaponRowLookup';
import { isEquipSlotFilled } from './combatWeaponSlots';

export type PlayerCombatWeaponChannels = {
  laserWeaponId: string;
  missileWeaponId: string;
  closeRangeWeaponId: string;
  auxWeaponId: string;
};

export type PlayerCombatWeaponRuntimeFallback = {
  laserWeaponId?: string;
  missileWeaponId?: string;
  closeRangeWeaponId?: string;
  auxWeaponId?: string;
};

function resolvePlayerCombatWeaponChannelId(
  slotRaw: string | null | undefined,
  runtimeFallbackId?: string | null,
): string {
  const raw = String(slotRaw ?? '').trim();
  if (!isEquipSlotFilled({ itemDefId: raw })) return '';
  const weaponId = raw.replace(/^weapon_item_/, '').trim();
  if (weaponId && isKnownCapitalWeaponId(weaponId)) return weaponId;
  const fallback = String(runtimeFallbackId ?? '').trim();
  return fallback && isKnownCapitalWeaponId(fallback) ? fallback : '';
}

/** 플레이어 한정 — 해제된 채널은 '' 확정. NPC 스폰 폴백과 분리. */
export function resolvePlayerCombatWeaponChannels(
  equipSlots: PlayerShip['equipSlots'] | undefined,
  runtimeFallback?: PlayerCombatWeaponRuntimeFallback | null,
): PlayerCombatWeaponChannels {
  return {
    laserWeaponId: resolvePlayerCombatWeaponChannelId(
      equipSlots?.WEAPON_1?.itemDefId,
      runtimeFallback?.laserWeaponId,
    ),
    missileWeaponId: resolvePlayerCombatWeaponChannelId(
      equipSlots?.WEAPON_2?.itemDefId,
      runtimeFallback?.missileWeaponId,
    ),
    closeRangeWeaponId: resolvePlayerCombatWeaponChannelId(
      equipSlots?.WEAPON_3?.itemDefId,
      runtimeFallback?.closeRangeWeaponId,
    ),
    auxWeaponId: resolvePlayerCombatWeaponChannelId(
      equipSlots?.WEAPON_4?.itemDefId,
      runtimeFallback?.auxWeaponId,
    ),
  };
}
