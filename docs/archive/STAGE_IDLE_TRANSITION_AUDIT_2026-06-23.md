# STAGE 전환 · 장기 유휴 · 재가동 전수검사 보고서 (2026-06-23)

> **문서 유형**: 크래시 원인 분석 · STAGE lifecycle 감사  
> **작성일**: 2026-06-23  
> **트리거**: 장시간 미플레이 후 아르카디아 → 은하계 지도 급격 이동 시 크래시  
> **연계**: `docs/RELEASE_READINESS_MILESTONE_2026-06-23.md` · `tools/long-run-monitor/PLAYTEST_WATCH.md`

---

## 0. Executive Summary

장기 유휴 후 worldmap 진입 크래시는 **단일 원인이 아니라 3개 축이 겹치는 타이밍 레이스**다.

| 축 | 증상 | logcat 패턴 | 조치 |
|----|------|-------------|------|
| **A. JS ref 동결** | worldmap 마운트 즉시 RedBox/크래시 | `Cannot assign to read-only property 'current'` | ✅ ref sync → `useLayoutEffect` |
| **B. Reanimated executeSync** | 진입 직후 또는 idle 후 | `executeSync` + `ShareableWorklet` on `mqt_v_js` | ✅ runOnUI를 scrollAlive=1 **이전** 금지, 2×rAF arm |
| **C. 제스처 SIGSEGV** | 맵 표시 직후 pan/tap | `WorkletEventHandler.processEvent` main thread | ✅ scrollAlive 지연 arm + blur 즉시 disarm |

**장기 idle이 악화하는 이유:** 허브 Skia/worklet·ArcCore tick·PSS floor 상승 상태에서 **planet teardown + worldmap mount + runOnUI + scrollAlive arm**이 한 커밋에 몰린다.

---

## 1. 크래시 클래스별 logcat 근거

| 시각 (06-23) | uptime | 스레드 | 패턴 |
|--------------|--------|--------|------|
| 20:25:21 | ~수분 | mqt_v_js | `read-only 'current'` in `WorldMapScreen` |
| 19:42:47 | **17116s (~4.8h)** | main | SIGSEGV `WorkletEventHandler.processEvent` |
| 22:46:19 | ~10s after Firebase | mqt_v_js | SIGSEGV `executeSync` + `ShareableWorklet` |

→ **유저 보고(한동안 안 하다가 출발)** 는 **B+C 클래스**와 uptime 4.8h 패턴에 해당.

---

## 2. STAGE 전환 맵

### 2-1. Navigation · Freeze

```15:18:app/(game)/_layout.tsx
        freezeOnBlur: true,
```

- blur된 화면은 **렌더·Reanimated 동결** (unmount 전까지 유지)
- `router.replace()` 시: blur cleanup → navigate → 이전 route unmount
- **리스크**: frozen planet + mounting worldmap 동시 — GPU/worklet teardown과 worldmap `runOnUI` 경합

### 2-2. Planet → Worldmap (출발)

```
[User] 출발 탭
  → recordHubDeparturePlanet
  → beginPlanetHubSuspendingNavigation
      → mining teardown
      → lifecycle: active → suspending → frozen
  → blur: releasePlanetMainStageSession(route_blur)  ← Skia·memo·session 해제
  → router.replace(worldmap)
  → planet unmount: useStageMemory → releasePlanetHubStageMemory (2차)
```

**파일:** `app/(game)/planet.tsx` · `src/game/usePlanetStageSession.ts` · `src/game/planetMainStageSession.ts`

### 2-3. Worldmap 진입 시퀀스 (수정 후)

```
worldmap mount
  → scrollAliveSv = 0
  → registerGalaxyMapScrollHandles
  → Heavy UI session loading (clan war hydrate, CSV)
  → useFocusEffect:
      InteractionManager.runAfterInteractions
        → rAF
          → flushDeferredScrollUiOps (runOnUI scroll apply)
          → 2×rAF
          → scrollAliveSv = 1  ← 제스처 arm
```

**파일:** `app/(game)/worldmap.tsx` · `src/game/galaxyMapScrollLifecycle.ts`

### 2-4. Worldmap → Combat → Worldmap

- `doMove` encounter → `worldmapInternalNavRef=true` → `stopGalaxyMapInteractionLoops` → combat
- combat post-flow → `router.replace(worldmap)` → focus effect 재-arm

**파일:** `app/(game)/combat.tsx` · `src/game/transitCombat/transitCombatPostFlow.ts`

---

## 3. 장기 유휴(Idle) 시 동작 중인 것

| 구간 | 동작 | 주기 | idle 중 위험 |
|------|------|------|--------------|
| **Planet hub** | orbitFrame JS mirror | 512ms (idle) / 32ms (active) | PSS floor creep |
| **Planet hub** | hub traffic session | ~15s spawn | session tick |
| **Planet hub** | defense satellite tick | 2s interval | GC 압력 |
| **ArcCore** | wall tick + daily batch probe | 60s | 12:00 KST 지난 idle → 배치 burst |
| **Root** | AppState foreground catch-up | 이벤트 | Firebase sync + daily batch 경합 |
| **Planet** | Skia layers | focus+active+ lifecycle=active | blur 시 해제 (출발 시 teardown) |

**파일:** `planet.tsx` · `planetHubWorkletContract.ts` · `ArcCoreDailyOpsSubCore.ts` · `app/_layout.tsx`

---

## 4. 재가동(Re-activation) 경로

| 이벤트 | 처리 | 리스크 |
|--------|------|--------|
| **출발 탭** | lifecycle suspend + session release + worldmap mount | P0 레이스 윈도우 |
| **AppState background (worldmap)** | `finalizeGalaxyMapSessionForExit` + persist | refocus 시 stale scroll |
| **AppState background (planet)** | `flushMiningPlayerPersist` | — |
| **worldmap blur (currentPlanetId null)** | finalize (허브 복원) | combat 이동 시 **오작동** → ✅ internalNav guard |
| **Heavy UI session** | sessionKey 변경 시만 re-hydrate | idle+store hydration 후 stale data (P1) |
| **React Freeze unfreeze** | focus 복귀 시 re-render | read-only ref (P0, 수정됨) |

---

## 5. 리스크 매트릭스

### P0 — 크래시 (수정 완료 / 재검 필요)

| ID | 내용 | 위치 | 상태 |
|----|------|------|------|
| P0-A | render-time `ref.current =` | `worldmap.tsx` · `useHeavyUiDataSession.ts` | ✅ useLayoutEffect |
| P0-B | mount 직후 `runOnUI` scroll | `worldmap.tsx` auto-scroll/clamp effects | ✅ deferred + arm gate |
| P0-C | scrollAlive=1 before UI scroll settled | focus effect | ✅ 2×rAF after flush |
| P0-D | planet render-time ref (mining, hubPlanetId) | `planet.tsx` 219, 283 | ✅ useLayoutEffect (일부) |
| P0-E | useStageMemory render-time ref | `useStageMemory.ts` | ✅ useLayoutEffect |

### P0 — 잔여 (planet 대량 ref)

| ID | 내용 | 위치 | 상태 |
|----|------|------|------|
| P0-F | planet hub orbit/traffic ref sync during render | `planet.tsx` 436, 697, 764, 793, 806, 834, 841, 876, 915, 958 | ⏳ 후속 — frozen render 시 read-only |

### P1 — 불안정 / 상태 오류

| ID | 내용 | 위치 |
|----|------|------|
| P1-1 | hub session 이중 release (blur + unmount) | `planet.tsx` 270 + 293 |
| P1-2 | worldmap blur finalize on combat nav | `worldmap.tsx` 318–324 | ✅ internalNav guard |
| P1-3 | AppState background → full finalize on worldmap | `worldmap.tsx` 313–316 |
| P1-4 | idle past noon → daily batch vs departure | `ArcCoreDailyOpsSubCore.ts` |
| P1-5 | Heavy UI no focus re-hydrate | `useHeavyUiDataSession.ts` |
| P1-6 | duplicate CSV index build on worldmap | mount + session |

### P2 — 메모리 / 위생

| ID | 내용 |
|----|------|
| P2-1 | idle hub PSS floor (512ms mirror, Skia) |
| P2-2 | worldmap 520ms loading min hold during P0 window |
| P2-3 | Firebase persist burst on foreground |

---

## 6. 이번 세션 코드 수정 요약 (2026-06-23 2차 — 메모리 계단·크래시)

| 파일 | 변경 |
|------|------|
| `galaxyMapStageSession.ts` | **신규** — full release (scroll + deferred tiles + combat cache) |
| `stageMemoryRelease.ts` | worldmap release → full release 위임 |
| `planetMainStageSession.ts` | blur+unmount **800ms dedupe** |
| `usePlanetStageSession.ts` | frozen→navigate **InteractionManager + 2×rAF** barrier |
| `worldmap.tsx` | `mapInteractionReady` gate · SVG mount 지연 · blur full release · deferred tile reset |
| `planet.tsx` | hub mirror ref → **useLayoutEffect** 일괄 |
| `useStageMemory.ts` / `useHeavyUiDataSession.ts` | ref sync useLayoutEffect (1차) |
| `analyze-stage-transition-memory.ps1` | **신규** — mem-timeline 전환 분석 |
| `run-memory-audit.cjs` | worldmap full release·dedupe·barrier 검사 추가 (22/22) |

---

## 7. 플레이테스트 검증 (필수)

| # | 시나리오 | Pass 기준 |
|---|----------|-----------|
| 1 | Arcadia **30min idle** → 출발 | 크래시 0, map interactive |
| 2 | 출발 **1초 내 pan/tap** | SIGSEGV 0 |
| 3 | **5h soak** 후 출발 20회 | `playtest-alerts.log` clean |
| 4 | worldmap → combat → 승리 → worldmap | post-flow + map pan OK |
| 5 | worldmap background 5min → foreground → pan | 크래시 0 |
| 6 | 12:00 KST 넘긴 idle → 출발 | daily batch 중/후에도 OK |

**실패 시 logcat:**

```powershell
adb logcat -d -t 3000 | findstr /i "FATAL SIGSEGV ShareableWorklet executeSync read-only WorldMapScreen"
```

**게이트:** `npx tsc --noEmit -p tsconfig.client.json` · `npm run audit:worklet-contract`

---

## 8. 후속 작업 (우선순위)

1. **P0-F** — `planet.tsx` orbit/traffic ref 일괄 `useLayoutEffect` 이전
2. **P1-1** — blur `route_blur` 후 unmount 중복 release 토큰
3. **P1-5** — Heavy UI focus revision (AppState active 카운터)
4. **P1-4** — daily batch를 첫 navigation 이후 InteractionManager 지연
5. **30min/5h soak** milestone 태깅 + `mem-timeline.csv` floor 확인

---

## 9. 참고 파일

| 영역 | 경로 |
|------|------|
| Game freeze | `app/(game)/_layout.tsx` |
| Planet departure | `app/(game)/planet.tsx` |
| Worldmap | `app/(game)/worldmap.tsx` |
| Scroll lifecycle | `src/game/galaxyMapScrollLifecycle.ts` |
| Map session | `src/game/galaxyMapSessionResume.ts` |
| Stage memory | `src/hooks/useStageMemory.ts` · `src/game/stageMemoryRelease.ts` |
| Hub worklet | `src/components/planet/planetHubWorkletContract.ts` |
| Daily batch | `src/arcCore/subcores/ArcCoreDailyOpsSubCore.ts` |
| Logs | `tools/long-run-monitor/logs/crash-20260623-*.log` |

---

**문서 종료 — STAGE Idle Transition Audit v1.0**
