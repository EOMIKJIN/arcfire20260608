// ============================================================
// BM 더미 상점 — v2.0 이중통화
//   premium: IAP 보석팩·VIP·시즌패스·스타터팩
//   exchange: 보석 → 크레딧 단방향 교환
// ============================================================
import React, { memo, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ArcOverlayBmShopEntry } from '../arcOverlayStore';
import type { BmShopProduct, BmShopProductVisual } from '../../../bm/bmShopCatalog';
import {
  listBmShopProducts,
  resolveBmShopActionKey,
  resolveBmShopNoticeKey,
  resolveBmShopSubtitleKey,
  resolveBmShopTitleKey,
} from '../../../bm/bmShopCatalog';
import { formatGemBalance, resolvePlayerGemBalance } from '../../../bm/bmWalletDisplay';
import { useT } from '../../../i18n';
import { usePlayerStore } from '../../../store/playerStore';
import { formatCredits } from '../../../utils/formatCredits';
import { showArcAlert } from '../../../utils/showArcAlert';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { bmShopOverlayStyles as styles } from './bmShopOverlayStyles';

type Props = {
  entry: ArcOverlayBmShopEntry;
  onClose: () => void;
};

function visualIcon(visual: BmShopProductVisual): string {
  switch (visual) {
    case 'gems':
      return '◇';
    case 'seasonPass':
      return '▣';
    case 'vip':
      return '★';
    case 'starterPack':
      return '⬡';
    case 'exchange':
      return '⇄';
    default:
      return '◆';
  }
}

function ProductRow({
  product,
  actionLabel,
  onAction,
}: {
  product: BmShopProduct;
  actionLabel: string;
  onAction: (product: BmShopProduct) => void;
}) {
  const t = useT();
  return (
    <View style={styles.productCard}>
      <View style={[styles.artSlot, { backgroundColor: product.tint }]}>
        <Text style={styles.artIcon}>{visualIcon(product.visual)}</Text>
        <Text style={styles.artPlaceholderLabel}>{t('bmShop.artPlaceholder')}</Text>
      </View>
      <View style={styles.productBody}>
        {product.badgeKey ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t(product.badgeKey)}</Text>
          </View>
        ) : null}
        <Text style={styles.productTitle}>{t(product.titleKey)}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>
          {t(product.descKey)}
        </Text>
        <View style={styles.productFooter}>
          <Text
            style={[
              styles.priceText,
              product.priceKind === 'gems' && styles.priceTextGem,
            ]}
          >
            {t(product.priceKey)}
          </Text>
          <View style={styles.buyBtnWrap}>
            <ArcButton label={actionLabel} variant="cta" onPress={() => onAction(product)} />
          </View>
        </View>
      </View>
    </View>
  );
}

export const BmShopOverlayContent = memo(function BmShopOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const player = usePlayerStore((s) => s.player);
  const products = listBmShopProducts(entry.shopKind);
  const gemBalance = resolvePlayerGemBalance(player);
  const creditBalance = player?.credits ?? 0;
  const actionLabel = t(resolveBmShopActionKey(entry.shopKind));

  const handleAction = useCallback(
    (_product: BmShopProduct) => {
      showArcAlert(t('bmShop.comingSoonTitle'), t('bmShop.comingSoonBody'));
    },
    [t],
  );

  const panelPrefix = (
    <>
      <View style={styles.balanceRow}>
        <Text style={styles.balanceChipGem}>
          {t('bmShop.hud.gems', { amount: formatGemBalance(gemBalance) })}
        </Text>
        <Text style={styles.balanceChipCredits}>
          {t('bmShop.hud.credits', { amount: formatCredits(creditBalance, { suffix: false }) })}
        </Text>
      </View>
      <Text style={styles.notice}>{t(resolveBmShopNoticeKey(entry.shopKind))}</Text>
    </>
  );

  return (
    <ArcOverlayCard
      title={t(resolveBmShopTitleKey(entry.shopKind))}
      subtitle={t(resolveBmShopSubtitleKey(entry.shopKind))}
      layout="panel"
      panelPrefix={panelPrefix}
      footer={<ArcOverlayFooterActions onCancel={onClose} onConfirm={onClose} />}
      trailing={(
        <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      )}
    >
      {products.map((product) => (
        <ProductRow
          key={product.id}
          product={product}
          actionLabel={actionLabel}
          onAction={handleAction}
        />
      ))}
    </ArcOverlayCard>
  );
});
