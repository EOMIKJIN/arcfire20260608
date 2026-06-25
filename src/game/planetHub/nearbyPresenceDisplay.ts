import { splitNearbyInfoLine } from './planetHubConstants';

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
