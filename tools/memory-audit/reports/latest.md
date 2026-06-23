# Memory / Stage Contract Audit

Generated: 2026-06-23T14:32:22.644Z

**Result:** PASS (22/22 checks)

## Passed
- [x] worldmap → combat uses replace (full path)
- [x] planet departure uses replace → worldmap
- [x] combatOrbitPostStepRef cleared when active=false
- [x] Skia combat unmount clears postStepRef
- [x] combat sim loop cancelAnimationFrame
- [x] planet.tsx has useStageMemory
- [x] worldmap.tsx has useStageMemory
- [x] combat.tsx has useStageMemory
- [x] trade.tsx has usePlanetSubStageMemory
- [x] shipyard.tsx has usePlanetSubStageMemory
- [x] tavern.tsx has usePlanetSubStageMemory
- [x] skilltree.tsx has usePlanetSubStageMemory
- [x] releaseGalaxyMapStageMemory clears scroll + deferred tiles + combat cache
- [x] releasePlanetMainStageSession dedupe blur+unmount
- [x] planet departure navigate uses InteractionManager barrier
- [x] INFO_DISTANCE_SORT_INTERVAL_MS = 5000
- [x] buildCsvStaticIndexes at app boot
- [x] file exists: src/hooks/useStageMemory.ts
- [x] file exists: src/hooks/useDisposable.ts
- [x] file exists: src/hooks/usePlanetSubStageMemory.ts
- [x] file exists: src/game/stageMemoryRelease.ts
- [x] planet does not push worldmap (replace only)

## Reference
- `docs/2.1.memory.md`
- `docs/rendering-pipeline-baseline.md`
