# Daily audit — 2026-06-25T15:00:06.624Z

## TypeScript (`npx tsc --noEmit -p tsconfig.client.json`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/gen-mineral-region-members.mjs && node tools/balance-tables/rebalance-weapon-ttk.mjs && node tools/content-tables/gen-weapon-trade-listing-policy.mjs && node tools/content-tables/sync-weapon-trade-listing.mjs && node tools/content-tables/patch-item-defs-en.mjs && node tools/content-tables/patch-missions-en.mjs && node tools/content-tables/patch-npc-ships-en.mjs && node tools/content-tables/patch-planets-en.mjs && node tools/content-tables/build-content-from-csv.mjs

[gen-mineral-region-members] 100 rows
[rebalance-weapon-ttk] updated 0 weapons in weapon_list.csv
weapon_trade_listing_policy: shop=83 excluded_npc_clone=20
tradePortListed sync: canonical=83 TRUE=83 demoted=0
patched D:\arcfire20260607\tables\content\item_defs.csv (196 data rows)
patched missions.csv + mission_objectives.csv
patched 0 npc ship name_en rows
patched planets.csv
Generated CSV-driven content TS files at src/data/generated
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 369,190 — `src/data/generated/csvNpcCapitalShips.ts`
- 290,046 — `src/data/generated/csvItemDefs.ts`
- 200,040 — `src/data/generated/csvNpcCapitalShipEquipSlots.ts`
- 195,070 — `src/data/generated/csvNpcCaptains.ts`
- 148,235 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 75,917 — `src/data/generated/csvStoryScenes.ts`
- 71,055 — `src/data/generated/csvWeapons.ts`
- 70,149 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 67,436 — `src/i18n/locales/ko.ts`
- 65,404 — `src/data/balance/generated/csvCapitalShipMaxUpgradeValue.ts`
- 61,393 — `src/i18n/locales/en.ts`
- 58,582 — `app/(game)/worldmap.tsx`
- 57,892 — `app/(game)/planet.tsx`
- 46,036 — `app/(game)/shipyard.tsx`
- 42,880 — `app/(game)/trade.tsx`
- 42,572 — `src/components/planet/planetHub/planetHubSubcomponents.tsx`
- 36,821 — `src/data/generated/csvMissions.ts`
- 36,229 — `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`

## Planet hub eager `src/combat` import (should be absent)

- OK — no eager combat barrel in `planet.tsx`

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- `src/components/planet/PlanetMainScanActionRow.tsx`
- `src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx`
- `src/components/TypewriterText.tsx`
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
- `src/game/nativeReclaim/nativeReclaimBootstrap.ts`
- `app/(game)/planet.tsx`
- `app/(game)/worldmap.tsx`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
