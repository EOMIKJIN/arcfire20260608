import { splitNearbyInfoLine } from './planetHubConstants';
import {
  formatCapitalShipInfoPanelBadge,
  resolveCapitalShipClassification,
} from '../../arcCore/balance/capitalShipClassification';
import {
  NEARBY_PRESENCE_DISPLAY_SEP,
  PLAYER_BENCH_CAPTAIN_ID,
  PLAYER_FLAGSHIP_HUB_INFO_SLOT,
  formatPinnedInfoPrimaryLabel,
  stripHubOrbitClanBracketPrefix,
} from './nearbyPresenceContract';
import { getNpcCaptain, getNpcCaptainByAssignedShipId, getNpcCapitalShip } from '../../npc/npcFleetRegistry';
import type { AppLocale } from '../../i18n/types';
import { resolveNpcCaptainDisplayName } from '../../i18n/captainText';
import { resolveNpcCapitalShipDisplayName } from '../../i18n/shipText';

export { PLAYER_BENCH_CAPTAIN_ID, PLAYER_FLAGSHIP_HUB_INFO_SLOT } from './nearbyPresenceContract';

/** 행 끝 액션 — null · 대화 · 미션 · 기타(확장) */
export type NearbyPresenceRowActionKind = 'none' | 'dialog' | 'mission' | 'custom';

export type NearbyPresenceRowAction = {
  kind: NearbyPresenceRowActionKind;
  label?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export type NearbyInfoPinKind = 'governor' | 'quest';

export type NearbyInfoDetailRow = {
  keySlot: number;
  line: string;
  captainName: string;
  shipLabel: string;
  detailRight?: string;
  action: NearbyPresenceRowAction;
  /** 표시 시 한/영 재해석 — 스냅샷 문자열보다 우선 */
  captainId?: string;
  shipId?: string;
  isPlayerFlagship?: boolean;
  pinKind?: NearbyInfoPinKind;
  /** 퀘스트·총사령관 — 통신 판정 수락 강제 */
  commGuaranteed?: boolean;
  /** 메인/캠페인 퀘스트 연관 — INFO 육각 M */
  hasMainQuest?: boolean;
  /** 서브퀘스트(sandbox_*) 연관 — INFO 육각 S */
  hasSubQuest?: boolean;
  /** 퀘스트 NPC·할당됨 — 육각 레일 표시(비어 있어도) */
  showQuestMarks?: boolean;
};

export type NearbyInfoDetailRowIds = {
  captainId?: string;
  shipId?: string;
  isPlayerFlagship?: boolean;
  pinKind?: NearbyInfoPinKind;
  commGuaranteed?: boolean;
  hasMainQuest?: boolean;
  hasSubQuest?: boolean;
  showQuestMarks?: boolean;
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
      captainName: stripHubOrbitClanBracketPrefix(left.slice(0, dot)),
      shipLabel: left.slice(dot + 3).trim(),
      detailRight: right,
    };
  }
  return {
    captainName: stripHubOrbitClanBracketPrefix(left),
    shipLabel: '',
    detailRight: right,
  };
}

export const NEARBY_PRESENCE_ROW_ACTION_NONE: NearbyPresenceRowAction = { kind: 'none' };

/** 행별 액션 — 플레이어 기함만 없음. 통신 수락/거부는 onPress 시 NPC 레지스트리 판정. */
export function resolveNearbyPresenceRowAction(ids?: NearbyInfoDetailRowIds): NearbyPresenceRowAction {
  if (ids?.isPlayerFlagship) return NEARBY_PRESENCE_ROW_ACTION_NONE;
  return { kind: 'dialog' };
}

export function buildNearbyInfoDetailRow(
  keySlot: number,
  line: string,
  ids?: NearbyInfoDetailRowIds,
): NearbyInfoDetailRow {
  const parsed = parseNearbyPresenceDisplayLine(line);
  return {
    keySlot,
    line,
    ...parsed,
    action: resolveNearbyPresenceRowAction(ids),
    captainId: ids?.captainId,
    shipId: ids?.shipId,
    isPlayerFlagship: ids?.isPlayerFlagship,
    pinKind: ids?.pinKind,
    commGuaranteed: ids?.commGuaranteed === true,
    hasMainQuest: ids?.hasMainQuest === true,
    hasSubQuest: ids?.hasSubQuest === true,
    showQuestMarks: ids?.showQuestMarks === true,
  };
}

function composeNearbyInfoLine(
  captainName: string,
  shipLabel: string,
  detailRight?: string,
): string {
  const left = shipLabel ? `${captainName} · ${shipLabel}` : captainName;
  const right = (detailRight ?? '').trim();
  return right ? `${left}${NEARBY_PRESENCE_DISPLAY_SEP}${right}` : left;
}

/** INFO 패널·오버레이 — 현재 locale로 함장/함선/함급 배지를 다시 읽는다. */
export function localizeNearbyInfoDetailRow(
  row: NearbyInfoDetailRow,
  locale: AppLocale,
): NearbyInfoDetailRow {
  const isPlayer = row.isPlayerFlagship === true || row.keySlot === PLAYER_FLAGSHIP_HUB_INFO_SLOT;
  const shipId = (row.shipId ?? '').trim();
  const captainId = (row.captainId ?? '').trim();

  let captainName = row.captainName;
  if (!isPlayer) {
    const captain =
      (captainId ? getNpcCaptain(captainId) : undefined)
      ?? (shipId ? getNpcCaptainByAssignedShipId(shipId) : undefined);
    const resolved = resolveNpcCaptainDisplayName(captain, locale).trim();
    if (resolved) captainName = resolved;
  }

  let shipLabel = row.shipLabel;
  if (shipId) {
    const resolvedShip = resolveNpcCapitalShipDisplayName(shipId, row.shipLabel, locale).trim();
    if (resolvedShip) shipLabel = resolvedShip;
  }

  const classification = shipId ? resolveCapitalShipClassification(shipId) : null;
  const detailRight = classification
    ? formatCapitalShipInfoPanelBadge(classification, locale)
    : row.detailRight;

  const line = composeNearbyInfoLine(captainName, shipLabel, detailRight);
  return {
    ...row,
    captainName,
    shipLabel,
    detailRight,
    line,
    shipId: shipId || row.shipId,
    captainId: captainId || row.captainId,
    isPlayerFlagship: isPlayer || row.isPlayerFlagship,
    pinKind: row.pinKind,
    commGuaranteed: row.commGuaranteed === true,
    hasMainQuest: row.hasMainQuest === true,
    hasSubQuest: row.hasSubQuest === true,
    showQuestMarks: row.showQuestMarks === true,
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
  return buildNearbyInfoDetailRow(row.keySlot, row.line, {
    captainId: row.captainId,
    shipId: row.shipId,
    isPlayerFlagship: row.isPlayerFlagship,
    pinKind: row.pinKind,
    commGuaranteed: row.commGuaranteed,
    hasMainQuest: row.hasMainQuest,
    hasSubQuest: row.hasSubQuest,
    showQuestMarks: row.showQuestMarks,
  });
}

/** INFO 컴팩트 패널 — NPC·아크 함장명, 플레이어 기함만 계정 닉네임 */
export function resolveNearbyInfoPanelCaptainName(row: NearbyInfoDetailRow): string {
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

export function resolveNearbyInfoPanelPrimaryLabel(row: NearbyInfoDetailRow): string {
  return formatPinnedInfoPrimaryLabel(row.pinKind, resolveNearbyInfoPanelCaptainName(row));
}

export function buildPlayerFlagshipHubInfoDetailRow(
  shipName: string,
  nickname: string,
  playerNpcShipId: string,
  locale?: AppLocale,
): NearbyInfoDetailRow {
  const trimmedShip = shipName.trim() || '—';
  const trimmedNick = nickname.trim() || '—';
  const classification = resolveCapitalShipClassification(playerNpcShipId);
  const infoRight = classification
    ? formatCapitalShipInfoPanelBadge(classification, locale)
    : '';
  const sep = NEARBY_PRESENCE_DISPLAY_SEP;
  const line = infoRight
    ? `${trimmedNick} · ${trimmedShip}${sep}${infoRight}`
    : `${trimmedNick} · ${trimmedShip}`;
  return buildNearbyInfoDetailRow(PLAYER_FLAGSHIP_HUB_INFO_SLOT, line, {
    shipId: playerNpcShipId.trim() || undefined,
    isPlayerFlagship: true,
  });
}

/** INFO·팝업에서 내정보(기함) 행을 빼고, 벤치/동일 선체 중복만 제거한다. */
export function omitPlayerFlagshipHubInfoRows(
  rows: NearbyInfoDetailRow[],
  playerNpcShipId?: string,
): NearbyInfoDetailRow[] {
  const benchHullLabel = playerNpcShipId
    ? (getNpcCapitalShip(playerNpcShipId)?.name?.trim() ?? '')
    : '';
  return rows.filter((row) => {
    if (row.isPlayerFlagship || row.keySlot === PLAYER_FLAGSHIP_HUB_INFO_SLOT) return false;
    const captainLabel = row.captainName.trim();
    if (captainLabel === '플레이어 함선' || captainLabel === 'Player ship') return false;
    if (benchHullLabel && row.shipLabel.trim() === benchHullLabel) return false;
    return true;
  });
}

/** 벤치마크 `Player_pilot`·동일 CSV 기함 NPC 행 제거 후 플레이어 기함 행을 맨 앞에 삽입 */
export function mergePlayerFlagshipHubInfoRows(
  rows: NearbyInfoDetailRow[],
  input: { shipName: string; nickname: string; playerNpcShipId: string; locale?: AppLocale },
): NearbyInfoDetailRow[] {
  return [
    buildPlayerFlagshipHubInfoDetailRow(
      input.shipName,
      input.nickname,
      input.playerNpcShipId,
      input.locale,
    ),
    ...omitPlayerFlagshipHubInfoRows(rows, input.playerNpcShipId),
  ];
}
