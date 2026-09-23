// ============================================================
// 아크파이어 온라인 - 연구소 화면
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView,
} from 'react-native';
import { FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT } from '../../src/i18n';
import { resolveSkillDescription, resolveSkillEffectDescription, resolveSkillName } from '../../src/i18n/skillText';
import { useAppSettingsStore } from '../../src/store/appSettingsStore';
import { presentSkillInfoOverlay, useArcOverlayStore } from '../../src/ui/overlay/arcOverlayStore';
import { usePlayerStore } from '../../src/store/playerStore';
import { SKILLS, SKILL_CATEGORIES } from '../../src/data/skills';
import { Skill, SkillCategory } from '../../src/types';
import { canLearnSkill } from '../../src/engine/SkillEngine';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import {
  createSkilltreeScreenSession,
  HeavyUiStageErrorPanel,
  useHeavyUiDataSession,
} from '../../src/ui/heavyUiDataSession';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { usePlanetHubFacilityAccessGate } from '../../src/hooks/usePlanetHubFacilityAccessGate';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { useUiScreenShell } from '../../src/ui/process/useUiScreenShell';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import {
  PlanetFacilityTitleHeader,
  planetFacilityScreenStyles as fs,
} from '../../src/ui/planetFacility/PlanetFacilityTitleHeader';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { SkillTreeBoard } from '../../src/components/skillTree/SkillTreeBoard';
import { SkillTreeBlueprintBackdrop } from '../../src/components/skillTree/SkillTreeBlueprintBackdrop';
import {
  resolveSkillRuntimePartialNoteKey,
  resolveSkillRuntimeStatus,
} from '../../src/game/skillTree/skillRuntimeStatus';

/** 메인스테이지 기준 하단 공백과 동기 */
const SKILLTREE_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

export default function SkillTreeScreen() {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const localeRenderKey = useLocaleRenderKey();
  const player = usePlayerStore(s => s.player);
  const learnSkill = usePlayerStore(s => s.learnSkill);
  const persist = usePlayerStore(s => s.persist);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('combat');
  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();
  const skilltreeSessionConfig = useMemo(
    () => (player?.currentPlanetId ? createSkilltreeScreenSession(player.currentPlanetId) : null),
    [player?.currentPlanetId],
  );
  const skilltreeSession = useHeavyUiDataSession(skilltreeSessionConfig);
  const screenReady = skilltreeSession.phase === 'ready' && stageFrameReady;
  useUiScreenShell('skilltree', screenReady);
  usePlanetSubStageMemory('skilltree', () => {
    setSelectedCategory('combat');
  });
  usePlanetHubFacilityAccessGate('research_lab');

  const labRdBanner = useMemo(() => {
    if (skilltreeSession.data && skilltreeSession.data.labLevel > 0) {
      const { labLevel, rdSpeedReductionPct, nextTechnologyRdHours } = skilltreeSession.data;
      return {
        bonus: t('skilltree.labRdBonus', { level: labLevel, pct: rdSpeedReductionPct }),
        hours: nextTechnologyRdHours != null
          ? t('skilltree.labRdNextHours', { hours: nextTechnologyRdHours })
          : null,
      };
    }
    return null;
  }, [skilltreeSession.data, t]);

  useEffect(() => {
    return () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'skillInfo');
    };
  }, []);

  const handleSkillPress = useCallback((skill: Skill) => {
    if (!player) return;
    const learned = player.skills.includes(skill.id);
    const canLearn = canLearnSkill(skill, player);
    const prereqLearned = skill.prerequisiteIds.every((id) => player.skills.includes(id));
    const name = resolveSkillName(skill, locale);
    const desc = resolveSkillDescription(skill, locale);
    const effect = resolveSkillEffectDescription(skill, locale);
    const prerequisiteLine = skill.prerequisiteIds.length === 0
      ? t('skilltree.req.none')
      : skill.prerequisiteIds
        .map((id) => (SKILLS[id] ? resolveSkillName(SKILLS[id], locale) : id))
        .join(', ');

    presentSkillInfoOverlay({
      skillName: name,
      categoryLabel: t(`skilltree.cat.${skill.category}`),
      tier: skill.tier,
      description: desc,
      effect,
      runtimeStatus: resolveSkillRuntimeStatus(skill.id),
      runtimeNoteKey: resolveSkillRuntimePartialNoteKey(skill.id) ?? undefined,
      learned,
      canLearn,
      levelRequired: skill.levelRequired,
      playerLevel: player.level,
      skillPoints: player.skillPoints,
      prerequisiteLine,
      prerequisitesMet: prereqLearned,
      onLearn: canLearn
        ? async () => {
          learnSkill(skill.id);
          await persist();
        }
        : undefined,
    });
  }, [learnSkill, locale, persist, player, t]);

  if (!player) return null;

  const categories = Object.entries(SKILL_CATEGORIES) as [SkillCategory, { name: string; icon: string }][];

  return (
    <StageShell
      key={localeRenderKey}
      routeName="skilltree"
      background="none"
      edges={['bottom']}
      safeAreaBackgroundColor={TF.headerBg}
    >
      <View style={fs.root}>
        <PlanetFacilityTitleHeader
          title={t('skilltree.title')}
          onBack={safeBack}
          backLabel={t('skilltree.back')}
          trailing={
            <Text style={fs.headerTrailingInk}>
              {t('skilltree.spHeader', { sp: player.skillPoints })}
            </Text>
          }
        />

        <View style={fs.bodyPanel}>
          <PlanetFacilityTabBar
            tabs={categories.map(([cat, info]) => ({
              id: cat,
              label: t(`skillCat.${cat}`) === `skillCat.${cat}` ? info.name : t(`skillCat.${cat}`),
            }))}
            activeId={selectedCategory}
            onSelect={(id) => setSelectedCategory(id as SkillCategory)}
          />

          <ScrollView
            style={fs.scroll}
            contentContainerStyle={fs.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {labRdBanner ? (
              <View style={fs.insetSlot}>
                <Text style={styles.labBannerText}>{labRdBanner.bonus}</Text>
                {labRdBanner.hours ? (
                  <Text style={styles.labBannerSub}>{labRdBanner.hours}</Text>
                ) : null}
              </View>
            ) : null}
            <View style={[fs.infoPanel, styles.skillInfoPanel]}>
              <SkillTreeBlueprintBackdrop />
              <SkillTreeBoard
                category={selectedCategory}
                player={player}
                onSkillPress={handleSkillPress}
              />
            </View>
            <View style={{ height: SKILLTREE_BOTTOM_STAGE_RESERVE_PX }} />
          </ScrollView>

          <StageLoadingOverlay
            visible={!screenReady && skilltreeSession.phase !== 'error'}
            overlayId="stage-loading-skilltree"
          />
          {skilltreeSession.phase === 'error' ? (
            <HeavyUiStageErrorPanel
              preflightCode={skilltreeSession.preflightCode}
              error={skilltreeSession.error}
              facilityKind="research_lab"
              onRetry={skilltreeSession.retry}
              onBack={safeBack}
            />
          ) : null}
        </View>
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  skillInfoPanel: {
    position: 'relative',
    overflow: 'hidden',
  },
  labBannerText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.labelInk,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
  },
  labBannerSub: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.labelInk,
    textAlign: 'center',
  },
});
