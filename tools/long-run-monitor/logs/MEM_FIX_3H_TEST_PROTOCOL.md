# 3h 메모리 수정 검증 soak (2026-06-27)

## 목표
6/25~26 회귀(Native heap +130MB worldmap→hub 잔류) 수정 적용 여부 실측.

## 적용 수정 (코드)
- `stageNavGate.ts` — teardown 2×rAF 지연 (SVG unmount 후 reclaim)
- `runPlanetHubIngressReclaimPass` — full `runStageNativeReclaimPass` + bitmap trim
- `galaxyMapStageSession` / `planetMainStageSession` — blur 시 drone campaign trim + bitmap trim
- `ArcInboundDroneSubCore.trimCampaignsForStageExit` — off-hub 캠페인 1행성만 유지
- `galaxyMapIngressReclaim` — from_planet_hub full native reclaim

## 감시 (자동)
| 구성 | 상태 |
|------|------|
| 30m mem-timeline | `watch-30m.pid` |
| 3h state watch + 보고서 | `run-3h-state-watch-report.ps1` (PID in terminal) |
| 10m correlation (18 samples) | `mem-correlation-3h-memfix-*.csv` |
| 마일스톤 | `mem_fix_3h_soak_start_20260627` |

## 권장 플레이 (3h)
1. Metro **`r` 리로드** 1회 (수정 반영 확인)
2. **허브 → worldmap → 허브** 10회+ (핵심 검증 시나리오)
3. 30분 idle 허브 유지 2~3회
4. 전투 1~2회 후 허브 복귀
5. 마일스톤: `tag-playtest-milestone.ps1 -Label "hub_worldmap_cycle_done"`

## 3h 후 판정 기준
| 지표 | 6/25~26 회귀 | 수정 목표 |
|------|-------------|-----------|
| hub idle Native p50 | ~526MB | **≤450MB** (cold+순환 후) |
| hub idle PSS p50 | ~991MB | **≤800MB** |
| worldmap→hub 1회 후 Native Δ | +130MB 잔류 | **≤+30MB** (Views 900→280 회수) |
| 3h idle floor drift (Native) | +89MB/5h | **≤+40MB/3h** |

## 3h 후 자동 산출물
- `state-watch-3h-report-20260627-*.md`
- `audit-idle-hub-floor.ps1` → `idle-hub-floor-audit-latest.md`
- `analyze-stage-transition-memory.ps1` (전환 구간)

## 미달 시
전수검사 → logcat + timeline 구간 분석 → 추가 패치 → 재 soak
