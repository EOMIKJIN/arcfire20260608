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
  /** 카드 외곽 — header + body 조립 · centerWrap 안에서 가로 전폭 */
  cardShell: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'stretch',
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    alignSelf: 'center',
    flexDirection: 'column',
    alignItems: 'stretch',
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  /** @deprecated ArcOverlayCard compact body */
  cardBody: {
    alignSelf: 'stretch',
    width: '100%',
    padding: SPACING.xl,
    alignItems: 'center',
  },
  /** @deprecated ArcOverlayCard panel body — flex:1 사용 금지(RN 높이 0 붕괴) */
  cardBodyFill: {
    alignSelf: 'stretch',
    width: '100%',
    padding: SPACING.lg,
  },
  cardBodyLg: {
    alignSelf: 'stretch',
    width: '100%',
    padding: SPACING.lg,
  },
  /** @deprecated ArcOverlayTitleHeader 사용 — 레거시 호환 */
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textAlign: 'center',
    color: OVERLAY_TOKENS.titleHeaderTitleColor,
  },
  /** @deprecated ArcOverlayTitleHeader subtitle 사용 */
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: OVERLAY_TOKENS.titleHeaderSubtitleColor,
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
    alignSelf: 'stretch',
    textAlign: 'center',
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
  /** [확인] 단일 버튼(알림·닫기) — 카드 가운데 정렬 */
  btnRowAckOnly: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  /** [취소][확인] — 카드 가운데 정렬 */
  btnRowCancelConfirm: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    flexShrink: 0,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    flexShrink: 0,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});
