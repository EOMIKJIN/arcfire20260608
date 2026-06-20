import { StyleSheet } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';

/** 상품 배너 — 추후 화려한 IAP 아트로 교체할 여유 영역 */
export const BM_SHOP_ART_HEIGHT = 132;

export const bmShopOverlayStyles = StyleSheet.create({
  notice: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(255, 200, 120, 0.85)',
    textAlign: 'center',
  },
  closeBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
  },
  closeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  productCard: {
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(8, 14, 22, 0.55)',
    marginBottom: SPACING.md,
  },
  artSlot: {
    width: '100%',
    height: BM_SHOP_ART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 212, 255, 0.22)',
  },
  artPlaceholderLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1,
  },
  artIcon: {
    fontSize: 36,
    marginBottom: SPACING.xs,
  },
  productBody: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 196, 90, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 196, 90, 0.45)',
  },
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: '#FFD98A',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  productDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(107, 212, 255, 0.72)',
    lineHeight: 17,
    minHeight: 34,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  priceText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: '#FFE08A',
    flex: 1,
  },
  priceTextGem: {
    color: '#9CD4FF',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  balanceChipGem: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: '#9CD4FF',
  },
  balanceChipCredits: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: '#FFE08A',
  },
  buyBtnWrap: {
    minWidth: 96,
  },
});
