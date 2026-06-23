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
import { useT } from '../../src/i18n';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { runTransitCombatPostFlow } from '../../src/game/transitCombat/transitCombatPostFlow';
import { useTransitCombatSessionStore } from '../../src/game/transitCombat/transitCombatSession';
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
import { resolveNpcCapitalShip, getNpcCapitalShip } from '../../src/npc';
import { resolveTransitPirateShipIdFromTables } from '../../src/combat/capitalTransitCombatSeed';
import {
  findFirstIncompleteObjective,
  forEachIncompleteObjective,
  listActiveMissionBundles,
} from '../../src/missions/missionActiveBundles';
import { resolveCombatEnemyCaptain } from '../../src/missions/resolveMissionCombatCaptain';
import {
  CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID,
  CapitalRealtimeCombatHudOverlay,
  CapitalRealtimeCombatOrbitSkia,
  CapitalRealtimeCombatSimBinder,
  useCapitalRealtimeCombatSimContext,
  useCapitalRealtimeDuelOutcome,
} from '../../src/combat';
import { SkiaPlanetNebulaShaderBackdrop } from '../../src/components/planet/SkiaPlanetNebulaShaderBackdrop';
import { usePlanetNebulaStore } from '../../src/store/planetNebulaStore';
import { resolvePlanetNebulaBakedSource } from '../../src/game/planetNebulaBakedAssets';
import { useStageMemory } from '../../src/hooks/useStageMemory';
import { releaseCombatStageMemory } from '../../src/game/stageMemoryRelease';
import { isPlayerShipCombatCapable, resolvePlayerTravelBlock } from '../../src/game/playerSurvivalPod';

/** 성운 Skia 백드롭 — colorDodge 닷지는 성운 픽셀과 동일 캔버스에 그린다 */
function CombatOrbitNebulaBackdrop({
  size,
  planetId,
}: {
  size: number;
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
      active
      nebulaBakedImageSource={nebulaBakedImageSource}
      dodgeHitFxRef={sim?.missileHitFxRef ?? null}
      dodgeTimeMsRef={sim?.tMsRef ?? null}
      dodgeOrbitSize={sim?.orbitSize ?? size}
    />
  );
}

export default function CombatScreen() {
  const t = useT();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const player = usePlayerStore(s => s.player);
  const addExp = usePlayerStore(s => s.addExp);
  const addCredits = usePlayerStore(s => s.addCredits);
  const persist = usePlayerStore(s => s.persist);
  const completeObjective = useMissionStore(s => s.completeObjective);

  const [resolving, setResolving] = useState(false);
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

  const [combatSetup] = useState(() => {
    const bundles = listActiveMissionBundles(useMissionStore.getState().progresses);
    const defeatCtx = findFirstIncompleteObjective(bundles, 'defeat_enemy');
    const playerState = usePlayerStore.getState().player;
    const systemId = playerState?.currentSystemId ?? null;
    const planetId = defeatCtx?.bundle.mission.offerPlanetId ?? playerState?.currentPlanetId ?? null;
    const templateId = defeatCtx?.objective.targetId;
    const templates = Object.values(ENEMY_TEMPLATES);
    const enemyTemplate = templateId && ENEMY_TEMPLATES[templateId]
      ? ENEMY_TEMPLATES[templateId]
      : templates[Math.floor(Math.random() * Math.min(2, templates.length))];
    const captain = resolveCombatEnemyCaptain({
      enemyTemplateId: enemyTemplate.id,
      planetId,
      systemId,
    });
    const transitPirateShipId = captain?.assignedShipId?.trim()
      ?? resolveTransitPirateShipIdFromTables(systemId, {
        enemyTemplateId: enemyTemplate.id,
        planetId,
        systemId,
      });
    return { enemyTemplate, captain, transitPirateShipId };
  });
  const enemyTemplate = combatSetup.enemyTemplate;
  const transitPirateShipId = combatSetup.transitPirateShipId;
  const pirateNpc = useMemo(() => {
    if (!transitPirateShipId) return null;
    return resolveNpcCapitalShip(transitPirateShipId) ?? null;
  }, [transitPirateShipId]);
  const pirateLabel = pirateNpc
    ? `${pirateNpc.name} · ${pirateNpc.captain.displayName}`
    : combatSetup.captain
      ? combatSetup.captain.displayName
      : enemyTemplate.name;

  const finishTransitCombatAndNavigate = useCallback(async (
    postFlow: Parameters<typeof runTransitCombatPostFlow>[0],
  ) => {
    const completed = await runTransitCombatPostFlow(postFlow);
    if (completed) {
      router.replace('/(game)/worldmap');
    }
    setResolving(false);
  }, []);

  const handleVictory = useCallback(async () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setResolving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const destroyedLabels = await usePlayerStore.getState().applyPostCombatDurabilityWear(Date.now());
    const expGain = enemyTemplate.expReward;
    const creditGain = enemyTemplate.creditReward;
    addExp(expGain);
    addCredits(creditGain);
    const bundles = listActiveMissionBundles(useMissionStore.getState().progresses);
    forEachIncompleteObjective(bundles, 'defeat_enemy', (bundle, obj) => {
      if (obj.targetId === enemyTemplate.id) {
        completeObjective(bundle.mission.id, obj.id);
      }
    });
    await persist();
    useTransitCombatSessionStore.getState().commitArrival({
      deliverFailTitle: t('worldmap.deliverFailTitle'),
      deliverFailBody: t('worldmap.deliverFailBody'),
    });
    await finishTransitCombatAndNavigate({
      kind: 'victory',
      enemyName: enemyTemplate.name,
      creditGain,
      expGain,
      destroyedLabels,
    });
  }, [addCredits, addExp, completeObjective, enemyTemplate.creditReward, enemyTemplate.expReward, enemyTemplate.id, enemyTemplate.name, finishTransitCombatAndNavigate, persist, t]);

  const handleDefeat = useCallback(async () => {
    if (resolvedRef.current || !player) return;
    resolvedRef.current = true;
    setResolving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await usePlayerStore.getState().applyPostCombatDurabilityWear(Date.now());
    useTransitCombatSessionStore.getState().clear();
    await usePlayerStore.getState().applyCapitalShipDestruction();
    showArcAlert(
      t('combat.shipDestroyedTitle'),
      t('combat.shipDestroyedBody'),
      [{ text: t('combat.confirm'), onPress: () => router.replace('/(game)/planet') }],
    );
    setResolving(false);
  }, [player, t]);

  const handleFlee = useCallback(async () => {
    if (resolving || resolvedRef.current) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showArcAlert(
      t('combat.fleeTitle'),
      t('combat.fleeBody'),
      [
        { text: t('combat.cancel'), style: 'cancel' },
        {
          text: t('combat.flee'),
          onPress: () => {
            void (async () => {
              if (resolvedRef.current) return;
              resolvedRef.current = true;
              setResolving(true);
              useTransitCombatSessionStore.getState().commitArrival({
                deliverFailTitle: t('worldmap.deliverFailTitle'),
                deliverFailBody: t('worldmap.deliverFailBody'),
              });
              await persist();
              await finishTransitCombatAndNavigate({ kind: 'flee' });
            })();
          },
        },
      ],
    );
  }, [finishTransitCombatAndNavigate, persist, resolving, t]);

  if (!player) return null;
  if (!isPlayerShipCombatCapable(player.ship)) {
    const travelBlock = resolvePlayerTravelBlock(player);
    return (
      <StageShell routeName="combat" background="none" edges={['bottom']}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>
            {travelBlock === 'durability' ? t('combat.durabilityDepletedTitle') : t('combat.cannotFightTitle')}
          </Text>
          <Text style={styles.errorBody}>
            {travelBlock === 'durability' ? t('combat.durabilityDepletedBody') : t('combat.cannotFightBody')}
          </Text>
          <TouchableOpacity style={styles.fleeBtn} onPress={() => router.replace('/(game)/planet')}>
            <Text style={styles.fleeBtnText}>{t('combat.backToPlanet')}</Text>
          </TouchableOpacity>
        </View>
      </StageShell>
    );
  }
  if (!transitPirateShipId || !pirateNpc) {
    return (
      <StageShell routeName="combat" background="none" edges={['bottom']}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>{t('combat.missingDataTitle')}</Text>
          <Text style={styles.errorBody}>
            {t('combat.missingDataBody')}
          </Text>
          <TouchableOpacity style={styles.fleeBtn} onPress={() => router.replace('/(game)/worldmap')}>
            <Text style={styles.fleeBtnText}>{t('combat.backToPlanet')}</Text>
          </TouchableOpacity>
        </View>
      </StageShell>
    );
  }

  return (
    <CapitalRealtimeCombatSimBinder
      orbitSize={orbitSize}
      active={isCombatRouteFocused && !resolving}
      combatPlanetId={isCombatRouteFocused && !resolving ? CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID : null}
      combatSystemId={isCombatRouteFocused && !resolving ? player.currentSystemId : null}
    >
      <StageShell routeName="combat" background="none" edges={['bottom']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('combat.headerTitle')}</Text>
            <Text style={styles.headerSub}>{pirateLabel}</Text>
          </View>
          <TouchableOpacity
            style={[styles.fleeBtn, resolving && styles.fleeBtnDisabled]}
            onPress={handleFlee}
            disabled={resolving}
          >
            <Text style={styles.fleeBtnText}>{t('combat.flee')}</Text>
          </TouchableOpacity>
        </View>

        <QuestHUD />

        <View style={styles.battleStage} onLayout={handleBattleStageLayout}>
          <View style={[styles.orbitWrap, { width: orbitSize, height: orbitSize }]}>
            <CombatOrbitNebulaBackdrop
              size={orbitSize}
              planetId={nebulaPlanetId}
            />
            <CapitalRealtimeCombatOrbitSkia renderMissileDodgeFx={false} />
          </View>
          <View style={styles.hudWrap} pointerEvents="box-none">
            <CapitalRealtimeCombatHudOverlay />
          </View>
        </View>

        <CombatRealtimeBindings onEnemyDefeated={handleVictory} onPlayerDefeated={handleDefeat} />
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
