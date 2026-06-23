# Overnight memory watch — 2026-06-23 KST

> **시작 (KST)**: 2026-06-23 ~00:05 (daily commit `e0958c8` 확인 후)  
> **종료 보고 목표**: **2026-06-23 08:00 KST**  
> **담당**: 김팀장 — incident 시 즉시 분석·수정 · 08:00 최종 보고

## 사용자 조건

- 앱 **리로드 후 이전 플레이 상태 유지** (감시 중 세이브 데이터 건드리지 않음)
- **비정상 종료** → logcat 근거 즉시 분석·코드 수정
- **크래시 없이** PSS≥950 재기동 / **계단식 GL·PSS 누적** → **오늘(6/22~23) 개발분 전수검사** 후 수정

## 감시 가동

```powershell
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/start-watch-30m.ps1
# 08:00 KST 최종 보고 (백그라운드 스케줄):
powershell -ExecutionPolicy Bypass -File tools/long-run-monitor/run-overnight-until-8am.ps1
```

- `monitor-paused.flag` **없음** → 자동조치(relaunch) **활성**
- 타임라인 마커: `OVERNIGHT_WATCH_START_2026-06-23` in `mem-timeline.csv`

## 오늘 개발분 — 계단식 누수 재발 시 P0 전수검사 (허브·Arcadia)

| P0 | 영역 | 파일 | 검사 포인트 |
|----|------|------|-------------|
| 1 | 허브 Skia 스택 | `PlanetHubOrbitSkiaLayer`, `SkiaPlanetNebulaShaderBackdrop`, `PlanetEdenRaidOrbitSkiaCombat` | GL≥80 footprint vs leak; dispose on `route_blur` |
| 2 | Inbound 드론 Picture | `PlanetHubInboundDroneSkiaTrailLayer.tsx` | PictureRecorder churn; idle 가드; schedulePictureDispose |
| 3 | 허브 UI refactor | `planetHubSubcomponents.tsx`, `planetHubWorkletContract.ts` | Views 900+; worklet bridge interval |
| 4 | 행성 개발 v2 | `planetGenericFacilityDevelopment.ts`, `planetOrbitShipyardDevelopment.ts` | persist coalescing; overlay mount leak |
| 5 | 접전지역 | `ArcCoreTerritorialCombatSubCore`, `runTerritorialCombatPass.ts` | onBoot 지연 OK; state bounded |
| 6 | 출발 전환 | `planetStageLifecycle.ts`, `planetMainStageSession.ts` | suspending/frozen 중 PSS; replace 후 release |
| 7 | BM overlay | `BmShopOverlayContent`, `planet.tsx` presentBmShop | modal unmount |

**제외 (PASS)**: 은하계 지도 5분 soak — PSS −6MB, Views 934→287 (2026-06-22 23:54)

## Incident 대응 runbook

1. `tools/long-run-monitor/outbox/cursor-incident-handoff.md` 확인
2. `remediation.log` VERIFY PASS/FAIL
3. 크래시 → `crash-*.log` FATAL/SIGSEGV + `arcfire-bug-debug-workflow.mdc`
4. GL_HARD_CEILING / 3× GL_SPIKE → 위 P0表 순 audit + `npm run audit:skia-memory` + tsc
5. 수정 후 `node tools/long-run-monitor/ack-incident-handoff.cjs`

## 08:00 산출물

- `tools/long-run-monitor/logs/overnight-final-report-2026-06-23.md` (auto)
- Kim Team Lead 세션에서 사용자에게 **한국어 최종 요약** 전달
