# Daily audit — 2026-06-08T09:36:40.627Z

## TypeScript (`npx tsc --noEmit`)

```
functions/src/index.ts(6,24): error TS2307: Cannot find module 'firebase-admin' or its corresponding type declarations.
functions/src/index.ts(7,27): error TS2307: Cannot find module 'firebase-functions/v2/https' or its corresponding type declarations.
functions/src/index.ts(11,32): error TS7006: Parameter 'req' implicitly has an 'any' type.
functions/src/index.ts(11,37): error TS7006: Parameter 'res' implicitly has an 'any' type.
```

**exit:** 2

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/content-tables/build-content-from-csv.mjs

Generated CSV-driven content TS files at src/data/generated
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 305,462 — `src/data/generated/csvNpcCapitalShips.ts`
- 178,362 — `src/data/generated/csvNpcCaptains.ts`
- 163,226 — `src/data/generated/csvItemDefs.ts`
- 145,981 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 102,458 — `app/(game)/planet.tsx`
- 57,147 — `src/data/generated/csvStoryScenes.ts`
- 46,307 — `src/data/generated/csvWeapons.ts`
- 46,287 — `src/data/balance/generated/csvSynthSystemColonization.ts`
- 41,524 — `app/(game)/worldmap.tsx`
- 41,215 — `app/(game)/shipyard.tsx`
- 33,563 — `app/(game)/trade.tsx`
- 26,457 — `src/types/index.ts`
- 25,125 — `src/data/generated/csvMissions.ts`
- 24,711 — `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`
- 22,499 — `src/store/playerStore.ts`
- 21,671 — `src/data/galaxy100.ts`
- 18,909 — `src/data/generated/csvSystems.ts`
- 18,615 — `src/data/generated/csvSkills.ts`

## `setInterval(` occurrences (manual leak review)

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- `src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx`
- `src/components/TypewriterText.tsx`
- `src/systems/mining/useMiningDriver.ts`
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
