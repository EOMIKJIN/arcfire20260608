# Idle hub floor audit ??PASS

milestone: arcadia_idle_watch_until_11am_20260625
since: 06/24/2026 20:40:43
pid: 31145
samples: 12 bins: 9
views spread: 222 (max 80 for idle hub)

| metric | first 10m bin floor | last 10m bin floor | drift |
|--------|---------------------|--------------------|-------|
| PSS MB | 464.4 | 813.3 | 348.9 |
| Native MB | 244.2 | 491.2 | 247 |
| GL MB | 8.3 | 38.5 | ??|

interpretation:
- PASS: GC sawtooth only (floor stable 짹 thresholds)
- FAIL_IDLE_FLOOR_DRIFT: idle hub code path leak (not user action)

