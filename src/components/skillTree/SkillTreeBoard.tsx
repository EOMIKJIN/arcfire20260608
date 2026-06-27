// ============================================================
// 연구소 — 티어·직각 연결선 스킬 트리 보드 (다크 카드 · 밝은 잉크)
// ============================================================

import React, { memo, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import type { Player, Skill, SkillCategory } from '../../types';
import { SKILLS } from '../../data/skills';
import { canLearnSkill } from '../../engine/SkillEngine';
import { FONTS, SPACING } from '../../utils/theme';
import { useT } from '../../i18n';
import { resolveSkillName } from '../../i18n/skillText';
import { resolveSkillTreeIconSpec } from '../../game/skillTree/skillTreeIcons';
import { PlanetHubActionIcon } from '../../ui/tactical/PlanetHubActionIcon';
import { TACTICAL_HUB as TH } from '../../ui/tactical/tacticalHubTokens';
import {
  getMaxSkillTreeTier,
  listSkillTreeEdgesForCategory,
  listSkillTreeNodesForCategory,
  type SkillTreeNodeLayout,
} from '../../game/skillTree/skillTreeLayout';

const NODE_W = 76;
const NODE_H = 86;
const COL_W = 104;
const TIER_GAP = 32;
const TIER_LABEL_H = 24;
const BOARD_PAD_H = 12;
const BOARD_PAD_TOP = 8;
/** 노드 테두리와 연결선 사이 여백 */
const LINE_NODE_PAD = 4;

const SKILL_LED_ACTIVE = TH.tileIconLedActive;

/** 스킬 노드 — 허브 다크 타일 톤 + 밝은 잉크 */
const SKILL_CARD = {
  bg: TH.tileGradBottom,
  bgLearned: '#1A2332',
  bgAvailable: '#181E28',
  border: TH.tileBorder,
  borderActive: SKILL_LED_ACTIVE,
  nameInk: TH.topBarCurrencyInk,
  nameLearnedInk: SKILL_LED_ACTIVE,
  levelInk: TH.tileIconInk,
  iconDefault: TH.tileIconInk,
  iconAvailable: SKILL_LED_ACTIVE,
  iconLearned: SKILL_LED_ACTIVE,
  iconLocked: 'rgba(184, 190, 201, 0.40)',
  tierInk: TH.tileLabelInk,
  edgeActive: SKILL_LED_ACTIVE,
  edgeIdle: 'rgba(110, 128, 160, 0.38)',
} as const;

type Pt = { x: number; y: number };

type Props = {
  category: SkillCategory;
  player: Player;
  onSkillPress: (skill: Skill) => void;
};

type TierGeometry = {
  labelTop: number;
  nodeTop: number;
  nodeBottom: number;
  gapTop: number;
  gapBottom: number;
};

const androidTextFix = Platform.OS === 'android' ? { includeFontPadding: false as const } : null;

function tierBlockHeight(): number {
  return TIER_LABEL_H + NODE_H + TIER_GAP;
}

function tierGeometry(tier: number): TierGeometry {
  const blockTop = BOARD_PAD_TOP + (tier - 1) * tierBlockHeight();
  const nodeTop = blockTop + TIER_LABEL_H;
  const nodeBottom = nodeTop + NODE_H;
  return {
    labelTop: blockTop,
    nodeTop,
    nodeBottom,
    gapTop: nodeBottom,
    gapBottom: nodeBottom + TIER_GAP,
  };
}

function nodeTopLeft(tier: number, column: number): { left: number; top: number } {
  const geo = tierGeometry(tier);
  return {
    left: BOARD_PAD_H + column * COL_W,
    top: geo.nodeTop,
  };
}

function nodeAnchorX(layout: SkillTreeNodeLayout): number {
  const { left } = nodeTopLeft(layout.tier, layout.column);
  return left + NODE_W / 2;
}

function gapMidY(tier: number): number {
  const geo = tierGeometry(tier);
  return (geo.gapTop + geo.gapBottom) / 2;
}

function buildOrthogonalEdgePoints(
  from: SkillTreeNodeLayout,
  to: SkillTreeNodeLayout,
): Pt[] {
  const fromGeo = tierGeometry(from.tier);
  const px = nodeAnchorX(from);
  const cx = nodeAnchorX(to);
  const yStart = fromGeo.nodeBottom + LINE_NODE_PAD;
  const toGeo = tierGeometry(to.tier);
  const yEnd = toGeo.nodeTop - LINE_NODE_PAD;

  if (yEnd <= yStart) return [];

  const adjacentTier = to.tier === from.tier + 1;

  if (adjacentTier && px === cx) {
    return [
      { x: px, y: yStart },
      { x: cx, y: yEnd },
    ];
  }

  if (adjacentTier && px !== cx) {
    const hopY = gapMidY(from.tier);
    return [
      { x: px, y: yStart },
      { x: px, y: hopY },
      { x: cx, y: hopY },
      { x: cx, y: yEnd },
    ];
  }

  const channelX = Math.max(4, Math.min(px, cx) - NODE_W * 0.55 - 6);
  const routeY = gapMidY(to.tier - 1);
  const departY = gapMidY(from.tier);
  return [
    { x: px, y: yStart },
    { x: px, y: departY },
    { x: channelX, y: departY },
    { x: channelX, y: routeY },
    { x: cx, y: routeY },
    { x: cx, y: yEnd },
  ];
}

function pointsToPolylineAttr(points: Pt[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function resolveNodeVisualState(skill: Skill, player: Player) {
  const learned = player.skills.includes(skill.id);
  const prereqLearned = skill.prerequisiteIds.every((id) => player.skills.includes(id));
  const canLearn = canLearnSkill(skill, player);
  return { learned, prereqLearned, canLearn };
}

function resolveIconColor(learned: boolean, canLearn: boolean, locked: boolean): string {
  if (learned) return SKILL_CARD.iconLearned;
  if (canLearn) return SKILL_CARD.iconAvailable;
  if (locked) return SKILL_CARD.iconLocked;
  return SKILL_CARD.iconDefault;
}

const SkillTreeNode = memo(function SkillTreeNode({
  skill,
  layout,
  player,
  onPress,
}: {
  skill: Skill;
  layout: SkillTreeNodeLayout;
  player: Player;
  onPress: () => void;
}) {
  const t = useT();
  const { learned, prereqLearned, canLearn } = resolveNodeVisualState(skill, player);
  const { left, top } = nodeTopLeft(layout.tier, layout.column);
  const locked = !learned && !prereqLearned;
  const iconSpec = resolveSkillTreeIconSpec(skill.id, skill.category);
  const iconColor = resolveIconColor(learned, canLearn && !learned, locked);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        {
          left,
          top,
          width: NODE_W,
          height: NODE_H,
          opacity: locked ? 0.62 : pressed ? 0.88 : 1,
        },
        learned && styles.nodeLearned,
        canLearn && !learned && styles.nodeAvailable,
        !learned && !canLearn && !locked && styles.nodeLockedSoft,
      ]}
    >
      <View style={styles.iconSlot}>
        <PlanetHubActionIcon spec={iconSpec} size={22} color={iconColor} />
      </View>
      <Text style={[styles.nodeName, learned && styles.nodeNameLearned]} numberOfLines={1}>
        {resolveSkillName(skill, t)}
      </Text>
      <Text style={[styles.nodeLevel, locked && styles.nodeLevelLocked]}>
        {t('skilltree.nodeLevel', { level: skill.levelRequired })}
      </Text>
    </Pressable>
  );
});

export const SkillTreeBoard = memo(function SkillTreeBoard({
  category,
  player,
  onSkillPress,
}: Props) {
  const t = useT();
  const nodes = useMemo(() => listSkillTreeNodesForCategory(category), [category]);
  const edges = useMemo(() => listSkillTreeEdgesForCategory(category), [category]);
  const maxTier = useMemo(() => getMaxSkillTreeTier(category), [category]);

  const boardWidth = BOARD_PAD_H * 2 + COL_W * 3;
  const boardHeight = BOARD_PAD_TOP + maxTier * tierBlockHeight() + SPACING.md;

  const nodeById = useMemo(() => {
    const map = new Map<string, SkillTreeNodeLayout>();
    for (const n of nodes) map.set(n.skillId, n);
    return map;
  }, [nodes]);

  const edgePolylines = useMemo(() => {
    return edges
      .map((edge) => {
        const from = nodeById.get(edge.fromSkillId);
        const to = nodeById.get(edge.toSkillId);
        if (!from || !to) return null;
        const points = buildOrthogonalEdgePoints(from, to);
        if (points.length < 2) return null;
        const learnedPath = player.skills.includes(edge.fromSkillId);
        return {
          key: `${edge.fromSkillId}->${edge.toSkillId}`,
          points: pointsToPolylineAttr(points),
          active: learnedPath,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line != null);
  }, [edges, nodeById, player.skills]);

  const tiers = useMemo(() => {
    const set = new Set(nodes.map((n) => n.tier));
    return [...set].sort((a, b) => a - b);
  }, [nodes]);

  return (
    <View style={[styles.board, { width: boardWidth, minHeight: boardHeight }]}>
      <Svg
        width={boardWidth}
        height={boardHeight}
        style={styles.edgeLayer}
        pointerEvents="none"
      >
        {edgePolylines.map((line) => (
          <Polyline
            key={line.key}
            points={line.points}
            fill="none"
            stroke={line.active ? SKILL_CARD.edgeActive : SKILL_CARD.edgeIdle}
            strokeWidth={line.active ? 2 : 1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </Svg>

      {tiers.map((tier) => (
        <Text
          key={`tier-label-${tier}`}
          style={[
            styles.tierLabel,
            {
              top: tierGeometry(tier).labelTop,
              width: boardWidth,
            },
          ]}
        >
          {t('skilltree.tierLabel', { tier })}
        </Text>
      ))}

      {nodes.map((layout) => {
        const skill = SKILLS[layout.skillId];
        if (!skill) return null;
        return (
          <SkillTreeNode
            key={skill.id}
            skill={skill}
            layout={layout}
            player={player}
            onPress={() => onSkillPress(skill)}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    position: 'relative',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    zIndex: 1,
  },
  edgeLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 0,
  },
  tierLabel: {
    position: 'absolute',
    left: 0,
    height: TIER_LABEL_H,
    lineHeight: TIER_LABEL_H,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: SKILL_CARD.tierInk,
    textAlign: 'center',
    zIndex: 1,
    ...androidTextFix,
  },
  node: {
    position: 'absolute',
    zIndex: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SKILL_CARD.border,
    backgroundColor: SKILL_CARD.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  nodeLearned: {
    borderColor: SKILL_CARD.borderActive,
    backgroundColor: SKILL_CARD.bgLearned,
    borderWidth: 1.5,
  },
  nodeAvailable: {
    borderColor: SKILL_CARD.borderActive,
    backgroundColor: SKILL_CARD.bgAvailable,
  },
  nodeLockedSoft: {
    borderColor: SKILL_CARD.border,
    backgroundColor: SKILL_CARD.bg,
  },
  iconSlot: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  nodeName: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: SKILL_CARD.nameInk,
    textAlign: 'center',
    maxWidth: NODE_W - 8,
    ...androidTextFix,
  },
  nodeNameLearned: {
    color: SKILL_CARD.nameLearnedInk,
    fontWeight: FONTS.weight.bold,
  },
  nodeLevel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: SKILL_CARD.levelInk,
    marginTop: 2,
    ...androidTextFix,
  },
  nodeLevelLocked: {
    color: SKILL_CARD.iconLocked,
  },
});
