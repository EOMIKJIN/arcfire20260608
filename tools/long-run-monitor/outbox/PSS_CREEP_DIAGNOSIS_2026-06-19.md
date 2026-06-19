# PSS creep 정밀 진단 (2026-06-19)

## meminfo 근거 (pid 16628 · 23:55 → 00:25)

| bucket | 23:55 | 00:25 | Δ |
|--------|-------|-------|---|
| PSS | 704MB | 1313MB | +610MB |
| Native Heap | 227MB | 430MB | +207MB |
| GL mtrack | 58MB | 157MB | +101MB |
| Graphics | 87MB | 194MB | +108MB |
| **Unknown** | **41MB** | **364MB** | **+323MB** |
| Java Heap | ~31MB | ~31MB | ~0 |

→ **JS heap 누수 아님**. Skia/네이티브 버퍼 cliff.

## 코드 원인 (확정·수정)

1. **`useAnimatedReaction` + `runOnJS` @ 60Hz** (`planetHubSubcomponents`)  
   허브 idle 전체 시간 동안 UI→JS 브릿지. 장시간 GC·native 압력.  
   **수정**: 드론 dodge latch 활성 시에만 ~20Hz(48ms) 동기.

2. **dual-stack RN+Skia 성운 중복**  
   드론 FX 시 `skiaNebulaSwappedIn` → Skia `useImage`로 nebula/backdrop **재로드** (RN Image와 이중).  
   meminfo Unknown +323MB cliff와 부합.  
   **수정**: `dodgeFxOnlyOverlay` — RN 성운 유지, Skia는 colorDodge FX만 latch 동안 mount.

3. **48ms bridge throttle + dodge sticky mount (2026-06-19 조치)**  
   `useAnimatedReaction` 60Hz → 48ms · dodge overlay latch OFF마다 unmount 금지( FinalizerDaemon SIGSEGV 방지).

## 잔여 관측 (수정 후 soak)

- 허브 5h+ `run-mem-correlation-10m.ps1` — Unknown/GL floor 비상승 확인
- 전투 진입(`useSkiaCombatNebulaBackdrop`) 시 GL footprint spike는 정상 — 이탈 후 회수 확인
