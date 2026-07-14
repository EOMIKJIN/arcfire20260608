// ============================================================
// 아크코어 본진 보스 = 복제된 짝 유저 전함 (핵심 실제 플레이)
//
// eternal_throne(endgame_boss) 레드 리드 슬롯(0번)에 캐시된 짝 유저의
// 기함 스냅샷 스펙을 주입한다. 스냅샷 미보유(미페어·오프라인)면 null →
// 기존 CSV 보스 폴백. 조회는 zustand 동기 read만 — 전투 경로 네트워크 없음.
//
// 배정규칙: 현재 1:1 페어 고정 — 추후 토너먼트 규칙(유저 전함이 아크코어
// 보스 자리를 차지하는 랭킹 배정)으로 업그레이드 예정. §16-A 참조.
// ============================================================

import type { NpcCapitalCombatStats } from '../../types';
import { useArcCoreShadowIdentityStore } from '../../store/arcCoreShadowIdentityStore';
import { t } from '../../i18n';
import { ARC_CORE_SHADOW_HOME_BASE_PLANET_ID } from './arcCoreShadowReveal';
import { shadowSnapshotToCombatStats } from './arcCoreShadowShipSnapshot';

export type ArcCoreShadowBossOverride = {
  combatStats: NpcCapitalCombatStats;
  /** runtime config 부분 오버라이드 — 무기 4슬롯 + 기동 (정의된 값만 병합) */
  runtimeOverride: Record<string, string | number>;
  equipmentAgentKnobs: {
    acBonus: number;
    incomingDamageMul: number;
    hullRegenPerTick: number;
    missileMissChance: number;
  };
  /** 함선 표시명 — 짝 유저 기함 이름 */
  shipDisplayName: string;
  /** 네임플레이트 — 공개 전 위장명 · 공개 후 짝 유저 닉네임 */
  nameplateLabel: string;
};

/**
 * 본진 보스 슬롯 오버라이드 — 본진 외 행성·리드 외 슬롯·스냅샷 미보유 시 null.
 * initAgents 스폰 1회 경로에서만 호출된다 (틱 아님).
 */
export function resolveArcCoreShadowBossOverride(
  combatPlanetId: string,
  redSlotIndex: number,
): ArcCoreShadowBossOverride | null {
  if (combatPlanetId !== ARC_CORE_SHADOW_HOME_BASE_PLANET_ID) return null;
  if (redSlotIndex !== 0) return null;

  const s = useArcCoreShadowIdentityStore.getState();
  const snap = s.shadowShipSnapshot;
  if (!snap || snap.combat.maxHp <= 0) return null;

  const runtimeOverride: Record<string, string | number> = {};
  if (snap.runtime.laserWeaponId) runtimeOverride.laserWeaponId = snap.runtime.laserWeaponId;
  if (snap.runtime.missileWeaponId) runtimeOverride.missileWeaponId = snap.runtime.missileWeaponId;
  if (snap.runtime.closeRangeWeaponId) {
    runtimeOverride.closeRangeWeaponId = snap.runtime.closeRangeWeaponId;
  }
  if (snap.runtime.auxWeaponId) runtimeOverride.auxWeaponId = snap.runtime.auxWeaponId;
  if (snap.runtime.maxMoveSpeedPxPerMs != null) {
    runtimeOverride.maxMoveSpeedPxPerMs = snap.runtime.maxMoveSpeedPxPerMs;
  }
  if (snap.runtime.accelPxPerMs2 != null) runtimeOverride.accelPxPerMs2 = snap.runtime.accelPxPerMs2;
  if (snap.runtime.maxTurnRateRadPerMs != null) {
    runtimeOverride.maxTurnRateRadPerMs = snap.runtime.maxTurnRateRadPerMs;
  }
  if (snap.runtime.turnAccelRadPerMs2 != null) {
    runtimeOverride.turnAccelRadPerMs2 = snap.runtime.turnAccelRadPerMs2;
  }
  if (snap.runtime.detectRangeScale != null) {
    runtimeOverride.detectRangeScale = snap.runtime.detectRangeScale;
  }

  const revealed = s.revealedAtMs != null && !!s.shadowNickname;
  return {
    combatStats: shadowSnapshotToCombatStats(snap),
    runtimeOverride,
    equipmentAgentKnobs: { ...snap.equipment },
    shipDisplayName: snap.shipDisplayName,
    nameplateLabel: revealed
      ? (s.shadowNickname as string)
      : t('arcCoreShadow.boss.concealedName'),
  };
}
