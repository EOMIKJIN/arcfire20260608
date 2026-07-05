import { splitNearbyInfoLine } from './planetHubConstants';
import {
  formatCapitalShipInfoPanelBadge,
  resolveCapitalShipClassification,
} from '../../arcCore/balance/capitalShipClassification';
import {
  NEARBY_PRESENCE_DISPLAY_SEP,
  PLAYER_BENCH_CAPTAIN_ID,
  PLAYER_FLAGSHIP_HUB_INFO_SLOT,
} from './nearbyPresenceContract';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';

export { PLAYER_BENCH_CAPTAIN_ID, PLAYER_FLAGSHIP_HUB_INFO_SLOT } from './nearbyPresenceContract';

/** 행 끝 액션 — null · 대화 · 미션 · 기타(확장) */
export type NearbyPresenceRowActionKind = 'none' | 'dialog' | 'mission' | 'custom';

export type NearbyPresenceRowAction = {
  kind: NearbyPresenceRowActionKind;
  label?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export type NearbyInfoDetailRow = {
  keySlot: number;
  line: string;
  captainName: string;
  shipLabel: string;
  detailRight?: string;
  action: NearbyPresenceRowAction;
};

export function parseNearbyPresenceDisplayLine(line: string): {
  captainName: string;
  shipLabel: string;
  detailRight?: string;
} {
  const { left, right } = splitNearbyInfoLine(line);
  const dot = left.indexOf(' · ');
  if (dot >= 0) {
    return {
      captainName: left.slice(0, dot).trim(),
      shipLabel: left.slice(dot + 3).trim(),
      detailRight: right,
    };
  }
  return {
    captainName: left.trim(),
    shipLabel: '',
    detailRight: right,
  };
}

/** 행별 액션 — 구현 TBD (구조만 확보) */
export function resolveNearbyPresenceRowAction(_line: string): NearbyPresenceRowAction {
  return { kind: 'none' };
}

export const NEARBY_PRESENCE_ROW_ACTION_NONE: NearbyPresenceRowAction = { kind: 'none' };

export function buildNearbyInfoDetailRow(keySlot: number, line: string): NearbyInfoDetailRow {
  const parsed = parseNearbyPresenceDisplayLine(line);
  return {
    keySlot,
    line,
    ...parsed,
    action: resolveNearbyPresenceRowAction(line),
  };
}

/** 구형 `{ keySlot, line }` 행·Hot reload 잔존 데이터 방어 */
export function normalizeNearbyInfoDetailRow(
  row: Partial<NearbyInfoDetailRow> & Pick<NearbyInfoDetailRow, 'keySlot' | 'line'>,
): NearbyInfoDetailRow {
  if (
    typeof row.captainName === 'string'
    && row.action
    && typeof row.action.kind === 'string'
  ) {
    return row as NearbyInfoDetailRow;
  }
  return buildNearbyInfoDetailRow(row.keySlot, row.line);
}

/** INFO 컴팩트 패널 — NPC·아크 함장명, 플레이어 기함만 계정 닉네임 */
export function resolveNearbyInfoPanelPrimaryLabel(row: NearbyInfoDetailRow): string {
  if (row.keySlot === PLAYER_FLAGSHIP_HUB_INFO_SLOT) {
    const nick = row.captainName.trim();
    if (nick) return nick;
  }
  const captain = row.captainName.trim();
  if (captain) return captain;
  const ship = row.shipLabel.trim();
  if (ship) return ship;
  return row.line;
}

export function buildPlayerFlagshipHubInfoDetailRow(
  shipName: string,
  nickname: string,
  playerNpcShipId: string,
): NearbyInfoDetailRow {
  const trimmedShip = shipName.trim() || '—';
  const trimmedNick = nickname.trim() || '—';
  const classification = resolveCapitalShipClassification(playerNpcShipId);
  const infoRight = classification ? formatCapitalShipInfoPanelBadge(classification) : '';
  const sep = NEARBY_PRESENCE_DISPLAY_SEP;
  const line = infoRight
    ? `${trimmedNick} · ${trimmedShip}${sep}${infoRight}`
    : `${trimmedNick} · ${trimmedShip}`;
  return buildNearbyInfoDetailRow(PLAYER_FLAGSHIP_HUB_INFO_SLOT, line);
}

/** 벤치마크 `Player_pilot`·동일 CSV 기함 NPC 행 제거 후 플레이어 기함 행을 맨 앞에 삽입 */
export function mergePlayerFlagshipHubInfoRows(
  rows: NearbyInfoDetailRow[],
  input: { shipName: string; nickname: string; playerNpcShipId: string },
): NearbyInfoDetailRow[] {
  const benchHullLabel = getNpcCapitalShip(input.playerNpcShipId)?.name?.trim() ?? '';
  const filtered = rows.filter((row) => {
    if (row.captainName.trim() === '플레이어 함선') return false;
    if (benchHullLabel && row.shipLabel.trim() === benchHullLabel) return false;
    return true;
  });
  const playerRow = buildPlayerFlagshipHubInfoDetailRow(
    input.shipName,
    input.nickname,
    input.playerNpcShipId,
  );
  return [playerRow, ...filtered];
}
