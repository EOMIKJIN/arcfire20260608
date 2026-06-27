import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { isDefenseSatelliteInstalledDetail } from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';
import type { PlanetDefenseSatelliteDetail } from '../../store/planetCoreMetricTypes';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { presentPlanetEconomyInfoOverlay, presentPlanetDevelopmentOverlay } from '../../ui/overlay/arcOverlayStore';
import { useHeavyUiPlanetHubAction } from '../../ui/heavyUiDataSession';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { PlanetHubActionTile } from './PlanetHubActionTile';
import { PLANET_HUB_ACTION_ICONS } from '../../ui/tactical/planetHubActionIcons';
import { PlanetHubScanActionRevealSlot } from './PlanetHubScanActionRevealSlot';
import { PlanetHubActionGaugeSlot } from './PlanetHubActionGaugeSlot';
import { PLANET_MAIN_SCAN_MENU_GAP_PX } from '../../stages/planetMainStageLayout';
import { PLANET_MAIN_SCAN_ROW_PLANET_INFO_TILE_ENABLED } from '../../game/planetHub/planetHubConstants';
import { useT } from '../../i18n';
import { SPACING } from '../../utils/theme';

const SCAN_DURATION_MIN_MS = 5000;
const SCAN_DURATION_MAX_MS = 10000;
const SEARCH_DURATION_MIN_MS = 5000;
const SEARCH_DURATION_MAX_MS = 9000;

export type PlanetScanPhase = 'idle' | 'complete';

/** 게이지 슬롯에 표시되는 진행 종류 — 추후 채굴·대화 등 확장 */
export type PlanetHubGaugeActivityKind = 'scan' | 'search';

function randomDurationMs(minMs: number, maxMs: number): number {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

type Props = {
  /** `dock` — 하단 도크(무역소 메뉴 바로 위 5px) */
  layout?: 'dock' | 'scroll';
  planetId: string | null;
  planetName?: string | null;
  scanEnabled?: boolean;
  actionsUnlocked?: boolean;
  miningLabel: string;
  miningDisabled?: boolean;
  miningPrimary?: boolean;
  dialogDisabled?: boolean;
  searchDisabled?: boolean;
  onScanComplete?: () => void;
  /** 스캔 재누름 — 액션 접힘·잠금(채굴 등 부모 정리) */
  onScanReset?: () => void;
  /** 수색 게이지 완료 후 호출(회수·알림 등) */
  onSearchComplete?: () => void;
  onPressMining: () => void;
  onPressDialog: () => void;
};

export const PlanetMainScanActionRow = memo(function PlanetMainScanActionRow({
  layout = 'dock',
  planetId,
  planetName,
  scanEnabled = true,
  actionsUnlocked: actionsUnlockedProp = false,
  miningLabel,
  miningDisabled = false,
  miningPrimary = false,
  dialogDisabled = false,
  searchDisabled = false,
  onScanComplete,
  onScanReset,
  onSearchComplete,
  onPressMining,
  onPressDialog,
}: Props) {
  const t = useT();
  const [scanPhase, setScanPhase] = useState<PlanetScanPhase>(actionsUnlockedProp ? 'complete' : 'idle');
  const [gaugeKind, setGaugeKind] = useState<PlanetHubGaugeActivityKind | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const prevPlanetIdRef = useRef<string | null>(null);
  const revealViaScanRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearGaugeTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const actionsUnlocked = actionsUnlockedProp || scanPhase === 'complete';
  /** 행성 재진입(이미 스캔됨)만 즉시 표시 — 이번 세션 스캔 완료는 pop 애니메이션 */
  const revealInstant = actionsUnlockedProp && !revealViaScanRef.current;
  const gaugeActive = gaugeKind !== null;

  useEffect(() => {
    setScanPhase(actionsUnlockedProp ? 'complete' : 'idle');
    if (!actionsUnlockedProp) {
      revealViaScanRef.current = false;
    }
  }, [actionsUnlockedProp]);

  /** 최초 마운트가 아닌 행성 전환 시에만 잠금으로 초기화 */
  useEffect(() => {
    if (prevPlanetIdRef.current === planetId) return;
    const isPlanetChange = prevPlanetIdRef.current !== null;
    prevPlanetIdRef.current = planetId;
    if (!isPlanetChange) return;
    revealViaScanRef.current = false;
    setScanPhase('idle');
    setGaugeKind(null);
    setProgressPct(0);
    clearGaugeTimers();
  }, [planetId, clearGaugeTimers]);

  useEffect(() => {
    if (!planetId) return undefined;
    const token = registerPlanetSessionResource({
      ownerId: 'planet_main_scan_action_row',
      planetId,
      dispose: clearGaugeTimers,
    });
    return () => token.release();
  }, [planetId, clearGaugeTimers]);

  const startGaugeActivity = useCallback((
    kind: PlanetHubGaugeActivityKind,
    durationMs: number,
    onDone: () => void,
  ) => {
    clearGaugeTimers();
    setGaugeKind(kind);
    setProgressPct(0);
    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(1, elapsed / durationMs);
      setProgressPct(Math.round(ratio * 100));
    }, 80);
    completeTimerRef.current = setTimeout(() => {
      clearGaugeTimers();
      setProgressPct(100);
      setGaugeKind(null);
      onDone();
    }, durationMs);
  }, [clearGaugeTimers]);

  const handlePressPlanetDevelopment = useHeavyUiPlanetHubAction(planetId, () => {
    if (!actionsUnlocked || gaugeActive) return;
    presentPlanetDevelopmentOverlay(planetId!, planetName?.trim() || planetId!, 'list');
  });

  const defenseSatelliteInstalled = usePlanetCoreRuntimeStore((s) => {
    if (!planetId) return false;
    const detail = s.byPlanetId[planetId]?.detail;
    const fromModule = detail?.development?.byModuleId?.defense_satellite;
    if (fromModule && typeof fromModule === 'object' && (fromModule as PlanetDefenseSatelliteDetail).version === 1) {
      return isDefenseSatelliteInstalledDetail(fromModule as PlanetDefenseSatelliteDetail);
    }
    return isDefenseSatelliteInstalledDetail(detail?.defenseSatellite);
  });

  const planetDevelopmentIcon = defenseSatelliteInstalled
    ? PLANET_HUB_ACTION_ICONS.planetDevSatellite
    : PLANET_HUB_ACTION_ICONS.planetDev;

  const handlePressPlanetInfo = useHeavyUiPlanetHubAction(planetId, () => {
    if (gaugeActive) return;
    presentPlanetEconomyInfoOverlay(planetId!, planetName?.trim() || planetId!);
  });

  const handlePressScan = useCallback(() => {
    if (!scanEnabled || gaugeActive) return;
    if (actionsUnlocked) {
      revealViaScanRef.current = false;
      setScanPhase('idle');
      onScanReset?.();
      return;
    }
    startGaugeActivity('scan', randomDurationMs(SCAN_DURATION_MIN_MS, SCAN_DURATION_MAX_MS), () => {
      revealViaScanRef.current = true;
      setScanPhase('complete');
      onScanComplete?.();
    });
  }, [
    scanEnabled,
    actionsUnlocked,
    gaugeActive,
    startGaugeActivity,
    onScanComplete,
    onScanReset,
  ]);

  const handlePressSearch = useCallback(() => {
    if (!actionsUnlocked || searchDisabled || gaugeActive) return;
    startGaugeActivity('search', randomDurationMs(SEARCH_DURATION_MIN_MS, SEARCH_DURATION_MAX_MS), () => {
      onSearchComplete?.();
    });
  }, [actionsUnlocked, searchDisabled, gaugeActive, startGaugeActivity, onSearchComplete]);

  const handlePressDialog = useCallback(() => {
    if (!actionsUnlocked || dialogDisabled || gaugeActive) return;
    onPressDialog();
  }, [actionsUnlocked, dialogDisabled, gaugeActive, onPressDialog]);

  const handlePressMining = useCallback(() => {
    if (!actionsUnlocked || miningDisabled || gaugeActive) return;
    onPressMining();
  }, [actionsUnlocked, miningDisabled, gaugeActive, onPressMining]);

  const secondaryDisabled = !actionsUnlocked || gaugeActive;

  const gaugeAccessibilityLabel =
    gaugeKind === 'scan'
      ? t('scanRow.scanProgress', { pct: progressPct })
      : gaugeKind === 'search'
        ? t('scanRow.searchProgress', { pct: progressPct })
        : undefined;

  return (
    <View style={[styles.root, layout === 'dock' ? styles.rootDock : styles.rootScroll]}>
      <PlanetHubActionGaugeSlot
        visible={gaugeActive}
        progressPct={progressPct}
        accessibilityLabel={gaugeAccessibilityLabel}
      />
      <View style={styles.row}>
        <View style={styles.leftColumn}>
          {PLANET_MAIN_SCAN_ROW_PLANET_INFO_TILE_ENABLED ? (
            <PlanetHubActionTile
              label={t('scanRow.planetInfo')}
              icon={PLANET_HUB_ACTION_ICONS.planetInfo}
              onPress={handlePressPlanetInfo}
              disabled={!planetId || gaugeActive}
            />
          ) : null}
          <PlanetHubScanActionRevealSlot
            revealed={actionsUnlocked}
            instant={revealInstant}
            axis="vertical"
            staggerIndex={0}
          >
            <PlanetHubActionTile
              label={t('scanRow.planetDev')}
              icon={planetDevelopmentIcon}
              onPress={handlePressPlanetDevelopment}
              disabled={!actionsUnlocked || !planetId || gaugeActive}
            />
          </PlanetHubScanActionRevealSlot>
        </View>
        <View style={styles.topRightSpacer} />
      </View>
      <View style={styles.row}>
        <View style={styles.tileSlot}>
          <PlanetHubActionTile
            label={gaugeKind === 'scan' ? t('scanRow.scanning') : t('scanRow.scan')}
            icon={PLANET_HUB_ACTION_ICONS.scan}
            onPress={handlePressScan}
            disabled={!scanEnabled || gaugeActive}
            active={gaugeKind === 'scan' || actionsUnlocked}
          />
        </View>
        <View style={styles.secondaryGroup}>
          <PlanetHubScanActionRevealSlot
            revealed={actionsUnlocked}
            instant={revealInstant}
            axis="horizontal"
            staggerIndex={0}
            hideStaggerIndex={2}
            style={styles.tileSlot}
          >
            <PlanetHubActionTile
              label={miningLabel}
              icon={PLANET_HUB_ACTION_ICONS.mining}
              onPress={handlePressMining}
              disabled={secondaryDisabled || miningDisabled}
              primary={miningPrimary}
            />
          </PlanetHubScanActionRevealSlot>
          <PlanetHubScanActionRevealSlot
            revealed={actionsUnlocked}
            instant={revealInstant}
            axis="horizontal"
            staggerIndex={1}
            hideStaggerIndex={1}
            style={styles.tileSlot}
          >
            <PlanetHubActionTile
              label={t('scanRow.dialog')}
              icon={PLANET_HUB_ACTION_ICONS.dialog}
              onPress={handlePressDialog}
              disabled={secondaryDisabled || dialogDisabled}
            />
          </PlanetHubScanActionRevealSlot>
          <PlanetHubScanActionRevealSlot
            revealed={actionsUnlocked}
            instant={revealInstant}
            axis="horizontal"
            staggerIndex={2}
            hideStaggerIndex={0}
            style={styles.tileSlot}
          >
            <PlanetHubActionTile
              label={gaugeKind === 'search' ? t('scanRow.searching') : t('scanRow.search')}
              icon={PLANET_HUB_ACTION_ICONS.search}
              onPress={handlePressSearch}
              disabled={secondaryDisabled || searchDisabled}
              active={gaugeKind === 'search'}
            />
          </PlanetHubScanActionRevealSlot>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingHorizontal: SPACING.md,
    rowGap: 4,
  },
  rootDock: {
    marginTop: 0,
    marginBottom: PLANET_MAIN_SCAN_MENU_GAP_PX,
  },
  rootScroll: {
    marginTop: -30,
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    columnGap: SPACING.sm,
  },
  leftColumn: {
    flex: 1,
    rowGap: 4,
  },
  topRightSpacer: {
    flex: 3,
  },
  secondaryGroup: {
    flex: 3,
    flexDirection: 'row',
    columnGap: SPACING.sm,
    alignItems: 'stretch',
  },
  tileSlot: {
    flex: 1,
  },
});
