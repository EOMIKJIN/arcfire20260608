# Memory / Stage Contract Audit

Generated: 2026-07-22T11:15:44.250Z

**Result:** PASS (37/37 checks)

## Passed
- [x] worldmap → combat uses replace (full path)
- [x] planet departure uses replace → worldmap
- [x] combatOrbitPostStepRef cleared on hub departure halt
- [x] Skia combat unmount clears postStepRef
- [x] combat sim loop cancelAnimationFrame
- [x] planet.tsx has useStageMemory
- [x] worldmap.tsx has useStageMemory
- [x] combat.tsx has useStageMemory
- [x] trade.tsx has usePlanetSubStageMemory
- [x] shipyard.tsx has usePlanetSubStageMemory
- [x] tavern.tsx has usePlanetSubStageMemory
- [x] skilltree.tsx has usePlanetSubStageMemory
- [x] releaseGalaxyMapStageMemory clears scroll + memo + nebula + heavyUi
- [x] releasePlanetMainStageSession dedupe blur+unmount
- [x] Native Reclaim Tier wired on STAGE release
- [x] GPU supervisor enforces onRelease on layer release
- [x] hub Skia native reclaim signal subscribed
- [x] planet_change light reclaim (content-safe)
- [x] clearCapital combat-only (no full reclaim on planet_change)
- [x] planet departure navigate uses stage UI idle barrier
- [x] INFO_DISTANCE_SORT_INTERVAL_MS = 5000
- [x] buildCsvStaticIndexes at app boot
- [x] planet core persist dirty-skip
- [x] file exists: src/hooks/useStageMemory.ts
- [x] file exists: src/hooks/useDisposable.ts
- [x] file exists: src/hooks/usePlanetSubStageMemory.ts
- [x] file exists: src/game/stageMemoryRelease.ts
- [x] planet does not push worldmap (replace only)
- [x] ArcMemoryGovernor warmPlanetHubResidentSet
- [x] hub Skia 2-stage arm (hubSkiaArmReady)
- [x] stageTransitionPhaseGate module
- [x] planet stage session uses phase gate navigate drain
- [x] MEM_PROFILE release build flag
- [x] planet hub SUB-STAGE blur skips full route_blur
- [x] hub soft reclaim Fresco trim deferred-only (no immediate+deferred double trim)
- [x] planet hub store selectors avoid JSON.stringify hot path
- [x] dev Metro reload guard releases all STAGE + blur skip

## Reference
- `docs/2.1.memory.md`
- `docs/rendering-pipeline-baseline.md`
