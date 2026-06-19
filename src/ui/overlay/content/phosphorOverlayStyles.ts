// ============================================================
// 범용 오버레이 카드 — Phosphor(시안) 단일 스타일 정본.
// 알림(AlertOverlayContent)과 동일 값 → 결과/보상/레벨업 등 모든 카드가 통일된다.
// 신규 결과/보상류 오버레이는 이 스타일을 재사용해 통일성을 유지할 것.
// ============================================================
import { StyleSheet } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';

/** 카드 본문 텍스트 글로우(시안) */
export const PHOSPHOR_TEXT_GLOW = {
  textShadowColor: 'rgba(107, 212, 255, 0.45)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 8,
} as const;

/** 보조 라벨용 옅은 시안 */
export const PHOSPHOR_MUTED = 'rgba(107, 212, 255, 0.62)';

export const phosphorOverlay = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    padding: SPACING.xl,
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textAlign: 'center',
    color: OVERLAY_TOKENS.phosphorAccent,
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: PHOSPHOR_MUTED,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: OVERLAY_TOKENS.phosphorBorder,
    marginVertical: SPACING.md,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: PHOSPHOR_MUTED,
    marginBottom: SPACING.sm,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    width: '100%',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  },
  rowIcon: { fontSize: 16, marginRight: SPACING.sm },
  rowText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  rowMuted: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: PHOSPHOR_MUTED,
    fontStyle: 'italic',
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: PHOSPHOR_MUTED,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  closeBtn: {
    marginTop: SPACING.lg,
    alignSelf: 'flex-end',
  },
  /** [확인] 단일 버튼(알림·닫기) — 카드 우측 정렬 */
  btnRowAckOnly: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  /** [취소][확인] — 우측 정렬(취소 왼쪽 · 확인 오른쪽) */
  btnRowCancelConfirm: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
});
