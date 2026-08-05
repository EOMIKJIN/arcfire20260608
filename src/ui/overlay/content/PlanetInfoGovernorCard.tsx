import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getPlanetGovernorCommander } from '../../../game/planetGovernor/planetGovernorRegistry';
import {
  resolveNpcCaptainPortraitAspectRatio,
  resolveNpcCaptainPortraitSource,
} from '../../../game/npcCaptainPortraitAssets';
import { getNpcCaptain } from '../../../npc/npcFleetRegistry';
import { useNpcCaptainProgressStore } from '../../../store/npcCaptainProgressStore';
import { useT } from '../../../i18n';
import { resolveNpcCaptainDisplayName } from '../../../i18n/captainText';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayPreview';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';
import { PHOSPHOR_MUTED } from './phosphorOverlayStyles';

/** 카드 본문(사진 열) 높이 — 파일럿 여권 카드(`PlanetMainPilotInfoPanel`) 비율 참고 */
const GOVERNOR_CARD_BODY_HEIGHT_PX = 112;
const GOVERNOR_CARD_DOC_HEADER_PX = 22;
/** 포트레이트 미할당 시 사진 열 폴백 가로 */
const PHOTO_COLUMN_FALLBACK_WIDTH_PX = 78;

type ThemedStyles = {
  card: object;
  docHeader: object;
  docTitle: object;
  photoBg: object;
  placeholderGlyph: object;
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
  /** 행성정보창과 동일 테마 강제 — phosphor(네이비·시안) / tactical(G-ARCHIVE 라이트) */
  visualTheme?: ArcOverlayVisualTheme;
};

/**
 * 행성 정보창 — 총사령관(함장) 포트레이트 카드.
 * 레이아웃은 파일럿 정보(여권형: 사진 열 + 필드 열)를 따르고,
 * 데이터는 범용 NPC AI 테이블(`npc_ai_captains.csv` → `getNpcCaptain`)이 정본이다.
 * 레벨은 런타임 성장(`npcCaptainProgressStore`) 우선 · CSV 시드(initialLevel) 폴백.
 */
export const PlanetInfoGovernorCard = memo(function PlanetInfoGovernorCard({
  planetId,
  visualTheme = 'phosphor',
}: Props) {
  const t = useT();
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
  const photoColumnWidthPx = useMemo(() => {
    const aspect = resolveNpcCaptainPortraitAspectRatio(portraitSource);
    if (aspect != null) return Math.round(GOVERNOR_CARD_BODY_HEIGHT_PX * aspect);
    return PHOTO_COLUMN_FALLBACK_WIDTH_PX;
  }, [portraitSource]);

  if (!governor || !captain) return null;

  const name = resolveNpcCaptainDisplayName(captain, useAppSettingsStore.getState().locale);
  if (!name) return null;

  const level = Math.max(1, runtimeLevel ?? captain.progression.initialLevel ?? 1);
  const rank = String(captain.rank ?? '').trim() || '—';
  const governorTitle = String(governor.governorTitleKo ?? '').trim() || '—';

  return (
    <View style={[styles.card, themed.card]} accessibilityLabel={t('econInfo.governorCardA11y')}>
      <View style={[styles.docHeader, themed.docHeader]}>
        <Text style={[styles.docTitle, themed.docTitle]}>{t('econInfo.governorCardHeader')}</Text>
      </View>
      <View style={styles.body}>
        <View
          style={[styles.photoColumn, themed.photoBg, { width: photoColumnWidthPx }]}
          accessibilityRole="image"
          accessibilityLabel={t('econInfo.governorPortraitA11y')}
        >
          {portraitSource ? (
            <Image source={portraitSource} style={styles.photoImage} resizeMode="cover" />
          ) : (
            <View style={[styles.photoPlaceholder, themed.photoBg]}>
              <Text style={[styles.photoPlaceholderGlyph, themed.placeholderGlyph]}>◈</Text>
            </View>
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
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <GovernorField label={t('econInfo.governorField.rank')} value={rank} themed={themed} />
            <GovernorField
              label={t('econInfo.governorField.title')}
              value={governorTitle}
              themed={themed}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

/** phosphor — 네이비 카드·시안 라벨 (행성정보창 phosphor 복구 시) */
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
  placeholderGlyph: {
    color: OVERLAY_TOKENS.phosphorBorder,
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

/** tactical(G-ARCHIVE) — 행성정보창 현행 테마: 라이트 그레이 카드·다크 잉크 */
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
  placeholderGlyph: {
    color: TACTICAL_OVERLAY.labelInk,
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
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  docHeader: {
    minHeight: GOVERNOR_CARD_DOC_HEADER_PX,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
  },
  body: {
    minHeight: GOVERNOR_CARD_BODY_HEIGHT_PX,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderGlyph: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
  },
  photoDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  infoColumn: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: SPACING.sm,
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
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    paddingBottom: 3,
  },
  fieldLine: {
    height: StyleSheet.hairlineWidth,
  },
});
