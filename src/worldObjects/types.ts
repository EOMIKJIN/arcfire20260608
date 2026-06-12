export type WorldObjectKind = 'asteroid' | 'wreck' | 'station' | 'anomaly' | 'defense_satellite';

export type WorldObjectInteractionKind =
  | 'mining'
  | 'salvage'
  | 'dock'
  | 'trade'
  | 'scan'
  | 'none';

export interface WorldObjectTransform {
  orbitSlotIndex: number;
  radiusScale: number;
  phaseBias: number;
}

export interface WorldObjectInteractionSpec {
  kind: WorldObjectInteractionKind;
  enabled: boolean;
  reasonIfDisabled?: string;
}

export interface WorldObjectRuntimeState {
  depleted?: boolean;
  hp?: number;
  ownerFactionId?: string | null;
  cooldownUntilMs?: number | null;
}

export interface WorldObject {
  id: string;
  kind: WorldObjectKind;
  planetId: string;
  systemId: string;
  /** 광물 테이블/아크코어 분배 기반 소행성 배정 광물 id(아이템 id와 동일 스키마). */
  mineralItemId?: string;
  /** 방위위성 등 방어 시설 기본 탑재 무기 id (`weapon_list.csv`). */
  defenseWeaponId?: string;
  /** 방위위성 등급(플레이어 업그레이드·시험운용). */
  defenseLevel?: number;
  title: string;
  description?: string;
  transform: WorldObjectTransform;
  interactions: WorldObjectInteractionSpec[];
  state: WorldObjectRuntimeState;
  tags?: string[];
}

