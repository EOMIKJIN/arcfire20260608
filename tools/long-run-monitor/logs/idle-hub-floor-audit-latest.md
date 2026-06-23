# Idle hub floor audit ??PASS

milestone: arcadia_idle_codefix_applied
since: 06/23/2026 21:40:57
pid: 21407
samples: 7 bins: 7
views spread: 824 (max 80 for idle hub)

| metric | first 10m bin floor | last 10m bin floor | drift |
|--------|---------------------|--------------------|-------|
| PSS MB | 513.3 | 787.6 | 274.3 |
| Native MB | 269.9 | 318.7 | 48.8 |
| GL MB | 8.4 | 80.4 | ??|

interpretation:
- PASS: GC sawtooth only (floor stable 짹 thresholds)
- FAIL_IDLE_FLOOR_DRIFT: idle hub code path leak (not user action)

