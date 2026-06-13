// ============================================================
// Table-First 부트스트랩 — `1.arcfire_flowchart.md` §1·§6-2
// 앱 시작 시 CSV 기반 Map 인덱스를 1회 워밍(idempotent).
// Phase 1: minimal(부트) / full(이어하기·행성) 2-tier.
// ============================================================

import { markBootPerf } from './bootPerformance';
import { reloadBalanceOverlayIndices } from '../arcCore/aabs/reloadBalanceIndices';
import { listArcNpcTrafficRowsFromTables } from '../arcCore/arcNpcTrafficTableRegistry';
import { ensureItemCatalogLoaded } from '../items/itemCatalogRegistry';
import { listNpcCaptains, listNpcCapitalShips } from '../npc/npcFleetRegistry';
import { warmNearbyOrbitPresenceTableIndexes } from '../npc/nearbyOrbitPresenceSystem';
import { buildPlanetMineralDepositIndex } from '../world/mineralDepositModel';

let minimalBootstrapped = false;
let fullBootstrapped = false;

/**
 * 부트·타이틀용 경량 tier — NPC·궤도 교통·presence 인덱스만.
 */
export function buildCsvStaticIndexesMinimal(): void {
  if (minimalBootstrapped) return;
  minimalBootstrapped = true;
  markBootPerf('csv_indexes_start', 'minimal');
  void listNpcCaptains().length;
  void listNpcCapitalShips().length;
  warmNearbyOrbitPresenceTableIndexes();
  void listArcNpcTrafficRowsFromTables().length;
  markBootPerf('csv_indexes_end', 'minimal');
}

/**
 * 이어하기·행성 허브 등 — 아이템·광물·밸런스 오버레이 포함 full tier.
 */
export function buildCsvStaticIndexesFull(): void {
  buildCsvStaticIndexesMinimal();
  if (fullBootstrapped) return;
  fullBootstrapped = true;
  markBootPerf('csv_indexes_start', 'full');
  ensureItemCatalogLoaded();
  void buildPlanetMineralDepositIndex();
  reloadBalanceOverlayIndices();
  markBootPerf('csv_indexes_end', 'full');
}

/**
 * 정적 테이블 Map 캐시를 앱 생명주기 동안 1회만 빌드한다.
 * @deprecated 호출부는 `buildCsvStaticIndexesMinimal` 또는 `Full`을 명시한다.
 */
export function buildCsvStaticIndexes(): void {
  buildCsvStaticIndexesFull();
}

/** 테스트 전용 — 부트스트랩 플래그 초기화 */
export function resetCsvStaticIndexesBootstrapForTests(): void {
  minimalBootstrapped = false;
  fullBootstrapped = false;
}
