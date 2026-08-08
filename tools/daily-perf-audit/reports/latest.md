# Daily audit — 2026-08-08T15:00:12.730Z

## TypeScript (`npx tsc --noEmit -p tsconfig.client.json`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/gen-mineral-region-members.mjs && node tools/balance-tables/rebalance-weapon-ttk.mjs && node tools/content-tables/gen-weapon-trade-listing-policy.mjs && node tools/content-tables/sync-weapon-trade-listing.mjs && node tools/content-tables/patch-item-defs-en.mjs && node tools/content-tables/patch-missions-en.mjs && node tools/content-tables/patch-npc-ships-en.mjs && node tools/content-tables/patch-planets-en.mjs && node tools/content-tables/generate-arc-seed-transport-rows.mjs && node tools/content-tables/sync-synth-ownership-into-item-defs.mjs && node tools/content-tables/patch-item-defs-trade-en-full.mjs && node tools/content-tables/sync-star-system-connections-from-planets.mjs && node tools/content-tables/build-content-from-csv.mjs && node tools/content-tables/audit-npc-fleet-master.mjs && node tools/content-tables/audit-mission-quest-placements.mjs

[gen-mineral-region-members] 100 rows
[rebalance-weapon-ttk] updated 0 weapons in weapon_list.csv
weapon_trade_listing_policy: shop=83 excluded_npc_clone=20
tradePortListed sync: canonical=83 TRUE=83 demoted=0
patched D:\arcfire20260607\tables\content\item_defs.csv (287 data rows)
patched missions.csv + mission_objectives.csv
patched 0 npc ship name_en rows
patched planets.csv
[generate-arc-seed-transport-rows] nothing to add — all systems present
[sync-synth-ownership] item_defs.csv — synth ownership up to date
patched rows=0 path=D:\arcfire20260607\tables\content\item_defs.csv
[sync-star-connections] wrote 64 directed edges -> D:\arcfire20260607\tables\content\star_system_connections.csv
Generated CSV-driven content TS files at src/data/generated
[audit:npc-fleet] PASS
  [info] obj_s008_a: vega_base — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용
  [info] obj_s020_a: titan_ruins — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용
=== audit:mission-quest-placements ===
buy_goods objectives: 25
defeat_enemy objectives: 24
placements: 16 · combat_ops: 24
tq_* tavern templates: 22 · tavern planets: 18

PASS — buy_goods/defeat_enemy 배치·tq_* materialize·보상 item 정적 검증 OK
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 662,275 — `src/data/generated/galaxySystems100.generated.ts`
- 477,992 — `src/data/generated/csvNpcCapitalShips.ts`
- 380,493 — `src/data/generated/csvItemDefs.ts`
- 293,391 — `src/data/generated/csvNpcCaptains.ts`
- 200,040 — `src/data/generated/csvNpcCapitalShipEquipSlots.ts`
- 149,162 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 115,935 — `src/data/generated/csvStoryScenes.ts`
- 84,099 — `src/i18n/locales/ko.ts`
- 82,905 — `app/(game)/worldmap.tsx`
- 76,443 — `src/i18n/locales/en.ts`
- 75,372 — `app/(game)/planet.tsx`
- 71,070 — `src/data/generated/csvWeapons.ts`
- 70,149 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 65,404 — `src/data/balance/generated/csvCapitalShipMaxUpgradeValue.ts`
- 60,176 — `src/data/generated/csvMissions.ts`
- 47,324 — `app/(game)/shipyard.tsx`
- 44,314 — `src/components/planet/planetHub/planetHubSubcomponents.tsx`
- 40,043 — `src/arcCore/territorial/runTerritorialCombatPass.ts`

## Planet hub eager `src/combat` import (should be absent)

- OK — no eager combat barrel in `planet.tsx`

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/IdleSessionRestartGuard.tsx`
- `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- `src/components/planet/PlanetMainScanActionRow.tsx`
- `src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx`
- `src/components/shipyard/ShipyardMineralUpgradeTab.tsx`
- `src/game/planetHub/usePlanetHubInterval.ts`
- `src/systems/mining/useMiningDriver.ts`
- `src/ui/overlay/content/PlanetDefenseSatelliteDevContent.tsx`
- `src/ui/overlay/content/PlanetDevelopmentListContent.tsx`
- `src/ui/overlay/content/PlanetGenericFacilityDevContent.tsx`
- `src/ui/overlay/content/PlanetOrbitShipyardDevContent.tsx`
- `app/(game)/planet.tsx`
- `app/(game)/worldmap.tsx`

## `subscribe(` / `addEventListener(` hints (manual cleanup review)

**subscribe**
- `src/arcCore/ArcCoreHub.ts`

**addEventListener**
- `src/arcCore/ArcCoreHub.ts`
- `src/components/IdleSessionRestartGuard.tsx`
- `src/galaxyMap/GalaxyMapContestedZoneRingOverlay.tsx`
- `src/game/nativeReclaim/nativeReclaimBootstrap.ts`
- `app/(game)/planet.tsx`
- `app/(game)/worldmap.tsx`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
