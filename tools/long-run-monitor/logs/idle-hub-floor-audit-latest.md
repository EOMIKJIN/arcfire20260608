# Idle hub floor audit ??PASS

milestone: arcadia_idle_watch_until_11am_20260625
since: 06/24/2026 20:40:43
pid: 7498
samples: 75 bins: 56
views spread: 646 (max 80 for idle hub)

| metric | first 10m bin floor | last 10m bin floor | drift |
|--------|---------------------|--------------------|-------|
| PSS MB | 679.9 | 754 | 74.1 |
| Native MB | 353.5 | 339.5 | -14 |
| GL MB | 42.3 | 39.3 | ??|

interpretation:
- PASS: GC sawtooth only (floor stable 짹 thresholds)
- FAIL_IDLE_FLOOR_DRIFT: idle hub code path leak (not user action)

