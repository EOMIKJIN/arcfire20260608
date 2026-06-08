/** 임시 클랜 색상(A/B/C) — 추후 엠블럼/커스텀 색으로 교체 예정 */
const TEMP_CLAN_COLORS = ['#4EA3FF', '#FF9D3A', '#4EDB8A'] as const;

function hashClanId(clanId: string): number {
  let h = 0;
  for (let i = 0; i < clanId.length; i += 1) {
    h = (h * 31 + clanId.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function resolveTempClanColor(clanId: string): string {
  // 현재 AI 3클랜은 id 접미로 고정 매핑(요청: A=Blue, B=Orange, C=Green)
  if (clanId.includes('_safe_')) return '#4EA3FF';
  if (clanId.includes('_neutral_')) return '#FF9D3A';
  if (clanId.includes('_pvp_')) return '#4EDB8A';
  const idx = hashClanId(clanId) % TEMP_CLAN_COLORS.length;
  return TEMP_CLAN_COLORS[idx] ?? TEMP_CLAN_COLORS[0];
}
