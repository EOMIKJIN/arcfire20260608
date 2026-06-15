# Skia Worklet 메모리 계약 + 2026-06 사건 분석

**상태**: 정본 (허브 궤도·전투 Combat — **ArcCore 장거리 미사일 Skia는 2026-06 제거**)  
**관련**: `docs/(구현)2.1.memory.md` §7 · `.cursor/rules/arcfire-skia-memory-lifecycle.mdc`

> **2026-06-14+**: GL mtrack 계단 누수 격리를 위해 inbound/요격 strike 전체 삭제.  
> 현재 감시 대상: `PlanetHubOrbitSkiaLayer`, nebula backdrop, `PlanetEdenRaidOrbitSkiaCombat`.

---

## 1. 2026-06 사건 요약 (역사)

| 시각/구간 | 사건 |
|-----------|------|
| 초기 | `2.1.memory.md` — 200→800MB, Combat Skia·rAF·replace 계약 정의 |
| 6/08 | `audit:memory` 20/20 PASS — **요격 Skia 미포함** |
| 6/12~14 | ArcCore inbound/요격 Skia 추가 → SIGSEGV · GL mtrack 계단 누수 |
| 6/14 | **strike Skia 전체 제거** — no-missile GL 격리 테스트 |

**크래시 logcat**: `librnskia.so` → `RNSkia::JsiSkPath::reset` ← Reanimated worklet.

---

## 2. 재발 방지 — 필수 게이트

### PR / Skia·허브 변경 시

```bash
npm run audit:memory
npm run audit:skia-memory
npx tsc --noEmit -p tsconfig.client.json
```

### 실기기 (메인스테이지 30분 — no-missile isolation)

1. `npx expo run:android` 재빌드 후 행성 허브 30분 유지  
2. `adb shell dumpsys meminfo com.arcfire.online` — GL mtrack **±15MB idle**, 계단 +50MB 없음  
3. logcat: `librnskia` / `SIGSEGV` 없음  
4. `tools/long-run-monitor/start-watch-30m.ps1` — 30분 간격 CSV

### 신규 Skia worklet 레이어 체크리스트

- [ ] Path: SharedValue + `reset()`, **dispose 없음**
- [ ] Matrix: SharedValue + `identity()` 재사용
- [ ] `runOnJS`: 이벤트/≤20Hz sim만
- [ ] `registerPlanetSessionResource` dispose
- [ ] Skia 변경 → `expo run:android` + 30분 GL mtrack

---

## 3. 참고 파일 (현행)

| 파일 | 역할 |
|------|------|
| `planetStageGpuSupervisor.ts` | GPU Canvas 레이어 등록·blur 시 일괄 해제 |
| `PlanetHubOrbitSkiaLayer.tsx` | 허브 NPC 궤도 Skia |
| `PlanetEdenRaidOrbitSkiaCombat.tsx` | Combat Picture pool |
| `tools/long-run-monitor/` | 30분 meminfo CSV · GL spike 감지 |

**제거됨(2026-06)**: `src/arcCore/message/*`, strike store, FlightHost, inbound/요격 Skia 레이어.
