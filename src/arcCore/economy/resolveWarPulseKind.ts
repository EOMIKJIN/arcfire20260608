// ============================================================
// 전쟁 경제 뉴스 1줄 — 숫자/전 행성 루프 없음.
// 선단 끊김은 전날 운항 >0 이고 오늘 0일 때만 (매일 0 스팸 금지).
// 금고 편입은 그날 stellium_annex 지출이 있을 때만 (잔액 유지 매일 공지 금지).
// ============================================================

export type WarPulseKind = 'convoyCut' | 'vaultAnnex';

export function resolveWarPulseKind(input: {
  windowConvoyTrips?: number;
  prevWindowConvoyTrips?: number;
  blueAnnexDelta?: number;
}): WarPulseKind | null {
  const trips = input.windowConvoyTrips;
  const prev = input.prevWindowConvoyTrips;
  if (typeof trips === 'number' && trips === 0 && typeof prev === 'number' && prev > 0) {
    return 'convoyCut';
  }
  if (typeof input.blueAnnexDelta === 'number' && input.blueAnnexDelta < 0) {
    return 'vaultAnnex';
  }
  return null;
}
