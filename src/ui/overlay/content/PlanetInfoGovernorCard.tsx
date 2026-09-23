import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getPlanetGovernorCommander } from '../../../game/planetGovernor/planetGovernorRegistry';
import { resolveNpcCaptainPortraitSource } from '../../../game/npcCaptainPortraitAssets';
import { getNpcCaptain } from '../../../npc/npcFleetRegistry';
import { useNpcCaptainProgressStore } from '../../../store/npcCaptainProgressStore';
import { useT } from '../../../i18n';
import { resolveNpcCaptainDisplayName, resolveNpcCaptainRank } from '../../../i18n/captainText';
import { resolveGovernorTitle } from '../../../i18n/governorText';
import { resolveNpcCapitalShipDisplayName } from '../../../i18n/shipText';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayPreview';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';
import { PHOSPHOR_MUTED } from './phosphorOverlayStyles';
import {
  PASSPORT_IDENTITY_BODY_HEIGHT_PX,
  PASSPORT_IDENTITY_CARD_HEIGHT_PX,
  PASSPORT_IDENTITY_DOC_HEADER_PX,
  resolvePassportIdentityPhotoWidthPx,
} from '../../passportIdentityPhotoLayout';

type ThemedStyles = {
  card: object;
  docHeader: object;
  docTitle: object;
  photoBg: object;
  divider: object;
  fieldLabel: object;
  fieldValue: object;
  fieldLine: object;
};

type FieldProps = {
  label: string;
  value: string;
  themed: ThemedStyles;
};

function GovernorField({ label, value, themed }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, themed.fieldLabel]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.fieldValue, themed.fieldValue]} numberOfLines={1}>
        {value}
      </Text>
      <View style={[styles.fieldLine, themed.fieldLine]} />
    </View>
  );
}

type Props = {
  planetId: string;
  visualTheme?: ArcOverlayVisualTheme;
};

/**
 * 행성 정보창 — 총사령관 신분증 카드.
 * 레이아웃 정본: 허브 파일럿 여권(헤더 + 좌 초상 열 + 우 2열×3행).
 */
export const PlanetInfoGovernorCard = memo(function PlanetInfoGovernorCard({
  planetId,
  visualTheme = 'phosphor',
}: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const themed = visualTheme === 'tactical' ? tacticalThemed : phosphorThemed;

  const governor = useMemo(() => getPlanetGovernorCommander(planetId), [planetId]);
  const captainId = governor?.governorCaptainId ?? null;
  const captain = useMemo(() => (captainId ? getNpcCaptain(captainId) : null), [captainId]);

  const runtimeLevel = useNpcCaptainProgressStore((s) =>
    captainId ? s.records[captainId]?.level : undefined,
  );

  const portraitSource = useMemo(
    () => resolveNpcCaptainPortraitSource(captain?.portraitImageAssetKey ?? null),
    [captain?.portraitImageAssetKey],
  );
  const photoColumnWidthPx = resolvePassportIdentityPhotoWidthPx();

  const shipName = useMemo(() => {
    const shipId = String(captain?.assignedShipId ?? '').trim();
    if (!shipId) return '—';
    const name = resolveNpcCapitalShipDisplayName(shipId, shipId, locale).trim();
    return name || '—';
  }, [captain?.assignedShipId, locale]);

  if (!governor || !captain) return null;

  const name = resolveNpcCaptainDisplayName(captain, locale);
  if (!name) return null;

  const level = Math.max(1, runtimeLevel ?? captain.progression.initialLevel ?? 1);
  const rank = resolveNpcCaptainRank(captain, locale) || '—';
  const governorTitle = resolveGovernorTitle(governor, locale) || '—';
  const clanName = captain.aiClanName?.trim() || '—';

  return (
    <View style={[styles.card, themed.card]} accessibilityLabel={t('econInfo.governorCardA11y')}>
      <View style={[styles.docHeader, themed.docHeader]}>
        <Text style={[styles.docTitle, themed.docTitle]}>{t('econInfo.governorCardHeader')}</Text>
      </View>
      <View style={styles.passportBody}>
        <View
          style={[styles.photoColumn, themed.photoBg, { width: photoColumnWidthPx }]}
          accessibilityRole="image"
          accessibilityLabel={t('econInfo.governorPortraitA11y')}
        >
          {portraitSource ? (
            <Image
              source={portraitSource}
              style={styles.photoImage}
              resizeMode="cover"
              resizeMethod="resize"
            />
          ) : (
            <View style={[styles.photoPlaceholder, themed.photoBg]} />
          )}
        </View>
        <View style={[styles.photoDivider, themed.divider]} />
        <View style={styles.infoColumn}>
          <View style={styles.infoRow}>
            <GovernorField label={t('econInfo.governorField.name')} value={name} themed={themed} />
            <GovernorField
              label={t('econInfo.governorField.level')}
              value={`Lv.${level}`}
              themed={themed}
            />
          </View>
          <View style={styles.infoRow}>
            <GovernorField label={t('econInfo.governorField.rank')} value={rank} themed={themed} />
            <GovernorField
              label={t('econInfo.governorField.title')}
              value={governorTitle}
              themed={themed}
            />
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <GovernorField
              label={t('econInfo.governorField.ship')}
              value={shipName}
              themed={themed}
            />
            <GovernorField
              label={t('econInfo.governorField.clan')}
              value={clanName}
              themed={themed}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const phosphorThemed: ThemedStyles = StyleSheet.create({
  card: {
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
  },
  docHeader: {
    backgroundColor: 'rgba(107, 212, 255, 0.08)',
    borderBottomColor: OVERLAY_TOKENS.phosphorBorder,
  },
  docTitle: {
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  photoBg: {
    backgroundColor: 'rgba(8, 18, 28, 0.55)',
  },
  divider: {
    backgroundColor: OVERLAY_TOKENS.phosphorBorder,
  },
  fieldLabel: {
    color: PHOSPHOR_MUTED,
  },
  fieldValue: {
    color: OVERLAY_TOKENS.valueContentColor,
  },
  fieldLine: {
    backgroundColor: 'rgba(107, 212, 255, 0.18)',
  },
});

const tacticalThemed: ThemedStyles = StyleSheet.create({
  card: {
    borderColor: TACTICAL_OVERLAY.insetBorder,
    backgroundColor: TACTICAL_OVERLAY.insetBg,
  },
  docHeader: {
    backgroundColor: TACTICAL_OVERLAY.sectionBarBg,
    borderBottomColor: TACTICAL_OVERLAY.insetBorder,
  },
  docTitle: {
    color: TACTICAL_OVERLAY.sectionBarInk,
  },
  photoBg: {
    backgroundColor: TACTICAL_OVERLAY.footerBg,
  },
  divider: {
    backgroundColor: TACTICAL_OVERLAY.insetBorder,
  },
  fieldLabel: {
    color: TACTICAL_OVERLAY.labelInk,
  },
  fieldValue: {
    color: TACTICAL_OVERLAY.valueInk,
  },
  fieldLine: {
    backgroundColor: TACTICAL_OVERLAY.rowDivider,
  },
});

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.sm,
    height: PASSPORT_IDENTITY_CARD_HEIGHT_PX,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  docHeader: {
    minHeight: PASSPORT_IDENTITY_DOC_HEADER_PX,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  passportBody: {
    height: PASSPORT_IDENTITY_BODY_HEIGHT_PX,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  photoColumn: {
    flexShrink: 0,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  photoImage: {
    flex: 1,
    width: '100%',
  },
  photoPlaceholder: {
    flex: 1,
  },
  photoDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    columnGap: SPACING.sm,
    marginBottom: 6,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    paddingBottom: 3,
  },
  fieldLine: {
    height: StyleSheet.hairlineWidth,
  },
});
