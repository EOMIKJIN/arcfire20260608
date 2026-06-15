// ============================================================
// 레거시 통합 임시은행 → 수송선단·아크코어 금고 1회 분할
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MIGRATION_STASH_ARC_CORE,
} from '../../store/factionVault/arcCoreVaultStore';
import {
  MIGRATION_STASH_TRANSPORT_FLEET,
} from '../../store/factionVault/arcCoreTransportFleetBankStore';

const LEGACY_STORAGE_KEY = 'arcfire_arc_core_temp_bank_v1';
const MIGRATED_FLAG_KEY = 'arcfire_arc_core_temp_bank_migrated_v2';

type LegacyTxn = { kind?: string; deltaCredits?: number };

export async function migrateLegacyArcCoreTempBankOnce(): Promise<void> {
  const migrated = await AsyncStorage.getItem(MIGRATED_FLAG_KEY);
  if (migrated) return;

  const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(MIGRATED_FLAG_KEY, '1');
    return;
  }

  let fleetNet = 0;
  let arcNet = 0;
  try {
    const parsed = JSON.parse(raw) as {
      balanceCredits?: number;
      txns?: LegacyTxn[];
    };
    const txns = Array.isArray(parsed.txns) ? parsed.txns : [];
    if (txns.length > 0) {
      for (const txn of txns) {
        const delta = Math.floor(Number(txn.deltaCredits) || 0);
        if (txn.kind === 'convoy_profit' || txn.kind === 'convoy_buy') {
          fleetNet += delta;
        } else {
          arcNet += delta;
        }
      }
    } else {
      const balance = Math.floor(Number(parsed.balanceCredits) || 0);
      fleetNet = balance;
    }
  } catch {
    fleetNet = 0;
    arcNet = 0;
  }

  if (fleetNet !== 0) {
    await AsyncStorage.setItem(MIGRATION_STASH_TRANSPORT_FLEET, String(fleetNet));
  }
  if (arcNet !== 0) {
    await AsyncStorage.setItem(MIGRATION_STASH_ARC_CORE, String(arcNet));
  }

  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  await AsyncStorage.setItem(MIGRATED_FLAG_KEY, '1');
}
