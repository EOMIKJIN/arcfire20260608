import React, { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import type { ArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { TACTICAL_OVERLAY, tacticalPlanetEconomyOverlayStyles } from '../tacticalOverlayStyles';
import { overlayInkColor, resolveOverlayVisualTokens } from '../overlayVisualTokens';
import { planetDevelopmentOverlayStyles as devStyles } from './planetDevelopmentOverlayStyles';
import { PlanetInfoDescriptionBlock } from './PlanetInfoDescriptionBlock';

export { resolvePlanetDevArcButtonVariants } from '../overlayVisualTokens';

type SectionBarProps = {
  label: string;
  visualTheme?: ArcOverlayVisualTheme;
  /** 스크롤 첫 섹션 — bodyPanel paddingTop 과 중복 margin 제거 */
  leadSection?: boolean;
};

/** 행성정보창 유지비 섹션 — 회색 바 배경 (제목 전용) */
export const PlanetDevSectionBar = memo(function PlanetDevSectionBar({
  label,
  visualTheme = 'phosphor',
  leadSection = false,
}: SectionBarProps) {
  const isTactical = visualTheme === 'tactical';
  if (isTactical) {
    return (
      <Text
        style={[
          tacticalPlanetEconomyOverlayStyles.section,
          leadSection ? styles.leadSection : null,
        ]}
      >
        {label}
      </Text>
    );
  }
  return (
    <Text
      style={[
        devStyles.section,
        styles.sectionPhosphor,
        leadSection ? styles.leadSection : null,
      ]}
    >
      {label}
    </Text>
  );
});

type ListItemHeaderProps = {
  title: string;
  summary: string;
  visualTheme?: ArcOverlayVisualTheme;
  titleSuffix?: ReactNode;
  disabled?: boolean;
};

/** 개발 목록 카드 — 제목(유지비 섹션 바) · 설명 높이 = 행성정보 `PlanetInfoDescriptionBlock` */
export const PlanetDevListItemHeader = memo(function PlanetDevListItemHeader({
  title,
  summary,
  visualTheme = 'phosphor',
  titleSuffix,
  disabled,
}: ListItemHeaderProps) {
  const isTactical = visualTheme === 'tactical';
  const summaryTrimmed = summary.trim();

  return (
    <>
      <Text
        style={[
          isTactical
            ? [tacticalPlanetEconomyOverlayStyles.section, styles.listItemTitleSection]
            : [devStyles.listItemTitle, styles.listTitleBarPhosphor, styles.listTitlePhosphor],
          disabled && styles.textDisabled,
        ]}
        numberOfLines={1}
      >
        {title}
        {titleSuffix}
      </Text>
      {summaryTrimmed.length > 0 ? (
        <PlanetInfoDescriptionBlock
          description={summaryTrimmed}
          visualTheme={visualTheme}
        />
      ) : null}
    </>
  );
});

type HintTextProps = {
  children: React.ReactNode;
  visualTheme?: ArcOverlayVisualTheme;
  /** label=보조 안내 · body=진행 수치 */
  variant?: 'label' | 'body';
};

/** 행성개발 상세 — hint 텍스트 잉크 (범용 토큰) */
export const PlanetDevHintText = memo(function PlanetDevHintText({
  children,
  visualTheme = 'phosphor',
  variant = 'label',
}: HintTextProps) {
  const color = overlayInkColor(visualTheme, variant === 'body' ? 'body' : 'label');
  return <Text style={[devStyles.hint, { color }]}>{children}</Text>;
});

type MetaDividerProps = {
  visualTheme?: ArcOverlayVisualTheme;
};

/** 행성정보 `ArcOverlayInfoRow` hairline 과 동일 — 설명·상태/진행 사이 구분 */
export const PlanetDevMetaDivider = memo(function PlanetDevMetaDivider({
  visualTheme = 'phosphor',
}: MetaDividerProps) {
  const { rowDivider } = resolveOverlayVisualTokens(visualTheme);
  return (
    <View
      style={[styles.metaDividerBase, { backgroundColor: rowDivider }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
});

type ListMetaSectionProps = {
  visualTheme?: ArcOverlayVisualTheme;
  children: ReactNode;
};

/** 개발 목록 카드 — 설명 아래 상태·진행 블록 (상단 구분선 포함) */
export const PlanetDevListMetaSection = memo(function PlanetDevListMetaSection({
  visualTheme = 'phosphor',
  children,
}: ListMetaSectionProps) {
  return (
    <View style={styles.listMetaSection}>
      <PlanetDevMetaDivider visualTheme={visualTheme} />
      {children}
    </View>
  );
});

type SummaryInsetProps = {
  text: string;
  visualTheme?: ArcOverlayVisualTheme;
};

/** 상세 화면 상단 모듈 설명 — 행성정보 설명란과 동일 높이 */
export const PlanetDevSummaryInset = memo(function PlanetDevSummaryInset({
  text,
  visualTheme = 'phosphor',
}: SummaryInsetProps) {
  return (
    <PlanetInfoDescriptionBlock
      description={text}
      visualTheme={visualTheme}
      compactTop
    />
  );
});

const styles = StyleSheet.create({
  leadSection: {
    marginTop: 0,
  },
  sectionPhosphor: {
    color: OVERLAY_TOKENS.phosphorAccent,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(53, 208, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  /** 카드 내 첫 섹션 — 상단 margin 제거 (본문 스크롤과 동일 토큰) */
  listItemTitleSection: {
    marginTop: 0,
  },
  listTitleBarPhosphor: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'rgba(53, 208, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  listTitlePhosphor: {
    color: OVERLAY_TOKENS.phosphorAccent,
    letterSpacing: 0.5,
  },
  textDisabled: {
    opacity: 0.72,
  },
  listMetaSection: {
    alignSelf: 'stretch',
  },
  metaDividerBase: {
    height: StyleSheet.hairlineWidth,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    alignSelf: 'stretch',
  },
});
