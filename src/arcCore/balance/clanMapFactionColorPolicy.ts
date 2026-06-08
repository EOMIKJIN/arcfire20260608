// ============================================================
// 은하 지도·행성 점유색 — clan_map_faction_color_policy.csv (아크코어 정본)
// ============================================================

import { ClanMapFactionColorPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';

type PolicyRow = (typeof ClanMapFactionColorPolicy_FROM_BALANCE_CSV)[number];

const SORTED_ROWS = [...ClanMapFactionColorPolicy_FROM_BALANCE_CSV].sort(
  (a, b) => parseNum(b.priority, 0) - parseNum(a.priority, 0),
);

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function rowMatches(clanId: string, megaFactionId: string | null, row: PolicyRow): boolean {
  const type = String(row.matchType ?? '').trim();
  const value = String(row.matchValue ?? '').trim();
  if (type === 'default') return value === '*' || value === '';
  if (type === 'clan_id') return clanId === value;
  if (type === 'clan_prefix') return clanId.startsWith(value);
  if (type === 'clan_substr') return clanId.includes(value);
  if (type === 'mega_faction') return megaFactionId === value;
  return false;
}

function resolveMegaFactionForClan(clanId: string): string | null {
  if (!clanId || clanId === 'neutral') return null;
  const clan = useClanWarFoundationStore.getState().clans[clanId];
  return clan?.megaFactionId?.trim() || null;
}

/** 행성·성계 점유 표시색 — 블루팀 파랑 / 레드팀 빨강 */
export function resolveClanMapDisplayColor(clanId: string): string {
  if (!clanId || clanId === 'neutral') {
    const neutral = SORTED_ROWS.find(
      (r) => r.matchType === 'default' && String(r.matchValue).trim() === '*',
    );
    return String(neutral?.displayColorHex ?? '#9AA8C4').trim();
  }

  const megaFactionId = resolveMegaFactionForClan(clanId);
  for (const row of SORTED_ROWS) {
    if (rowMatches(clanId, megaFactionId, row)) {
      return String(row.displayColorHex).trim();
    }
  }
  return '#9AA8C4';
}
