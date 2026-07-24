import type { ArcCoreHub } from '../types';
import { AiEconomySubCore } from './AiEconomySubCore';
import { AiNpcSubCore } from './AiNpcSubCore';
import { AiPlanetsSubCore } from './AiPlanetsSubCore';
import { ArcNewsBoardSubCore } from './ArcNewsBoardSubCore';
import { ArcPlanetNebulaSubCore } from './ArcPlanetNebulaSubCore';
import { WorldExpansionSubCore } from './WorldExpansionSubCore';
import { AiAabsSubCore } from './AiAabsSubCore';
import { ArcInboundDroneSubCore } from './ArcInboundDroneSubCore';
import { ArcCoreSpySubCore } from './ArcCoreSpySubCore';
import { ArcCoreAttackSubCore } from './ArcCoreAttackSubCore';
import { ArcCoreDailyOpsSubCore } from './ArcCoreDailyOpsSubCore';
import { ArcCoreTerritorialCombatSubCore } from './ArcCoreTerritorialCombatSubCore';
/**
 * 기본 서브코어 세트 등록 — 판테온 12좌(2026-07-24, `docs/ARC_CORE_SUBCORE_PANTHEON_OPTIMIZATION_PLAN.md`).
 * TradePortLevelPolicy(완전 셸)는 Economy로 흡수돼 미등록, 자리는 Attack(아테나)로 교체 — 등록 수 12 유지.
 * 중복 호출 방지는 허브(`bootstrapDefaultSubCores`)에서 책임진다.
 */
export function registerDefaultArcSubCores(hub: ArcCoreHub): void {
  hub.registerSubCore(new ArcCoreDailyOpsSubCore());
  hub.registerSubCore(new ArcCoreTerritorialCombatSubCore());
  hub.registerSubCore(new AiAabsSubCore());
  hub.registerSubCore(new AiNpcSubCore());
  hub.registerSubCore(new ArcInboundDroneSubCore());
  hub.registerSubCore(new ArcCoreSpySubCore());
  hub.registerSubCore(new AiPlanetsSubCore());
  hub.registerSubCore(new AiEconomySubCore());
  hub.registerSubCore(new ArcCoreAttackSubCore());
  hub.registerSubCore(new ArcNewsBoardSubCore());
  hub.registerSubCore(new ArcPlanetNebulaSubCore());
  hub.registerSubCore(new WorldExpansionSubCore());
}
