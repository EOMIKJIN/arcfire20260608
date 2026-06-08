# Daily audit — 2026-04-28T15:44:58.097Z

## TypeScript (`npx tsc --noEmit`)

```
(no output)
```

**exit:** 0

## Content tables (`npm run build:content-tables`)

```
> arcfire-online@0.1.1 build:content-tables
> node tools/content-tables/build-content-from-csv.mjs

Generated CSV-driven content TS files at src/data/generated
```

**exit:** 0

## Largest TS/TSX under `src/` + `app/` (bytes)

- 139,602 — `src/components/planet/PlanetEdenRaidTestLayer.tsx`
- 82,159 — `src/data/generated/csvNpcCapitalShips.ts`
- 78,666 — `app/(game)/planet.tsx`
- 59,686 — `src/data/generated/csvNpcCaptains.ts`
- 41,214 — `src/data/generated/csvItemDefs.ts`
- 35,506 — `app/(game)/shipyard.tsx`
- 31,214 — `app/(game)/trade.tsx`
- 30,853 — `app/(game)/worldmap.tsx`
- 26,890 — `src/types/index.ts`
- 21,470 — `src/store/playerStore.ts`
- 18,371 — `src/data/generated/csvSystems.ts`
- 17,471 — `src/store/clanWarFoundationStore.ts`
- 15,751 — `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx`
- 15,743 — `src/data/galaxy100.ts`
- 15,513 — `app/_layout.tsx`
- 12,512 — `app/(game)/combat.tsx`
- 10,395 — `app/index.tsx`
- 10,168 — `src/arcCore/subcores/AiNpcSubCore.ts`

## `setInterval(` occurrences (manual leak review)

- `src/combat/useCapitalRealtimeDuelOutcome.ts`
- `src/components/TypewriterText.tsx`
- `app/(game)/planet.tsx`

## `subscribe(` / `addEventListener(` hints (manual cleanup review)

**subscribe**
- `src/arcCore/ArcCoreHub.ts`

**addEventListener**
- `src/arcCore/ArcCoreHub.ts`
- `app/_layout.tsx`

## Optional dependency scan

_Skipped (slow / RN·Expo false positives). To include: `AUDIT_RUN_DEPCHECK=1 npm run audit:daily`_
