# Daily audit — 2026-06-16T11:20:51.320Z

## TypeScript (`npx tsc --noEmit -p tsconfig.client.json`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/gen-mineral-region-members.mjs && node tools/balance-tables/rebalance-weapon-ttk.mjs && node tools/content-tables/gen-weapon-trade-listing-policy.mjs && node tools/content-tables/sync-weapon-trade-listing.mjs && node tools/content-tables/build-content-from-csv.mjs

[gen-mineral-region-members] 100 rows
[rebalance-weapon-ttk] updated 0 weapons in weapon_list.csv
weapon_trade_listing_policy: shop=81 excluded_npc_clone=22
tradePortListed sync: canonical=81 TRUE=81 demoted=0
Generated CSV-driven content TS files at src/data/generated
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 357,301 — `src/data/generated/csvNpcCapitalShips.ts`
- 237,614 — `src/data/generated/csvItemDefs.ts`
- 178,347 — `src/data/generated/csvNpcCaptains.ts`
- 140,360 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 67,271 — `src/data/generated/csvWeapons.ts`
- 56,993 — `src/data/generated/csvStoryScenes.ts`
- 52,840 — `app/(game)/planet.tsx`
- 46,287 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 44,950 — `app/(game)/shipyard.tsx`
- 43,813 — `app/(game)/worldmap.tsx`
- 41,818 — `app/(game)/trade.tsx`
- 38,815 — `src/components/planet/planetHub/planetHubSubcomponents.tsx`
- 28,705 — `src/types/index.ts`
- 27,806 — `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`
- 26,426 — `src/store/playerStore.ts`
- 25,125 — `src/data/generated/csvMissions.ts`
- 21,671 — `src/data/galaxy100.ts`
- 20,839 — `src/components/planet/planetHub/planetHubStyles.ts`

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
- `app/(game)/planet.tsx`

## `subscribe(` / `addEventListener(` hints (manual cleanup review)

**subscribe**
- `src/arcCore/ArcCoreHub.ts`

**addEventListener**
- `src/arcCore/ArcCoreHub.ts`
- `app/(game)/planet.tsx`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
