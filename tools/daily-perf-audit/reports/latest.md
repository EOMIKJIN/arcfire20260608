# Daily audit — 2026-06-14T11:04:32.320Z

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
file:///D:/arcfire20260607/tools/content-tables/build-content-from-csv.mjs:279
      throw new Error(
            ^

Error: [npc_ai_captains] displayName 중복(항상 서로 다른 이름 유지): "���� ���� 07" — npc_cpt_vega_red_07 vs npc_cpt_vega_blue_07
    at assertUniqueNpcCaptainDisplayNames (file:///D:/arcfire20260607/tools/content-tables/build-content-from-csv.mjs:279:13)
    at buildNpcCaptains (file:///D:/arcfire20260607/tools/content-tables/build-content-from-csv.mjs:289:3)
    at main (file:///D:/arcfire20260607/tools/content-tables/build-content-from-csv.mjs:1012:33)
    at file:///D:/arcfire20260607/tools/content-tables/build-content-from-csv.mjs:1050:1
    at ModuleJob.run (node:internal/modules/esm/module_job:377:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:671:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)

Node.js v24.11.1
```

**exit:** 1

## Largest TS/TSX under `src/` + `app/` (bytes)

- 368,482 — `src/data/generated/csvNpcCapitalShips.ts`
- 237,614 — `src/data/generated/csvItemDefs.ts`
- 184,370 — `src/data/generated/csvNpcCaptains.ts`
- 136,679 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 67,271 — `src/data/generated/csvWeapons.ts`
- 56,993 — `src/data/generated/csvStoryScenes.ts`
- 48,385 — `app/(game)/planet.tsx`
- 46,287 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 44,259 — `app/(game)/shipyard.tsx`
- 41,941 — `app/(game)/worldmap.tsx`
- 39,627 — `app/(game)/trade.tsx`
- 32,500 — `src/components/planet/planetHub/planetHubSubcomponents.tsx`
- 27,831 — `src/types/index.ts`
- 26,371 — `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`
- 25,324 — `src/store/playerStore.ts`
- 25,125 — `src/data/generated/csvMissions.ts`
- 21,671 — `src/data/galaxy100.ts`
- 20,633 — `src/components/planet/planetHub/planetHubStyles.ts`

## Planet hub eager `src/combat` import (should be absent)

- OK — no eager combat barrel in `planet.tsx`

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- `src/components/planet/PlanetMainScanActionRow.tsx`
- `src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx`
- `src/components/TypewriterText.tsx`
- `src/game/planetHub/usePlanetHubInterval.ts`
- `src/systems/mining/useMiningDriver.ts`

## `subscribe(` / `addEventListener(` hints (manual cleanup review)

**subscribe**
- `src/arcCore/ArcCoreHub.ts`

**addEventListener**
- `src/arcCore/ArcCoreHub.ts`
- `app/(game)/planet.tsx`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
