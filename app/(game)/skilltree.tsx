// ============================================================
// 아크파이어 온라인 - 연구소 화면
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { usePlayerStore } from '../../src/store/playerStore';
import { SKILLS, SKILL_CATEGORIES } from '../../src/data/skills';
import { SkillCategory } from '../../src/types';
import { canLearnSkill } from '../../src/engine/SkillEngine';
import { useSafeRouterBack } from '../../src/navigation/useSafeRouterBack';
import { usePlanetSubStageMemory } from '../../src/hooks/usePlanetSubStageMemory';
import { useStageFirstFrameReady } from '../../src/navigation/useStageFirstFrameReady';
import { StageLoadingOverlay } from '../../src/components/StageLoadingOverlay';
import { StageShell } from '../../src/stages/StageShell';
import { PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX } from '../../src/stages/planetMainStageLayout';

const SKILL_DETAIL_WIP_ALERT = {
  title: '준비 중',
  message: '스킬 상세·습득 화면은 아직 미완성입니다.\n추후 업데이트에서 제공됩니다.',
};
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

  if (!player) return null;

  const categories = Object.entries(SKILL_CATEGORIES) as [SkillCategory, { name: string; icon: string }][];
  const filteredSkills = Object.values(SKILLS).filter(s => s.category === selectedCategory);

  return (
    <StageShell routeName="skilltree" background="none" edges={['bottom']}>
      <View style={{ flex: 1 }}>
      {/* 헤더 */}
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

      {/* 카테고리 탭 */}
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

      {/* 스킬 목록 */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {[1, 2, 3, 4].map(tier => {
          const tierSkills = filteredSkills.filter(s => s.tier === tier);
          if (!tierSkills.length) return null;
          return (
            <View key={tier} style={styles.tierBlock}>
              <Text style={styles.tierLabel}>— Tier {tier} —</Text>
              {tierSkills.map(skill => {
                const learned = player.skills.includes(skill.id);
                const canLearn = canLearnSkill(skill, player);
                const prereqLearned = skill.prerequisiteIds.every(id => player.skills.includes(id));

                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[
                      styles.skillCard,
                      learned && styles.skillCardLearned,
                      canLearn && !learned && styles.skillCardAvailable,
                      !prereqLearned && styles.skillCardLocked,
                    ]}
                    onPress={() => {
                      if (learned) {
                        showArcAlert('습득 완료', '이미 보유한 스킬입니다.');
                        return;
                      }
                      if (canLearn) {
                        showArcAlert(
                          `${skill.name} 습득`,
                          `스킬 포인트 1을 사용해 습득하시겠습니까?\n현재 SP: ${player.skillPoints}`,
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
                      showArcAlert(SKILL_DETAIL_WIP_ALERT.title, SKILL_DETAIL_WIP_ALERT.message, [
                        { text: '확인', style: 'default' },
                      ]);
                    }}
                  >
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillIcon}>{skill.icon}</Text>
                      <View style={styles.skillInfo}>
                        <Text style={[styles.skillName, learned && styles.skillNameLearned]}>
                          {skill.name}
                          {learned ? ' ✓' : ''}
                        </Text>
                        <Text style={styles.skillReq}>
                          Lv.{skill.levelRequired} 필요
                          {skill.prerequisiteIds.length > 0
                            ? `  ·  선행: ${skill.prerequisiteIds.map(id => SKILLS[id]?.name).join(', ')}`
                            : ''}
                        </Text>
                      </View>
                      <Text style={styles.skillType}>
                        {skill.effect.type === 'active' ? '[액티브]' : '[패시브]'}
                      </Text>
                    </View>
                    <Text style={styles.skillDesc}>{skill.description}</Text>
                    <Text style={styles.skillStateLine}>
                      {learned
                        ? '상태: 습득됨'
                        : canLearn
                          ? '상태: 활성화(습득 가능)'
                          : !prereqLearned
                            ? '상태: 선행 스킬 필요'
                            : player.level < skill.levelRequired
                              ? `상태: 레벨 ${skill.levelRequired} 필요`
                              : '상태: 스킬 포인트 부족'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
        <View style={{ height: SKILLTREE_BOTTOM_STAGE_RESERVE_PX }} />
      </ScrollView>
      <StageLoadingOverlay visible={!stageFrameReady} />
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg_panel,
  },
  backBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, marginRight: SPACING.sm },
  backText: { fontFamily: FONTS.mono, fontSize: FONTS.size.md, color: COLORS.ink_mid },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  spBadge: {
    backgroundColor: COLORS.skill + '22',
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
    backgroundColor: COLORS.bg_secondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    rowGap: 2, columnGap: 2,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.ink_dark,
    backgroundColor: COLORS.bg_panel,
  },
  tabText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
  },
  tabTextActive: { color: COLORS.ink_dark, fontWeight: FONTS.weight.bold },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },
  tierBlock: { marginTop: SPACING.lg },
  tierLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  skillCard: {
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  skillCardLearned: {
    borderColor: COLORS.exp,
    backgroundColor: COLORS.exp + '11',
  },
  skillCardAvailable: {
    borderColor: COLORS.skill,
    backgroundColor: COLORS.skill + '0A',
  },
  skillCardLocked: {
    opacity: 0.4,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  skillIcon: { fontSize: 20, marginRight: SPACING.sm },
  skillInfo: { flex: 1 },
  skillName: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  skillNameLearned: { color: COLORS.exp },
  skillReq: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginTop: 2,
  },
  skillType: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_faint,
  },
  skillDesc: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    lineHeight: 18,
  },
  skillStateLine: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
  },
});
