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
  /** 방위위성 인스턴스별 레벨 override */
  defenseLevel?: number;
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
  /** i18n 키(예: `hubBg.wreck`) — 로케일 전환 시 렌더 시점에 `t(title, ...)`로 해석한다. 원문 문자열 직접 저장 금지. */
  title: string;
  /** title이 번호 포함 키(`{n}` 플레이스홀더)일 때 채워질 인스턴스 순번(1부터). */
  titleOrdinal?: number;
  description?: string;
  transform: WorldObjectTransform;
  interactions: WorldObjectInteractionSpec[];
  state: WorldObjectRuntimeState;
  tags?: string[];
}

