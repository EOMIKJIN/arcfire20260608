// ============================================================
// Table-First 부트스트랩 — `1.arcfire_flowchart.md` §1·§6-2
// 앱 시작 시 CSV 기반 Map 인덱스를 1회 워밍(idempotent).
// ============================================================

import { reloadBalanceOverlayIndices } from '../arcCore/aabs/reloadBalanceIndices';
import { listArcNpcTrafficRowsFromTables } from '../arcCore/arcNpcTrafficTableRegistry';
import { ensureItemCatalogLoaded } from '../items/itemCatalogRegistry';
import { listNpcCaptains, listNpcCapitalShips } from '../npc/npcFleetRegistry';
import { warmNearbyOrbitPresenceTableIndexes } from '../npc/nearbyOrbitPresenceSystem';
import { buildPlanetMineralDepositIndex } from '../world/mineralDepositModel';

let bootstrapped = false;

/**
 * 정적 테이블 Map 캐시를 앱 생명주기 동안 1회만 빌드한다.
 * 스테이지 전환·행성 세션 dispose 대상이 아니다.
 */
export function buildCsvStaticIndexes(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  void listNpcCaptains().length;
  void listNpcCapitalShips().length;
  warmNearbyOrbitPresenceTableIndexes();
  void listArcNpcTrafficRowsFromTables().length;
  ensureItemCatalogLoaded();
  void buildPlanetMineralDepositIndex();
  reloadBalanceOverlayIndices();
}

/** 테스트 전용 — 부트스트랩 플래그 초기화 */
export function resetCsvStaticIndexesBootstrapForTests(): void {
  bootstrapped = false;
}
