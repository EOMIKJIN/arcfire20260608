# ArcCore Scenario Catalog — balance table spec (v1)

> **정본 CSV**: `tables/balance/arc_core_scenario_catalog.csv` (Phase 3 구현 시 생성)  
> **빌드**: `npm run build:balance-tables`  
> **소비**: `AiScenarioRunnerSubCore` · `npm run sim:scenario`

## 컬럼

| column | type | required | 설명 |
|--------|------|----------|------|
| `scenario_id` | string | Y | PK, snake_case |
| `enabled` | bool | Y | false면 runner skip |
| `archetype` | enum | Y | `economy_loop` · `worldmap_transit` · `combat_transit` · `territorial_1hop` · `hub_idle` |
| `display_name_ko` | string | N | audit 로그용 |
| `seed_captain_id` | string | N | `npc_ai_captains.csv` id |
| `from_system_id` | string | N | `systems.csv` |
| `to_system_id` | string | N | 1-hop 검증용 |
| `planet_id` | string | N | 행성 고정 시 |
| `repeat_budget` | int | Y | headless max iterations (default 1) |
| `shadow_interval_sec` | int | N | shadow mode step 간격 |
| `pass_kpi_json` | json string | Y | e.g. `{"maxEngageSec":45,"minWinRate":0.4}` |
| `notes` | string | N | |

## archetype 동작

| archetype | SubCore | Observation |
|-----------|---------|-------------|
| `economy_loop` | AiEconomySubCore | economy.* |
| `worldmap_transit` | ScenarioRunner + worldStore | scenario.step |
| `combat_transit` | AiCombatTacticsSubCore | combat.tactics_trial |
| `territorial_1hop` | Territorial + graph gate | territorial.pass_result |
| `hub_idle` | AiNpcSubCore | npc.traffic_snapshot |

## 예시 행

```csv
scenario_id,enabled,archetype,display_name_ko,seed_captain_id,from_system_id,to_system_id,planet_id,repeat_budget,shadow_interval_sec,pass_kpi_json,notes
worldmap_sirius_draco_1hop,true,territorial_1hop,시리우스-드라코 1홉,,sirius,draco_nebula,sirius_border,10,,{"holdChangeAllowed":true},strategy doc R1
transit_combat_vega_arcadia,true,combat_transit,베가-아카디아 이동 전투,,vega_outpost,arcadia,,5,,"{"maxEngageSec":40}",
economy_trade_eden_loop,true,economy_loop,에덴 무역 루프,,,,eden_city,20,,"{"minConvoySettlements":1}",
```

---

*Parent: [ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md](../ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md)*
