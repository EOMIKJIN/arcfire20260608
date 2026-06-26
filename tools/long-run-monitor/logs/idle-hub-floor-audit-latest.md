# Idle hub floor audit ??PASS

milestone: 
since: 
pid: 9392
samples: 5578 bins: 27
views spread: 925 (max 80 for idle hub)

| metric | first 10m bin floor | last 10m bin floor | drift |
|--------|---------------------|--------------------|-------|
| PSS MB | 168.7 | 343.8 | 175.1 |
| Native MB | 20.5 | 138.9 | 118.4 |
| GL MB | 3.7 | 48.8 | ??|

interpretation:
- PASS: GC sawtooth only (floor stable 짹 thresholds)
- FAIL_IDLE_FLOOR_DRIFT: idle hub code path leak (not user action)

