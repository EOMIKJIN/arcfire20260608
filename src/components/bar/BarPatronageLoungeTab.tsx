// ============================================================
// 바 후원 라운지 — 종업원 리스트 (+ 초상 썸네일)
// ============================================================

import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../../ui/tactical/tacticalFacilityScreenTokens';
import { useT } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import {
  PlanetFacilityCardTitleBlock,
  PlanetFacilitySectionHeader,
  planetFacilityScreenStyles as fs,
} from '../../ui/planetFacility/PlanetFacilityTitleHeader';
import type { BarAttendantCsvRow } from '../../data/generated/csvBarPatronage';
import { useBarPatronageStore } from '../../store/barPatronageStore';
import { formatCredits } from '../../utils/formatCredits';
import {
  getDefaultBarDrink,
  resolveBarDrinkUnitPrice,
} from '../../game/bar/patronage/barPatronageTables';
import { resolveBarAttendantPortraitSource } from '../../game/bar/patronage/barPatronagePortrait';

type Props = {
  roster: readonly BarAttendantCsvRow[];
  onPatronize: (attendantId: string) => void;
  onPressHostCard: () => void;
  hostPortrait?: ImageSourcePropType;
  hostName: string;
  planetId: string;
};

const THUMB = 72;

export function BarPatronageLoungeTab({
  roster,
  onPatronize,
  onPressHostCard,
  hostPortrait,
  hostName,
  planetId,
}: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const popularity = useBarPatronageStore((s) => s.popularityByAttendantId);
  const session = useBarPatronageStore((s) => s.activeSession);
  const drink = useMemo(() => getDefaultBarDrink(), []);
  const unitPrice = useMemo(
    () => resolveBarDrinkUnitPrice(planetId, drink.drinkId),
    [planetId, drink.drinkId],
  );

  return (
    <>
      <Pressable
        style={fs.stackCard}
        onPress={onPressHostCard}
        accessibilityRole="button"
        accessibilityLabel={hostName}
      >
        <View style={styles.row}>
          <View style={styles.thumbWrap}>
            {hostPortrait ? (
              <Image
                source={hostPortrait}
                style={styles.thumb}
                resizeMode="cover"
                resizeMethod="resize"
                accessibilityLabel={hostName}
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
          </View>
          <View style={styles.metaCol}>
            <PlanetFacilitySectionHeader inCard first title={t('bar.patronage.loungeTitle')} />
            <Text style={styles.hint}>
              {t('bar.patronage.loungeHint', {
                price: formatCredits(unitPrice, { suffix: true }),
                minutes: Math.round(drink.durationSec / 60),
              })}
            </Text>
          </View>
        </View>
        {session && session.phase !== 'ended' ? (
          <Text style={styles.sessionMeta}>
            {t('bar.patronage.activeSession', {
              drinks: session.drinksPurchased,
              attendant: session.attendantId,
            })}
          </Text>
        ) : null}
      </Pressable>

      {roster.map((row, idx) => {
        const name = locale === 'en' ? row.displayNameEn : row.displayNameKo;
        const tag = locale === 'en' ? row.taglineEn : row.taglineKo;
        const pop = popularity[row.attendantId] ?? 0;
        const portrait = resolveBarAttendantPortraitSource(row.portraitImageAssetKey);
        return (
          <View key={row.attendantId} style={[fs.stackCard, idx > 0 ? styles.cardGap : null]}>
            <View style={styles.row}>
              <View style={styles.thumbWrap}>
                {portrait ? (
                  <Image
                    source={portrait}
                    style={styles.thumb}
                    resizeMode="cover"
                    resizeMethod="resize"
                    accessibilityLabel={name}
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]} />
                )}
              </View>
              <View style={styles.metaCol}>
                <View style={fs.cardTopRow}>
                  <Text style={fs.cardBadge}>
                    {t('bar.patronage.popularity', {
                      n: formatCredits(pop, { suffix: true }),
                    })}
                  </Text>
                </View>
                <PlanetFacilityCardTitleBlock title={name} description={tag} descriptionLines={2} />
              </View>
            </View>
            <Pressable
              style={styles.cta}
              onPress={() => onPatronize(row.attendantId)}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>{t('bar.patronage.cta')}</Text>
            </Pressable>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    textAlign: 'left',
    marginTop: 0,
    paddingHorizontal: 0,
  },
  sessionMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.titleInk,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  cardGap: {
    marginTop: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TF.cardBorder,
    overflow: 'hidden',
    backgroundColor: TF.insetBg,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
  },
  thumbPlaceholder: {
    backgroundColor: TF.insetBg,
  },
  metaCol: {
    flex: 1,
    minWidth: 0,
  },
  cta: {
    marginTop: SPACING.sm,
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TF.titleInk,
  },
  ctaText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.titleInk,
  },
});
