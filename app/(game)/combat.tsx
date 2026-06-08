// ============================================================
// 아크파이어 온라인 — 이동중 전투 (`/(game)/combat`)
// - 은하 지도 이동 후 랜덤 만남(강제) 전용. 행성 착륙(`planet`) 궤도 CSV 전투와 분리.
// - 시뮬 엔진은 `PlanetEdenRaidTestLayer` 공용 — 무장(`equipSlots`)·미사일 모듈·명중 닷지(Skia 성운)까지 메인 스테이지 궤도와 동일 세트.
// - 함대 시드만 `CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID`(1:1 해적·플레이어 기함).
// ============================================================

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, type LayoutChangeEvent,
} from 'react-native';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { RewardModal } from '../../src/components/RewardModal';
import { QuestHUD } from '../../src/components/QuestHUD';
import { StageShell } from '../../src/stages/StageShell';
import {
  PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
  PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
  PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
} from '../../src/stages/planetMainStageLayout';
import { usePlayerStore } from '../../src/store/playerStore';
import { useMissionStore } from '../../src/store/missionStore';
import { ENEMY_TEMPLATES } from '../../src/data/d20tables';
import { NPC_CAPTAINS_FROM_CSV } from '../../src/data/generated';
import {
  CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID,
  CapitalRealtimeCombatHudOverlay,
  CapitalRealtimeCombatOrbitSvg,
  CapitalRealtimeCombatSimBinder,
  useCapitalRealtimeCombatSimContext,
  useCapitalRealtimeDuelOutcome,
} from '../../src/combat';
import { resolveNpcCapitalShip } from '../../src/npc';
import { SkiaPlanetNebulaShaderBackdrop } from '../../src/components/planet/SkiaPlanetNebulaShaderBackdrop';
import { usePlanetNebulaStore } from '../../src/store/planetNebulaStore';
import { resolvePlanetNebulaBakedSource } from '../../src/game/planetNebulaBakedAssets';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { releaseCombatStageMemory } from '../../src/game/stageMemoryRelease';

/** `CapitalRealtimeCombatSimBinder` 내부 — 시뮬 ref로 메인과 동일한 미사일 폭발 colorDodge 연출 */
function CombatOrbitNebulaBackdrop({
  size,
  active,
  planetId,
}: {
  size: number;
  active: boolean;
  planetId: string;
}) {
  const sim = useCapitalRealtimeCombatSimContext();
  const nebulaBakedImageSource = useMemo(
    () => resolvePlanetNebulaBakedSource(planetId),
    [planetId],
  );
  return (
    <SkiaPlanetNebulaShaderBackdrop
      size={size}
      active={active}
      nebulaBakedImageSource={nebulaBakedImageSource}
      dodgeHitFxRef={sim?.missileHitFxRef ?? null}
      dodgeTimeMsRef={sim?.tMsRef ?? null}
      dodgeOrbitSize={sim?.orbitSize ?? size}
    />
  );
}

function resolveTransitPirateShipIdFromTables(): string | null {
  const pirateCaptain = NPC_CAPTAINS_FROM_CSV.find((captain) => {
    if (captain.factionId !== 'pirates') return false;
    if (!captain.assignedShipId || !captain.assignedShipId.trim()) return false;
    if (!resolveNpcCapitalShip(captain.assignedShipId.trim())) return false;
    // 이동중 전투는 실전 함장 우선
    return captain.operationalState === 'combat' || captain.operationalState === 'general';
  });
  return pirateCaptain?.assignedShipId?.trim() ?? null;
}

export default function CombatScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const player = usePlayerStore(s => s.player);
  const updateShip = usePlayerStore(s => s.updateShip);
  const addExp = usePlayerStore(s => s.addExp);
  const addCredits = usePlayerStore(s => s.addCredits);
  const levelUpPending = usePlayerStore(s => s.levelUpPending);
  const clearLevelUp = usePlayerStore(s => s.clearLevelUp);
  const persist = usePlayerStore(s => s.persist);
  const getActiveMission = useMissionStore(s => s.getActiveMission);
  const completeObjective = useMissionStore(s => s.completeObjective);

  const [showReward, setShowReward] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [reward, setReward] = useState({ credits: 0, exp: 0 });
  const resolvedRef = useRef(false);
  const [isCombatRouteFocused, setIsCombatRouteFocused] = useState(() => navigation.isFocused());
  const windowOrbitSize = useMemo(() => Math.max(220, Math.floor(width)), [width]);
  const [battleStageWidth, setBattleStageWidth] = useState(windowOrbitSize);
  const orbitSize = useMemo(() => Math.max(220, Math.floor(battleStageWidth)), [battleStageWidth]);
  const nebulaPlanetId = player?.currentPlanetId ?? '';
  const ensureNebulaProfileForPlanet = usePlanetNebulaStore((s) => s.ensureProfileForPlanet);

  useStageMemory(
    'combat_transit',
    () => {},
    () => {
      releaseCombatStageMemory();
    },
  );

  useFocusEffect(
    useCallback(() => {
      setIsCombatRouteFocused(true);
      return () => setIsCombatRouteFocused(false);
    }, []),
  );

  React.useEffect(() => {
    if (!nebulaPlanetId) return;
    ensureNebulaProfileForPlanet(nebulaPlanetId);
  }, [ensureNebulaProfileForPlanet, nebulaPlanetId]);

  const handleBattleStageLayout = useCallback((event: LayoutChangeEvent) => {
    const measuredWidth = Math.max(220, Math.floor(event.nativeEvent.layout.width));
    setBattleStageWidth(prev => (prev === measuredWidth ? prev : measuredWidth));
  }, []);

  const [enemyTemplate] = useState(() => {
    const active = useMissionStore.getState().getActiveMission();
    const targetObjective = active?.mission.objectives.find(
      (obj) => obj.type === 'defeat_enemy' && !active.progress.objectives[obj.id],
    );
    if (targetObjective?.targetId && ENEMY_TEMPLATES[targetObjective.targetId]) {
      return ENEMY_TEMPLATES[targetObjective.targetId];
    }
    const templates = Object.values(ENEMY_TEMPLATES);
    return templates[Math.floor(Math.random() * Math.min(2, templates.length))];
  });
  const transitPirateShipId = useMemo(
    () => resolveTransitPirateShipIdFromTables(),
    [],
  );
  const pirateNpc = useMemo(() => {
    if (!transitPirateShipId) return null;
    return resolveNpcCapitalShip(transitPirateShipId) ?? null;
  }, [transitPirateShipId]);
  const pirateLabel = pirateNpc ? `${pirateNpc.name} · ${pirateNpc.captain.displayName}` : enemyTemplate.name;

  const handleVictory = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setResolving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const expGain = enemyTemplate.expReward;
    const creditGain = enemyTemplate.creditReward;
    addExp(expGain);
    addCredits(creditGain);
    const active = getActiveMission();
    if (active) {
      active.mission.objectives.forEach(obj => {
        if (obj.type === 'defeat_enemy' && obj.targetId === enemyTemplate.id && !active.progress.objectives[obj.id]) {
          completeObjective(active.mission.id, obj.id);
        }
      });
    }
    await persist();
    setReward({ credits: creditGain, exp: expGain });
    setShowReward(true);
    setResolving(false);
  }, [addCredits, addExp, completeObjective, enemyTemplate.creditReward, enemyTemplate.expReward, enemyTemplate.id, getActiveMission, persist]);

  const handleDefeat = useCallback(async () => {
    if (resolvedRef.current || !player) return;
    resolvedRef.current = true;
    setResolving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    updateShip({ ...player.ship, hp: 1 });
    await persist();
    showArcAlert(
      '전투 패배',
      '함선이 심각한 손상을 입었습니다.\n가장 가까운 행성으로 귀환합니다.',
      [{ text: '귀환', onPress: () => router.replace('/(game)/planet') }],
    );
    setResolving(false);
  }, [persist, player, updateShip]);

  const handleFlee = useCallback(async () => {
    if (resolving) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showArcAlert(
      '도주',
      '전투를 포기하고 도주하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '도주', onPress: () => router.replace('/(game)/worldmap') },
      ],
    );
  }, [resolving]);

  const handleRewardClose = useCallback(() => {
    setShowReward(false);
    clearLevelUp();
    router.replace('/(game)/worldmap');
  }, [clearLevelUp]);

  if (!player) return null;
  if (!transitPirateShipId || !pirateNpc) {
    return (
      <StageShell routeName="combat" background="none" edges={['bottom']}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>전투 데이터 누락</Text>
          <Text style={styles.errorBody}>
            이동중 전투용 해적 전함 테이블 참조를 찾지 못했습니다.
          </Text>
          <TouchableOpacity style={styles.fleeBtn} onPress={() => router.replace('/(game)/worldmap')}>
            <Text style={styles.fleeBtnText}>행성으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </StageShell>
    );
  }

  return (
    <CapitalRealtimeCombatSimBinder
      orbitSize={orbitSize}
      active={isCombatRouteFocused}
      combatPlanetId={isCombatRouteFocused ? CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID : null}
      combatSystemId={isCombatRouteFocused ? player.currentSystemId : null}
    >
      <StageShell routeName="combat" background="none" edges={['bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>⚔ 이동중 전투</Text>
            <Text style={styles.headerSub}>{pirateLabel}</Text>
          </View>
          <TouchableOpacity
            style={[styles.fleeBtn, resolving && styles.fleeBtnDisabled]}
            onPress={handleFlee}
            disabled={resolving}
          >
            <Text style={styles.fleeBtnText}>도주</Text>
          </TouchableOpacity>
        </View>

        <QuestHUD />

        <View style={styles.battleStage} onLayout={handleBattleStageLayout}>
          <View style={[styles.orbitWrap, { width: orbitSize, height: orbitSize }]}>
            <CombatOrbitNebulaBackdrop
              size={orbitSize}
              active={isCombatRouteFocused}
              planetId={nebulaPlanetId}
            />
            <CapitalRealtimeCombatOrbitSvg />
          </View>
          <View style={styles.hudWrap} pointerEvents="box-none">
            <CapitalRealtimeCombatHudOverlay />
          </View>
        </View>

        <CombatRealtimeBindings onEnemyDefeated={handleVictory} onPlayerDefeated={handleDefeat} />

        {showReward ? (
          <RewardModal
            visible={showReward}
            reward={{ credits: reward.credits, exp: reward.exp }}
            missionTitle={`${enemyTemplate.name} 격파`}
            leveledUp={levelUpPending}
            newLevel={player.level}
            onClose={handleRewardClose}
          />
        ) : null}
      </StageShell>
    </CapitalRealtimeCombatSimBinder>
  );
}

function CombatRealtimeBindings({ onEnemyDefeated, onPlayerDefeated }: {
  onEnemyDefeated: () => void;
  onPlayerDefeated: () => void;
}) {
  const sim = useCapitalRealtimeCombatSimContext();
  useCapitalRealtimeDuelOutcome(sim, onEnemyDefeated, onPlayerDefeated);
  return null;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,
    paddingVertical: PLANET_MAIN_TOPBAR_PADDING_VERTICAL,
    borderBottomWidth: PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg_panel,
  },
  headerTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    marginTop: 2,
  },
  fleeBtn: {
    borderWidth: 1,
    borderColor: COLORS.pvp_zone,
    borderRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.bg_panel,
  },
  fleeBtnDisabled: {
    opacity: 0.45,
  },
  fleeBtnText: {
    fontFamily: FONTS.mono,
    color: COLORS.pvp_zone,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  battleStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: SPACING.md,
  },
  orbitWrap: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,12,22,0.55)',
  },
  hudWrap: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    rowGap: SPACING.md,
  },
  errorTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.danger,
    fontWeight: FONTS.weight.bold,
  },
  errorBody: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
    textAlign: 'center',
  },
});
