// ============================================================
// 아크파이어 온라인 - 연구소 화면
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { usePlayerStore } from '../../src/store/playerStore';
import { SKILLS, SKILL_CATEGORIES } from '../../src/data/skills';
import { Skill, SkillCategory } from '../../src/types';
import { canLearnSkill } from '../../src/engine/SkillEngine';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';
import { SkillTreeBoard } from '../../src/components/skillTree/SkillTreeBoard';

/** 메인스테이지 기준 하단 공백과 동기 */
const SKILLTREE_BOTTOM_STAGE_RESERVE_PX = PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX;

export default function SkillTreeScreen() {
  const player = usePlayerStore(s => s.player);
  const learnSkill = usePlayerStore(s => s.learnSkill);
  const persist = usePlayerStore(s => s.persist);
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('combat');
  const safeBack = useSafeRouterBack();
  const stageFrameReady = useStageFirstFrameReady();
  usePlanetSubStageMemory('skilltree', () => {
    setSelectedCategory('combat');
  });

  const handleSkillPress = useCallback((skill: Skill) => {
    if (!player) return;
    const learned = player.skills.includes(skill.id);
    const canLearn = canLearnSkill(skill, player);
    const prereqLearned = skill.prerequisiteIds.every((id) => player.skills.includes(id));

    if (learned) {
      showArcAlert(
        `${skill.name} ✓`,
        `${skill.description}\n\n${skill.effect.description}`,
      );
      return;
    }
    if (canLearn) {
      showArcAlert(
        `${skill.name} 습득`,
        `${skill.description}\n\n${skill.effect.description}\n\n스킬 포인트 1을 사용해 습득하시겠습니까? (SP ${player.skillPoints})`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '습득',
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
      const names = skill.prerequisiteIds.map((id) => SKILLS[id]?.name ?? id).join(', ');
      showArcAlert('선행 스킬 필요', `먼저 습득: ${names}`);
      return;
    }
    if (player.level < skill.levelRequired) {
      showArcAlert('레벨 부족', `파일럿 Lv.${skill.levelRequired} 이상 필요합니다.`);
      return;
    }
    if (player.skillPoints <= 0) {
      showArcAlert('SP 부족', '스킬 포인트가 부족합니다.');
      return;
    }
    showArcAlert(skill.name, skill.description);
  }, [learnSkill, persist, player]);

  if (!player) return null;

  const categories = Object.entries(SKILL_CATEGORIES) as [SkillCategory, { name: string; icon: string }][];

  return (
    <StageShell routeName="skilltree" background="none" edges={['bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={safeBack}
            style={styles.backBtn}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.backText}>◀ 나가기</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>연구소</Text>
          <View style={styles.spBadge}>
            <Text style={styles.spText}>SP {player.skillPoints}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {categories.map(([cat, info]) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, selectedCategory === cat && styles.tabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.tabText, selectedCategory === cat && styles.tabTextActive]}>
                [{` ${info.name} `}]
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
        <StageLoadingOverlay visible={!stageFrameReady} />
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
  backBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, marginRight: SPACING.sm },
  backText: { fontFamily: FONTS.mono, fontSize: FONTS.size.md, color: '#C7D2EA' },
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#F8FAFC',
    backgroundColor: 'rgba(30, 41, 59, 0.65)',
  },
  tabText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: 'rgba(148, 163, 184, 0.9)',
  },
  tabTextActive: { color: '#F8FAFC', fontWeight: FONTS.weight.bold },
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
