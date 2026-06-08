# Arcfire Rendering Pipeline Baseline (Do Not Drift)

This file fixes the current rendering/process baseline so future upgrades do not break established behavior.

## 1) Planet Main Stage (Hub) Baseline

- Orbit clock source: `app/(game)/planet.tsx`
  - `orbitClockMs` is advanced by `useFrameCallback`.
  - Frame delta is clamped by `ORBIT_FRAME_DT_MAX_MS` to reduce jumpy motion on frame drops.
- Table NPC warships (nearby/table-based)
  - Rendered as RN animated markers (`PlanetTableOrbitMarks` / `PlanetTableOrbitMark`) using `computeTableNpcOrbitXY`.
  - Positioning uses `transform: translateX/translateY` (not layout left/top animation) for smoother motion.
  - Captain captions are rendered below marker (`orbitShipCaption`), built from nearby line head.
- ArcCore transport ships
  - Rendered by `src/components/planet/PlanetHubOrbitSkiaLayer.tsx` (Skia canvas + arc captions).
  - Arc packing update is gated by a structural signature to avoid frequent repack/sync churn.

## 2) Info Panel Baseline

- Hub info order is distance-based, but re-sorted every `INFO_DISTANCE_SORT_INTERVAL_MS` (currently 5000ms), not every frame.
- Distance sort uses:
  - table distance via `jsTableNpcDistanceFromCenter`
  - arc distance via `jsArcNpcDistanceFromCenter`
- Arc lookup is O(1) by `Map<shipId,index>` to avoid repeated `findIndex` scans.

## 3) Combat Orbit Baseline

- Combat simulation loop lives in `PlanetEdenRaidTestLayer`.
- Combat orbit Skia rendering lives in `PlanetEdenRaidOrbitSkiaCombat`.
- Render sync contract:
  - simulation step calls `combatOrbitPostStepRef.current?.()`
  - Skia combat layer subscribes this callback and triggers render from it
  - avoid independent render rAF loops that can desync with simulation time.

## 4) Missile Visual Rule Baseline

- Missile trail remains visible per existing trail fade behavior.
- Missile warhead/head dot must disappear immediately on hit:
  - condition includes `!m.hitApplied`.

## 5) Upgrade Guardrails

- Do not re-merge table NPC ship path rendering into hub Skia unless benchmarked.
- Keep simulation-time and render-time coupling explicit (post-step callback preferred).
- Keep table ship movement on transform animation path.
- Any performance optimization must preserve:
  - captain label visibility
  - distance-sort stability
  - arc transport continuous motion (no sync reset jitter).

## 6) Final Verification Checklist

Before accepting future rendering upgrades, verify:

1. `npx tsc --noEmit` passes.
2. Planet hub:
   - table NPC marker + caption visible
   - arc transport visible and smooth
   - info order updates roughly every 5s without line swap flicker.
3. Combat:
   - warship movement smooth
   - missile head disappears on hit
   - missile trail behavior unchanged.
