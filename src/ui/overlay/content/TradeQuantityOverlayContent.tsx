import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ArcOverlayTradeQuantityEntry } from '../arcOverlayStore';
import { formatCredits } from '../../../utils/formatCredits';
import { useT } from '../../../i18n';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';

type Props = {
  entry: ArcOverlayTradeQuantityEntry;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export const TradeQuantityOverlayContent = memo(function TradeQuantityOverlayContent({
  entry,
  onConfirm,
  onCancel,
}: Props) {
  const t = useT();
  const minQty = entry.minQty ?? 1;
  const [qty, setQty] = useState(() => Math.min(entry.maxQty, Math.max(minQty, entry.initialQty ?? 1)));

  const totalPrice = entry.unitPrice * qty;
  const playerCredits = entry.playerCredits;
  const remainingCredits =
    entry.mode === 'buy' && playerCredits != null ? playerCredits - totalPrice : null;
  const canDec = qty > minQty;
  const canInc = qty < entry.maxQty;
  const canMax = qty < entry.maxQty;

  const setMaxQty = () => {
    if (entry.maxQty >= minQty) setQty(entry.maxQty);
  };

  const topTip = useMemo(() => {
    const tips = entry.tips ?? [];
    return tips.length > 0 ? tips[0]! : null;
  }, [entry.tips]);

  const headerSubtitle = entry.mode === 'buy' ? t('tradeQty.headerBuy') : t('tradeQty.headerSell');

  const metaPrefix = (
    <View style={styles.metaBlock}>
      <MetaRow label={t('tradeQty.unitLabel')} value={formatCredits(entry.unitPrice, { suffix: true })} />
      {entry.stock != null ? (
        <MetaRow label={t('tradeQty.stockLabel')} value={t('tradeQty.stockValue', { n: entry.stock })} />
      ) : null}
      {entry.demandLabel ? (
        <MetaRow label={t('tradeQty.demandLabelShort')} value={entry.demandLabel} />
      ) : null}
      {entry.ownedQty != null ? (
        <MetaRow label={t('tradeQty.ownedLabel')} value={t('tradeQty.ownedValue', { n: entry.ownedQty })} />
      ) : null}
    </View>
  );

  return (
    <ArcOverlayCard
      title={entry.title}
      subtitle={headerSubtitle}
      layout="panel"
      panelPrefix={metaPrefix}
      footer={(
        <ArcOverlayFooterActions
          onCancel={onCancel}
          onConfirm={() => onConfirm(qty)}
          confirmLabel={entry.mode === 'buy' ? t('tradeQty.buy', { qty }) : t('tradeQty.sell', { qty })}
        />
      )}
    >
      {entry.mode === 'buy' && entry.itemDescription ? (
        <View style={styles.descBox}>
          <Text style={styles.descText} numberOfLines={3} ellipsizeMode="tail">
            {entry.itemDescription}
          </Text>
        </View>
      ) : null}

      {entry.mode === 'buy' ? (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>{t('tradeQty.tipsTitle')}</Text>
          {topTip ? (
            <Text style={styles.tipLine}>
              {t('tradeQty.tipLine', { planet: topTip.planetName, profit: formatCredits(topTip.profitPerUnit) })}
            </Text>
          ) : (
            <Text style={styles.tipEmpty}>{t('tradeQty.tipEmpty')}</Text>
          )}
        </View>
      ) : null}

      <View style={styles.qtySection}>
        <Text style={styles.qtySectionLabel}>{t('tradeQty.qtyLabel')}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            style={[styles.qtyBtn, !canDec && styles.qtyBtnDisabled]}
            onPress={() => canDec && setQty((q) => Math.max(minQty, q - 1))}
            disabled={!canDec}
            accessibilityLabel={t('tradeQty.a11yDec')}
          >
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{qty}</Text>
          <TouchableOpacity
            style={[styles.qtyBtn, !canInc && styles.qtyBtnDisabled]}
            onPress={() => canInc && setQty((q) => Math.min(entry.maxQty, q + 1))}
            disabled={!canInc}
            accessibilityLabel={t('tradeQty.a11yInc')}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.maxBtn, !canMax && styles.qtyBtnDisabled]}
            onPress={() => canMax && setMaxQty()}
            disabled={!canMax}
            accessibilityLabel={t('tradeQty.a11yMax')}
          >
            <Text style={styles.maxBtnText}>MAX</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.totalLine}>
          {t('tradeQty.total', { price: formatCredits(totalPrice) })}
          {remainingCredits != null ? (
            <Text
              style={[
                styles.totalCreditsSuffix,
                remainingCredits < 0 ? styles.totalCreditsOver : styles.totalCreditsOk,
              ]}
            >
              {t('tradeQty.remaining', { credits: formatCredits(remainingCredits, { suffix: false }) })}
            </Text>
          ) : null}
        </Text>
        <Text style={styles.maxHint}>{t('tradeQty.maxHint', { n: entry.maxQty })}</Text>
      </View>
    </ArcOverlayCard>
  );
});

const PH = OVERLAY_TOKENS.phosphorAccent;

const styles = StyleSheet.create({
  metaBlock: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
    gap: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  metaLabel: {
    flexShrink: 0,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(107, 212, 255, 0.62)',
  },
  metaValue: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.valueContentColor,
    textAlign: 'right',
  },
  descBox: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(107, 212, 255, 0.2)',
    borderRadius: 4,
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
  },
  descText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PH,
    lineHeight: 18,
    textAlign: 'center',
  },
  qtySection: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: OVERLAY_TOKENS.phosphorBorder,
  },
  qtySectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: 'rgba(107, 212, 255, 0.62)',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_TOKENS.phosphorBtnBg,
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    fontWeight: FONTS.weight.bold,
    color: PH,
    lineHeight: 28,
  },
  maxBtn: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_TOKENS.phosphorBtnBgEmphasis,
  },
  maxBtnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    color: PH,
    letterSpacing: 0.5,
  },
  qtyValue: {
    minWidth: 48,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.valueContentColor,
    textAlign: 'center',
  },
  totalLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.exp,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  totalCreditsSuffix: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  totalCreditsOk: {
    color: OVERLAY_TOKENS.valueContentColor,
  },
  totalCreditsOver: {
    color: COLORS.danger,
  },
  maxHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  tipsBox: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(107, 212, 255, 0.25)',
    borderRadius: 4,
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
  },
  tipsTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.exp,
    marginBottom: SPACING.sm,
  },
  tipLine: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PH,
    lineHeight: 18,
  },
  tipEmpty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    lineHeight: 18,
  },
});
