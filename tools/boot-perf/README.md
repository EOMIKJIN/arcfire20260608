# Boot performance baseline (Phase 0)

Dev-only markers live in `src/game/bootPerformance.ts`.

> **초기화 단축 / 부트 최적화 로드맵 (보류)**: `docs/BOOT_INIT_OPTIMIZATION_ROADMAP.md`  
> 「초기화 단축」·「부트 최적화」·「타이틀까지 로딩」 재개 시 **해당 문서를 먼저 읽을 것**.

## How to capture a baseline

1. Run the app in dev (`npx expo start` → device/emulator).
2. Cold start: force-stop the app, launch again.
3. Open the dev console and look for `[boot-perf]` after title/planet entry.
4. Optional: call `logBootPerfSummary()` from the debugger after `boot_ready`.

## Marks

| Mark | Meaning |
|------|---------|
| `layout_effect_start` | Root `_layout` boot IIFE started |
| `csv_indexes_start` / `_end` | `buildCsvStaticIndexes*` tier |
| `storage_load_start` / `_end` | Parallel AsyncStorage hydrate block |
| `boot_ready` | Title may render (`setBootReady(true)`) |
| `arc_core_start` | `arcCoreHub.start()` |
| `continue_prewarm_*` | Title「이어하기」prewarm |
| `planet_first_render` | Planet hub first paint |

## Audit

`npm run audit:daily` uses `tsconfig.client.json` (excludes `functions/`).

Report path: `tools/daily-perf-audit/reports/latest.md`.
