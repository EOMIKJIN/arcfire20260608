import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS } from '../arcCore/worldExpansionConstants';
import {
  purgeArcExpansionTestHarnessStorage,
  resetArcExpansionTestHarnessMemory,
} from '../arcCore/arcCoreExpansionTestFlags';
import { isDevHarnessAllowed } from './gameplayModeContract';

const INSTALL_MARKER_KEY = 'arcfire_production_boot_install_v1';

/** worldStore와 동일 키 — loadLocalWorld 이전 sanitize 전용 */
export const WORLD_PERSIST_STORAGE_KEY = 'arcfire_world_v1';

function readInstallFingerprint(): string {
  const version = Constants.expoConfig?.version ?? '0.0.0';
  const nativeBuild =
    Constants.nativeBuildVersion
    ?? String(
      Constants.expoConfig?.android?.versionCode
        ?? Constants.expoConfig?.ios?.buildNumber
        ?? '0',
    );
  return `${version}+${nativeBuild}`;
}

function normalizeSynthSystemId(id: string): string {
  if (!id.startsWith('synth_')) return id;
  const raw = id.slice('synth_'.length);
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return id;
  return `synth_${String(n).padStart(3, '0')}`;
}

const BLOCKED_LEGACY_GUARANTEED = new Set(
  ARC_CORE_LEGACY_GUARANTEED_SYSTEM_IDS.map(normalizeSynthSystemId),
);

async function sanitizePersistedWorldForProduction(isFirstInstallForFingerprint: boolean): Promise<void> {
  if (isDevHarnessAllowed()) return;

  try {
    const raw = await AsyncStorage.getItem(WORLD_PERSIST_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as {
      unlockedSystemIds?: string[];
      visitedSystemIds?: string[];
      lastExpansionAtMs?: number | null;
    };

    const unlocked = (parsed.unlockedSystemIds ?? []).map(normalizeSynthSystemId);
    const hasBlocked = unlocked.some((id) => BLOCKED_LEGACY_GUARANTEED.has(id));
    if (!hasBlocked) return;

    // 레거시 부트 시드(lastExpansion 없음) 또는 설치 지문 최초 — 테스트 잔재 제거
    const shouldStrip =
      isFirstInstallForFingerprint ||
      parsed.lastExpansionAtMs == null;

    if (!shouldStrip) return;

    const nextUnlocked = unlocked.filter((id) => !BLOCKED_LEGACY_GUARANTEED.has(id));
    const nextVisited = (parsed.visitedSystemIds ?? [])
      .map(normalizeSynthSystemId)
      .filter((id) => !BLOCKED_LEGACY_GUARANTEED.has(id));

    await AsyncStorage.setItem(
      WORLD_PERSIST_STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        unlockedSystemIds: nextUnlocked,
        visitedSystemIds: nextVisited.length ? nextVisited : ['arcadia'],
      }),
    );
  } catch {
    /* ignore */
  }
}

export type ProductionBootResult = {
  installFingerprint: string;
  isFirstInstallForFingerprint: boolean;
  devHarness: boolean;
};

let lastBootResult: ProductionBootResult | null = null;

export function getLastProductionBootResult(): ProductionBootResult | null {
  return lastBootResult;
}

/**
 * AsyncStorage world/player load 이전 1회.
 * 릴리스·운영 경로에서 테스트 하네스 잔재를 제거한다.
 */
export async function runProductionBootBootstrap(): Promise<ProductionBootResult> {
  const installFingerprint = readInstallFingerprint();
  let isFirstInstallForFingerprint = false;

  try {
    const prev = await AsyncStorage.getItem(INSTALL_MARKER_KEY);
    isFirstInstallForFingerprint = prev !== installFingerprint;
    if (isFirstInstallForFingerprint) {
      await AsyncStorage.setItem(INSTALL_MARKER_KEY, installFingerprint);
    }
  } catch {
    isFirstInstallForFingerprint = true;
  }

  if (!isDevHarnessAllowed()) {
    resetArcExpansionTestHarnessMemory();
    await purgeArcExpansionTestHarnessStorage();
    await sanitizePersistedWorldForProduction(isFirstInstallForFingerprint);
  }

  lastBootResult = {
    installFingerprint,
    isFirstInstallForFingerprint,
    devHarness: isDevHarnessAllowed(),
  };
  return lastBootResult;
}
