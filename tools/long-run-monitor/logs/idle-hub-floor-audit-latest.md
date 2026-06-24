# Idle hub floor audit ??PASS

milestone: solar_port_idle_overnight_until_8am_opus
since: 06/24/2026 00:56:48
pid: 21407
samples: 43 bins: 42
views spread: 213 (max 80 for idle hub)

| metric | first 10m bin floor | last 10m bin floor | drift |
|--------|---------------------|--------------------|-------|
| PSS MB | 1056.6 | 897.5 | -159.1 |
| Native MB | 657.9 | 502.6 | -155.3 |
| GL MB | 68.9 | 54.6 | ??|

interpretation:
- PASS: GC sawtooth only (floor stable 짹 thresholds)
- FAIL_IDLE_FLOOR_DRIFT: idle hub code path leak (not user action)

