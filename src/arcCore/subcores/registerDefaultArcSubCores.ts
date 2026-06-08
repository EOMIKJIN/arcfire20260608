import type { ArcCoreHub } from '../types';
import { AiEconomySubCore } from './AiEconomySubCore';
import { AiTradePortLevelPolicySubCore } from './AiTradePortLevelPolicySubCore';
import { AiNpcSubCore } from './AiNpcSubCore';
import { AiPlanetsSubCore } from './AiPlanetsSubCore';
import { ArcNewsBoardSubCore } from './ArcNewsBoardSubCore';
import { ArcPlanetNebulaSubCore } from './ArcPlanetNebulaSubCore';
import { WorldExpansionSubCore } from './WorldExpansionSubCore';
import { AiAabsSubCore } from './AiAabsSubCore';
import { ArcCoreDailyOpsSubCore } from './ArcCoreDailyOpsSubCore';

/**
 * 기본 서브코어 세트 등록.
 * 중복 호출 방지는 허브(`bootstrapDefaultSubCores`)에서 책임진다.
 */
export function registerDefaultArcSubCores(hub: ArcCoreHub): void {
  hub.registerSubCore(new ArcCoreDailyOpsSubCore());
  hub.registerSubCore(new AiAabsSubCore());
  hub.registerSubCore(new AiNpcSubCore());
  hub.registerSubCore(new AiPlanetsSubCore());
  hub.registerSubCore(new AiEconomySubCore());
  hub.registerSubCore(new AiTradePortLevelPolicySubCore());
  hub.registerSubCore(new ArcNewsBoardSubCore());
  hub.registerSubCore(new ArcPlanetNebulaSubCore());
  hub.registerSubCore(new WorldExpansionSubCore());
}
