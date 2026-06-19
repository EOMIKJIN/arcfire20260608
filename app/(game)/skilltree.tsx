// ============================================================
// 아크파이어 온라인 - 연구소 화면
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { useT } from '../../src/i18n';
import { resolveSkillDescription, resolveSkillEffectDescription, resolveSkillName } from '../../src/i18n/skillText';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { usePlayerStore } from '../../src/store/playerStore';
import { SKILLS, SKILL_CATEGORIES } from '../../src/data/skills';
import { Skill, SkillCategory } from '../../src/types';
import { canLearnSkill } from '../../src/engine/SkillEngine';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { usePlanetHubFacilityAccessGate } from '../../src/hooks/usePlanetHubFacilityAccessGate';
import { useLocaleRenderKey } from '../../src/hooks/useLocaleRenderKey';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { ArcStageBackButton } from '../../src/ui/overlay/ArcStageBackButton';
import { PlanetFacilityTabBar } from '../../src/ui/planetFacility/PlanetFacilityTabBar';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { SkillTreeBoard } from '../../src/components/skillTree/SkillTreeBoard';

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
  usePlanetSubStageMemory('skilltree', () => {
    setSelectedCategory('combat');
  });
  usePlanetHubFacilityAccessGate('research_lab');

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
    <StageShell key={localeRenderKey} routeName="skilltree" background="none" edges={['bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <ArcStageBackButton onPress={safeBack} style={styles.backBtn} />
          <Text style={styles.headerTitle}>{t('skilltree.title')}</Text>
          <View style={styles.spBadge}>
            <Text style={styles.spText}>SP {player.skillPoints}</Text>
          </View>
        </View>

        <PlanetFacilityTabBar
          tabs={categories.map(([cat, info]) => ({ id: cat, label: t(`skillCat.${cat}`) === `skillCat.${cat}` ? info.name : t(`skillCat.${cat}`) }))}
          activeId={selectedCategory}
          onSelect={(id) => setSelectedCategory(id as SkillCategory)}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.treePanel}>
            <SkillTreeBoard
              category={selectedCategory}
              player={player}
              onSkillPress={handleSkillPress}
            />
          </View>
          <View style={{ height: SKILLTREE_BOTTOM_STAGE_RESERVE_PX }} />
        </ScrollView>
        <StageLoadingOverlay visible={!stageFrameReady} overlayId="stage-loading-skilltree" />
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1020' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  backBtn: { marginRight: SPACING.sm },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: '#F1F5F9',
  },
  spBadge: {
    backgroundColor: 'rgba(159, 123, 255, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.skill,
    borderRadius: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  spText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.skill,
    fontWeight: FONTS.weight.bold,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  treePanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107, 212, 255, 0.12)',
    backgroundColor: 'rgba(6, 10, 20, 0.55)',
    paddingVertical: SPACING.sm,
  },
});
