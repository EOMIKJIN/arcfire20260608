# Daily audit — 2026-06-28T15:00:08.428Z

## TypeScript (`npx tsc --noEmit -p tsconfig.client.json`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/gen-mineral-region-members.mjs && node tools/balance-tables/rebalance-weapon-ttk.mjs && node tools/content-tables/gen-weapon-trade-listing-policy.mjs && node tools/content-tables/sync-weapon-trade-listing.mjs && node tools/content-tables/patch-item-defs-en.mjs && node tools/content-tables/patch-missions-en.mjs && node tools/content-tables/patch-npc-ships-en.mjs && node tools/content-tables/patch-planets-en.mjs && node tools/content-tables/generate-arc-seed-transport-rows.mjs && node tools/content-tables/build-content-from-csv.mjs && node tools/content-tables/audit-npc-fleet-master.mjs && node tools/content-tables/audit-mission-quest-placements.mjs

[gen-mineral-region-members] 100 rows
[rebalance-weapon-ttk] updated 0 weapons in weapon_list.csv
weapon_trade_listing_policy: shop=83 excluded_npc_clone=20
tradePortListed sync: canonical=83 TRUE=83 demoted=0
patched D:\arcfire20260607\tables\content\item_defs.csv (196 data rows)
patched missions.csv + mission_objectives.csv
patched 0 npc ship name_en rows
patched planets.csv
[generate-arc-seed-transport-rows] nothing to add — all systems present
Generated CSV-driven content TS files at src/data/generated
[audit:npc-fleet] PASS
  [info] obj_s008_a: vega_base — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용
  [info] obj_s020_a: titan_ruins — CSV 무역소 없음 · 퀘스트 전용 무역 SUB-STAGE 허용
=== audit:mission-quest-placements ===
buy_goods objectives: 16
defeat_enemy objectives: 16
placements: 16 · combat_ops: 16

PASS — 모든 buy_goods/defeat_enemy 목표에 퀘스트 배치·전투 운영 행 존재
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 477,992 — `src/data/generated/csvNpcCapitalShips.ts`
- 289,936 — `src/data/generated/csvItemDefs.ts`
- 272,565 — `src/data/generated/csvNpcCaptains.ts`
- 200,040 — `src/data/generated/csvNpcCapitalShipEquipSlots.ts`
- 148,235 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 113,890 — `src/data/generated/csvStoryScenes.ts`
- 71,812 — `src/i18n/locales/ko.ts`
- 71,055 — `src/data/generated/csvWeapons.ts`
- 70,149 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 65,404 — `src/data/balance/generated/csvCapitalShipMaxUpgradeValue.ts`
- 65,372 — `src/i18n/locales/en.ts`
- 58,627 — `app/(game)/planet.tsx`
- 58,235 — `app/(game)/worldmap.tsx`
- 47,321 — `app/(game)/shipyard.tsx`
- 43,374 — `app/(game)/trade.tsx`
- 42,572 — `src/components/planet/planetHub/planetHubSubcomponents.tsx`
- 36,821 — `src/data/generated/csvMissions.ts`
- 36,229 — `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`

## Planet hub eager `src/combat` import (should be absent)

- OK — no eager combat barrel in `planet.tsx`

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/IdleSessionRestartGuard.tsx`
- `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- `src/components/planet/PlanetMainScanActionRow.tsx`
- `src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx`
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
- `src/game/nativeReclaim/nativeReclaimBootstrap.ts`
- `app/(game)/planet.tsx`
- `app/(game)/worldmap.tsx`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
