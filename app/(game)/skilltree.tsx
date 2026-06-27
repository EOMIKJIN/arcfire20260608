// ============================================================
// 아크파이어 온라인 - 연구소 화면
// ============================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView,
} from 'react-native';
import { FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT } from '../../src/i18n';
import { resolveSkillDescription, resolveSkillEffectDescription, resolveSkillName } from '../../src/i18n/skillText';
import { showArcAlert } from '../../src/utils/showArcAlert';
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

/** 메인스테이지 기준 하단 공백과 동기 */
const SKILLTREE_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

export default function SkillTreeScreen() {
  const t = useT();
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

  const handleSkillPress = useCallback((skill: Skill) => {
    if (!player) return;
    const learned = player.skills.includes(skill.id);
    const canLearn = canLearnSkill(skill, player);
    const prereqLearned = skill.prerequisiteIds.every((id) => player.skills.includes(id));
    const name = resolveSkillName(skill, t);
    const desc = resolveSkillDescription(skill, t);
    const effect = resolveSkillEffectDescription(skill, t);

    if (learned) {
      showArcAlert(
        t('skilltree.learnedTitle', { name }),
        t('skilltree.body', { desc, effect }),
      );
      return;
    }
    if (canLearn) {
      showArcAlert(
        t('skilltree.learnTitle', { name }),
        t('skilltree.learnBody', { desc, effect, sp: player.skillPoints }),
        [
          { text: t('skilltree.cancel'), style: 'cancel' },
          {
            text: t('skilltree.learn'),
            onPress: async () => {
              learnSkill(skill.id);
              await persist();
            },
          },
        ],
      );
      return;
    }
    if (!prereqLearned) {
      const names = skill.prerequisiteIds
        .map((id) => (SKILLS[id] ? resolveSkillName(SKILLS[id], t) : id))
        .join(', ');
      showArcAlert(t('skilltree.prereqTitle'), t('skilltree.prereqBody', { names }));
      return;
    }
    if (player.level < skill.levelRequired) {
      showArcAlert(t('skilltree.levelTitle'), t('skilltree.levelBody', { level: skill.levelRequired }));
      return;
    }
    if (player.skillPoints <= 0) {
      showArcAlert(t('skilltree.spTitle'), t('skilltree.spBody'));
      return;
    }
    showArcAlert(name, desc);
  }, [learnSkill, persist, player, t]);

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
