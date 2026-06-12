import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { PlanetHubActionTile } from './PlanetHubActionTile';
import { PlanetHubActionGaugeSlot } from './PlanetHubActionGaugeSlot';
import { PLANET_MAIN_SCAN_MENU_GAP_PX } from '../../stages/planetMainStageLayout';
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
  scanEnabled?: boolean;
  actionsUnlocked?: boolean;
  miningLabel: string;
  miningDisabled?: boolean;
  miningPrimary?: boolean;
  dialogDisabled?: boolean;
  searchDisabled?: boolean;
  onScanComplete?: () => void;
  /** 수색 게이지 완료 후 호출(회수·알림 등) */
  onSearchComplete?: () => void;
  onPressMining: () => void;
  onPressDialog: () => void;
};

export const PlanetMainScanActionRow = memo(function PlanetMainScanActionRow({
  layout = 'dock',
  planetId,
  scanEnabled = true,
  actionsUnlocked: actionsUnlockedProp = false,
  miningLabel,
  miningDisabled = false,
  miningPrimary = false,
  dialogDisabled = false,
  searchDisabled = false,
  onScanComplete,
  onSearchComplete,
  onPressMining,
  onPressDialog,
}: Props) {
  const [scanPhase, setScanPhase] = useState<PlanetScanPhase>(actionsUnlockedProp ? 'complete' : 'idle');
  const [gaugeKind, setGaugeKind] = useState<PlanetHubGaugeActivityKind | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const prevPlanetIdRef = useRef<string | null>(null);
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
  const gaugeActive = gaugeKind !== null;

  useEffect(() => {
    if (actionsUnlockedProp) {
      setScanPhase('complete');
    }
  }, [actionsUnlockedProp]);

  /** 최초 마운트가 아닌 행성 전환 시에만 잠금으로 초기화 */
  useEffect(() => {
    if (prevPlanetIdRef.current === planetId) return;
    const isPlanetChange = prevPlanetIdRef.current !== null;
    prevPlanetIdRef.current = planetId;
    if (!isPlanetChange) return;
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

  const handlePressScan = useCallback(() => {
    if (!scanEnabled || actionsUnlocked || gaugeActive) return;
    startGaugeActivity('scan', randomDurationMs(SCAN_DURATION_MIN_MS, SCAN_DURATION_MAX_MS), () => {
      setScanPhase('complete');
      onScanComplete?.();
    });
  }, [
    scanEnabled,
    actionsUnlocked,
    gaugeActive,
    startGaugeActivity,
    onScanComplete,
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
      ? `스캔 진행 ${progressPct}%`
      : gaugeKind === 'search'
        ? `수색 진행 ${progressPct}%`
        : undefined;

  return (
    <View style={[styles.root, layout === 'dock' ? styles.rootDock : styles.rootScroll]}>
      <PlanetHubActionGaugeSlot
        visible={gaugeActive}
        progressPct={progressPct}
        accessibilityLabel={gaugeAccessibilityLabel}
      />
      <View style={styles.row}>
        <View style={styles.tileSlot}>
          <PlanetHubActionTile
            label={gaugeKind === 'scan' ? '스캔 중' : '스캔'}
            icon={gaugeKind === 'scan' ? '⟦═⟧' : '⟦ ◇ ⟧'}
            onPress={handlePressScan}
            disabled={!scanEnabled || actionsUnlocked || gaugeActive}
            active={gaugeKind === 'scan'}
          />
        </View>
        <View style={styles.secondaryGroup}>
          <View style={styles.tileSlot}>
            <PlanetHubActionTile
              label={miningLabel}
              icon="⛏"
              onPress={handlePressMining}
              disabled={secondaryDisabled || miningDisabled}
              primary={miningPrimary}
            />
          </View>
          <View style={styles.tileSlot}>
            <PlanetHubActionTile
              label="대화"
              icon="💬"
              onPress={handlePressDialog}
              disabled={secondaryDisabled || dialogDisabled}
            />
          </View>
          <View style={styles.tileSlot}>
            <PlanetHubActionTile
              label={gaugeKind === 'search' ? '수색 중' : '수색'}
              icon="🔍"
              onPress={handlePressSearch}
              disabled={secondaryDisabled || searchDisabled}
              active={gaugeKind === 'search'}
            />
          </View>
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
  secondaryGroup: {
    flex: 3,
    flexDirection: 'row',
    columnGap: SPACING.sm,
  },
  tileSlot: {
    flex: 1,
  },
});
