# Account reset purge stability — O(n²) trade-port resync (2026-08-06)

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=purge once (not tick) alloc=was O(n²) set_catalog → O(n) once cache=tradePort warm clear per planet
[pss-pre-dev] stage=title after purge · worldStore reset + global expansion sync risk=P1(호출빈도)·P6(persist coalesce already)
[pss-pre-dev] verdict=PASS — finalize에서 전 synth integrate 제거 · reconcile 1회 enroll 유지
```

## Root cause (실측)

- `[reset-diag] purge≈46587ms`
- `[ArcCore/Economy] bulk set_catalog x1890` after +42 synth unlock
- Path: `purge` → `resetLocalWorld` → `syncArcCoreGlobalWorldExpansionSync` → `reconcile` (1× integrate ≈42) → `finalize` ×42 each calling `integrateUnlockedSynthFrontierStatEconomy` again → ~42² + extras ≈ 1890

## Fix

| 파일 | 변경 |
|------|------|
| `worldExpansionSynthColonization.ts` | `finalize` — hold/assert/transport/notice only; **no** full integrate / forceResync |
| `worldStore.unlockSystem` | synth: core ensure + **single-planet** `enrollSynthFrontierPlanetInArcEconomy` (no full integrate) |
| `worldStore.reconcileGlobalSynthUnlocks` | keep **one** `integrateUnlocked…`; remove redundant per-planet forceResync after enroll |
| `localAccountReset.ts` | `[reset-diag] cloud_phase=` / `world_expansion=` phase timings |

## Expected

- Batch +42 unlock: **~42** `set_catalog` (not ~1890)
- Daily single unlock: **1** enroll (not re-enroll all prior synth)
- Economy still attached via unlock/reconcile before finalize

## Verify (대표님)

1. 계정 초기화 1회
2. logcat: `set_catalog` count ≪ 1890; `[reset-diag] world_expansion=` 수 초대
3. `tsc` PASS (본 패치 후)

## Gate

- `npx tsc --noEmit -p tsconfig.client.json` — PASS
