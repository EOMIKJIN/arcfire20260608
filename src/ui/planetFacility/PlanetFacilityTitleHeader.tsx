import React, { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useT } from '../../i18n';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_FACILITY as TF } from '../tactical/tacticalFacilityScreenTokens';
import {
  formatTacticalOverlayTitle,
  tacticalTitleHeaderSubtitle,
  TACTICAL_OVERLAY,
} from '../overlay/tacticalOverlayStyles';
import { TitleHeaderHatchPattern } from '../overlay/TitleHeaderHatchPattern';

const FACILITY_HATCH_PATTERN_ID = 'planetFacilityTitleHatchV1';

type Props = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  trailing?: ReactNode;
};

/** 행성정보 오버레이 헤더 — 시설 서브스테이지 전폭 */
export const PlanetFacilityTitleHeader = memo(function PlanetFacilityTitleHeader({
  title,
  subtitle,
  onBack,
  backLabel: backLabelProp,
  trailing,
}: Props) {
  const t = useT();
  const backLabel = backLabelProp ?? t('common.back');
  const resolvedTitle = formatTacticalOverlayTitle(title);
  const resolvedSubtitle = tacticalTitleHeaderSubtitle(subtitle);

  return (
    <View style={styles.shell}>
      <View style={styles.accentTop} pointerEvents="none" />
      <TitleHeaderHatchPattern
        patternId={FACILITY_HATCH_PATTERN_ID}
        stroke={TACTICAL_OVERLAY.headerPatternStroke}
      />
      <View style={styles.row}>
        <Pressable
          style={styles.backBtn}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {resolvedTitle}
          </Text>
          {resolvedSubtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {resolvedSubtitle}
            </Text>
          ) : null}
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <View style={styles.bottomRule} pointerEvents="none" />
    </View>
  );
});

export const planetFacilityScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TF.bodyBg,
  },
  bodyPanel: {
    flex: 1,
    backgroundColor: TF.bodyBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TF.bodyBorder,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  /** 행 목록 카드 — 행성개발 listItemTactical 과 동일 (cardBg + 테두리) */
  listingCard: {
    flexDirection: 'row',
    backgroundColor: TF.cardBg,
    borderWidth: 1,
    borderColor: TF.cardBorder,
    borderRadius: 6,
    padding: SPACING.md,
    marginBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    rowGap: SPACING.sm,
    columnGap: SPACING.sm,
  },
  listingTextBlock: { flex: 1, minWidth: 0, alignSelf: 'stretch', width: '100%' },
  /** 목록 카드 — 제목 하단 구분선 (무역·시설 listing 공통) */
  listingTitleHead: {
    alignSelf: 'stretch',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TF.divider,
    marginBottom: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  /** listingTitleHead 내부 — 제목 + 우측 meta 한 줄 */
  listingTitleHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: SPACING.sm,
  },
  listingTitleFlex: {
    flex: 1,
    minWidth: 0,
  },
  listingRight: { alignItems: 'flex-end', minWidth: 90 },
  itemTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: TF.titleInk,
  },
  itemDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.labelInk,
  },
  itemPrice: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: TF.titleInk,
  },
  itemMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    marginTop: 2,
    color: TF.labelInk,
  },
  sectionBar: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: TF.sectionBarBg,
    borderRadius: 2,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.8,
    color: TF.sectionBarInk,
    textAlign: 'center',
  },
  /** sectionBar 배경 — View 셸 (Text 단독 backgroundColor 대비 안정) */
  sectionBarShell: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: TF.sectionBarBg,
    borderRadius: 2,
  },
  sectionBarText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.8,
    color: TF.sectionBarInk,
    textAlign: 'center',
  },
  /** stackCard 내부 sectionBarShell — 하단 여백 */
  sectionBarInCard: {
    marginBottom: SPACING.sm,
  },
  /** infoPanel·stackCard 최상단 섹션 바 — marginTop 제거 */
  sectionBarFirst: {
    marginTop: 0,
  },
  empty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TF.labelInk,
    textAlign: 'center',
    marginTop: 60,
  },
  /** stackCard·섹션 패널 내부 세로 항목 — cardBg (insetSlot 대체 · 공지·바운티) */
  listingEntryCard: {
    backgroundColor: TF.cardBg,
    borderWidth: 1,
    borderColor: TF.cardBorder,
    borderRadius: 4,
    padding: SPACING.md,
  },
  /** 목록형 카드(공지·미션·제원 패널) — listItemTactical 과 동일 cardBg */
  stackCard: {
    backgroundColor: TF.cardBg,
    borderWidth: 1,
    borderColor: TF.cardBorder,
    borderRadius: 6,
    padding: SPACING.md,
    marginBottom: 8,
  },
  /** @alias stackCard — 제원·서비스·장착 등 정보 패널 (스크롤 직속, insetBox 금지) */
  infoPanel: {
    backgroundColor: TF.cardBg,
    borderWidth: 1,
    borderColor: TF.cardBorder,
    borderRadius: 6,
    padding: SPACING.md,
    marginBottom: 8,
  },
  /** @deprecated — 스크롤 섹션 제목은 sectionBar / PlanetFacilitySectionHeader 사용 */
  sectionHeaderBlock: {
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  /** @deprecated — PlanetFacilitySectionHeader + sectionBar 사용 */
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.labelInk,
  },
  sectionMeta: {
    marginTop: 3,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.labelInk,
  },
  /** sectionBar + 선택적 meta — 스크롤 직속 섹션 리드 */
  sectionLead: {
    marginBottom: SPACING.sm,
  },
  sectionMetaUnderBar: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.labelInk,
    textAlign: 'center',
  },
  sectionEmpty: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.labelInk,
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: TF.titleInk,
    marginBottom: 4,
  },
  cardBody: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.bodyInk,
    lineHeight: 18,
  },
  cardMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.labelInk,
  },
  cardBadge: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.info,
    fontWeight: FONTS.weight.bold,
  },
  /** 미션·상태 라벨 — 회색 pill (완료·진행 중) */
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  statusPillNeutral: {
    backgroundColor: TF.sectionBarBg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TF.cardBorder,
  },
  statusPillPrimary: {
    backgroundColor: TF.safeInk,
  },
  statusPillText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.4,
  },
  statusPillTextNeutral: {
    color: TF.sectionBarInk,
  },
  statusPillTextPrimary: {
    color: '#FFFFFF',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  insetBox: {
    marginBottom: SPACING.sm,
    backgroundColor: TF.insetBg,
    borderWidth: 1,
    borderColor: TF.insetBorder,
    borderRadius: 4,
    padding: SPACING.sm,
  },
  /** 카드·패널 내부 아이콘·메타·하이라이트 슬롯 (무역 아이콘·pgpBanner) */
  insetSlot: {
    backgroundColor: TF.insetBg,
    borderWidth: 1,
    borderColor: TF.insetBorder,
    borderRadius: 4,
    padding: SPACING.sm,
  },
  insetTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
    color: TF.sectionBarInk,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TF.divider,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.labelInk,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.titleInk,
    fontWeight: FONTS.weight.bold,
  },
  headerTrailingInk: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: TF.headerSubtitleInk,
    textAlign: 'right',
  },
});

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    backgroundColor: TF.headerBg,
    overflow: 'hidden',
    minHeight: 44,
  },
  accentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: TACTICAL_OVERLAY.headerTopAccent,
    zIndex: 2,
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    zIndex: 3,
  },
  backBtn: {
    paddingTop: 2,
    paddingRight: SPACING.xs,
    flexShrink: 0,
  },
  backText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: TF.headerBackInk,
    letterSpacing: 0.5,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.8,
    color: TF.headerTitleInk,
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.headerSubtitleInk,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  trailing: {
    flexShrink: 0,
    paddingTop: 2,
    maxWidth: '36%',
  },
  bottomRule: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.md,
    right: SPACING.md,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TF.headerBorder,
    zIndex: 2,
  },
});

type ListingTextBlockProps = {
  title: ReactNode;
  description?: ReactNode;
  descriptionLines?: number;
};

type CardTitleBlockProps = {
  title: ReactNode;
  /** 제목 우측 meta (레벨·수량 등) */
  meta?: ReactNode;
  metaStyle?: StyleProp<TextStyle>;
  titleNumberOfLines?: number;
  description?: ReactNode;
  descriptionLines?: number;
  children?: ReactNode;
};

/** G-ARCHIVE 카드 — 제목(+선택 meta) + 하단 rule + 설명·하위 콘텐츠 (조선소 강화·격납고 등) */
export const PlanetFacilityCardTitleBlock = memo(function PlanetFacilityCardTitleBlock({
  title,
  meta,
  metaStyle,
  titleNumberOfLines,
  description,
  descriptionLines = 0,
  children,
}: CardTitleBlockProps) {
  return (
    <View style={planetFacilityScreenStyles.listingTextBlock}>
      <View style={planetFacilityScreenStyles.listingTitleHead}>
        {meta != null ? (
          <View style={planetFacilityScreenStyles.listingTitleHeadRow}>
            <Text
              style={[planetFacilityScreenStyles.itemTitle, planetFacilityScreenStyles.listingTitleFlex]}
              numberOfLines={titleNumberOfLines ?? 1}
            >
              {title}
            </Text>
            <Text style={[planetFacilityScreenStyles.cardMeta, metaStyle]}>{meta}</Text>
          </View>
        ) : (
          <Text style={planetFacilityScreenStyles.itemTitle} numberOfLines={titleNumberOfLines}>
            {title}
          </Text>
        )}
      </View>
      {description != null ? (
        <Text
          style={planetFacilityScreenStyles.itemDesc}
          numberOfLines={descriptionLines > 0 ? descriptionLines : undefined}
        >
          {description}
        </Text>
      ) : null}
      {children}
    </View>
  );
});

/** G-ARCHIVE 목록 카드 — 제목 + 하단 rule + 설명 (무역 listing 등) */
export const PlanetFacilityListingTextBlock = memo(function PlanetFacilityListingTextBlock({
  title,
  description,
  descriptionLines = 1,
}: ListingTextBlockProps) {
  return (
    <PlanetFacilityCardTitleBlock
      title={title}
      description={description}
      descriptionLines={descriptionLines}
    />
  );
});

export type FacilityStatusPillTone = 'neutral' | 'primary';

/** G-ARCHIVE 상태 pill — 완료·진행(회색) / 주 미션(녹색) */
export const PlanetFacilityStatusPill = memo(function PlanetFacilityStatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: FacilityStatusPillTone;
}) {
  const isPrimary = tone === 'primary';
  return (
    <View
      style={[
        planetFacilityScreenStyles.statusPill,
        isPrimary ? planetFacilityScreenStyles.statusPillPrimary : planetFacilityScreenStyles.statusPillNeutral,
      ]}
    >
      <Text
        style={[
          planetFacilityScreenStyles.statusPillText,
          isPrimary
            ? planetFacilityScreenStyles.statusPillTextPrimary
            : planetFacilityScreenStyles.statusPillTextNeutral,
        ]}
      >
        {label}
      </Text>
    </View>
  );
});

type SectionHeaderProps = {
  title: string;
  meta?: string;
  /** 탭·스크롤 최상단 섹션 — sectionBar marginTop 제거 */
  first?: boolean;
  /** stackCard 내부 — cardBg 패널 + 회색 sectionBar */
  inCard?: boolean;
};

/** G-ARCHIVE 섹션 서브제목 — 회색 중앙 정렬 sectionBar (+ 선택 meta) */
export const PlanetFacilitySectionHeader = memo(function PlanetFacilitySectionHeader({
  title,
  meta,
  first = false,
  inCard = false,
}: SectionHeaderProps) {
  const barFirst = first || inCard;
  const header = (
    <>
      <View
        style={[
          planetFacilityScreenStyles.sectionBarShell,
          barFirst ? planetFacilityScreenStyles.sectionBarFirst : undefined,
          inCard ? planetFacilityScreenStyles.sectionBarInCard : undefined,
        ]}
      >
        <Text style={planetFacilityScreenStyles.sectionBarText}>{title}</Text>
      </View>
      {meta ? (
        <Text style={planetFacilityScreenStyles.sectionMetaUnderBar}>{meta}</Text>
      ) : null}
    </>
  );

  if (inCard) return header;
  return <View style={planetFacilityScreenStyles.sectionLead}>{header}</View>;
});
