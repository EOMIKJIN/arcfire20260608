# 김클로드 착수 — 은하계 지도 native_heap·PSS 분석 **재검수만** (코드 금지)

> **배정**: 김팀장 (Cursor 본창) · **2026-08-01**  
> **대표님 지시**: 「해당분석내용을 김클로드가 재검수하게 지시하라. (코드 작업은 아직 하지 않는다.)」  
> **task_id**: `worldmap-native-heap-pss-audit-recheck-20260801`  
> **성격**: **분석·계약 재검수 리포트만** — `src/` · `app/` · `tables/` **수정·패치·커밋 절대 금지**  
> 완료 후 `kim-claude-handoff-pending.md` **PENDING** (verdict=분석 동의/부분수정/반박 + 근거 파일:줄)

---

## [pss-pre-dev] (본 task = 읽기 전용)

```text
[pss-pre-dev] hot_path=없음(코드미착수) · alloc=0 · cache=해당없음
[pss-pre-dev] stage=galaxy_map↔planet_hub 관측 재검증 · risk=해당없음(읽기만)
[pss-pre-dev] verdict=PASS — 분석 재검수만 · 구현 보류
```

---

## 0. 배경 (김팀장 1차 분석 · 재검수 대상)

대표님 관측 (대시보드·PID 29412):

| 시각 | PSS | GL | Views |
|------|-----|-----|-------|
| 21:19 | 739.4 | 14.9 | 229 |
| 21:34 | 823.1 | 36.3 | 369 |
| 21:49 | 936.5 | 130 | 575 |

→ 21:57 `GL_HARD_CEILING` → 강제 재기동.

**대표님 정정**: 재시동 구간은 **허브가 아니라 은하계 지도**.

김팀장 1차 수정 결론(아래를 **맞는지/틀렸는지** 재검수):

1. **17:34~21:05** 은 logcat상 **`galaxy_map` 체류** (`galaxy_map_periodic` / `galaxy_map_periodic_deep`). GL~140·Views~581은 **지도 floor**이지 “허브 sticky remount만의 유휴 누수”가 아님.
2. **21:10** GL 14.9 / views 229 = 지도 `route_blur` → **허브 `route_focus`(arcadia_prime)** 전환 — “회수 성공”이 아니라 **STAGE 전환 스냅샷**.
3. 왕복 후 GL·Views는 거의 복귀(130≈140, 575≈581)인데 PSS만 **785→954**. 차이는 **`native_heap` +138MB급**(327→465)이 본축.
4. 모니터 `suspect=hub_skia_orbit_nebula_combat` 는 **고정 라벨** — 스테이지 근거 아님.
5. 계약 결함 후보(코드 읽기만으로 검증):
   - `releaseAllPlanetGpuLayers` — `registerGpuLayer` 3곳이 `onRelease` 미전달 → **해제 no-op + `layers.clear()` 오탐**
   - `HUB_BACKDROP_REMOUNT_COOLDOWN_MS`(30m) — `hub_inbound_drone_end` 시 `backdropRemount cooldown skip` 실측
   - 허브 15분 deep: `skipBackdropRemount: true`
   - ArcCore 인바운드 드론 ~75초 주기 할당(유휴 손터치 불필요)
6. 김팀장 제안 **1안(미구현·보류)**: GPU `onRelease` 실주입 · STAGE 전환 시 remount 쿨다운 예외 · suspect 라벨 교체 — **본 task에서 구현하지 말 것**.

---

## 1. 김클로드 할 일 (R0~R6 · **읽기·리포트만**)

| # | 내용 | 산출 |
|---|------|------|
| **R0** | 본 READY + mem-timeline + mem-profile-logcat 교차 확인 | 타임라인 표(스테이지 태그 포함) |
| **R1** | `tools/long-run-monitor/logs/mem-timeline.csv` PID **29412** 17:34~21:58 | GL/Views/native_heap/note 열 요약 |
| **R2** | `tools/memory-profiler/reports/mem-profile-logcat.txt` — `galaxy_map` / `planet_hub` / `hub_inbound_drone_end` / `route_blur` / `route_focus` | **스테이지 판정 동의/반박** |
| **R3** | `planetStageGpuSupervisor.ts` + `registerGpuLayer` 호출 3곳 (`SkiaPlanetNebulaShaderBackdrop` · `PlanetEdenRaidOrbitSkiaCombat` · `PlanetHubInboundDroneSkiaTrailLayer`) | onRelease 유무 · clear 부작용 — **동의/반박 + 파일:줄** |
| **R4** | `runDeepNativeReclaimPass.ts` 쿨다운 · `planet.tsx` `skipBackdropRemount` · `worldmap.tsx` periodic soft/deep | native 회수 경로가 닫혀 있는지 검증 |
| **R5** | 인바운드 드론 주기(코드·로그)가 “유휴 PSS 상승”을 설명할 수 있는지 | 인과 강도: 강/중/약 |
| **R6** | 김팀장 1안 3줄에 대해 **구현 전 리스크·누락·대안 1개**만 (코드 작성 금지) | handoff 「재검수 판정」표 |

### ❌ 금지

- `src/` · `app/` · `tables/` · generated **일절 수정**
- `git commit` · 「수정 완료」 · audit PASS를 **수정 완료로** 오인 선언
- 허브 sticky만 탓하는 **구(잘못된) 가설로 회귀**하지 말 것 — 대표님 「지도상 재시동」을 최우선
- 기존 CSV·레이아웃 상수 변경 제안만으로 “끝” 처리 금지 — **근거 파일:줄** 필수

---

## 2. 근거 경로 (필수 열람)

| 경로 | 용도 |
|------|------|
| `tools/long-run-monitor/logs/mem-timeline.csv` | PID 29412 수치 |
| `tools/long-run-monitor/logs/heartbeat.log` | 21:04~21:49 OK 줄 |
| `tools/long-run-monitor/logs/incidents.log` · `remediation.log` | GL_HARD / soft ceiling |
| `tools/long-run-monitor/outbox/cursor-incident-handoff.md` | incident pack |
| `tools/memory-profiler/reports/mem-profile-logcat.txt` | `[MEM]` / `[MEM_PROFILE]` |
| `src/game/planetStageGpuSupervisor.ts` | release no-op 가설 |
| `src/game/nativeReclaim/runDeepNativeReclaimPass.ts` | remount cooldown |
| `src/game/nativeReclaim/galaxyMapIngressReclaim.ts` · `runGalaxyMapResidentDeepReclaimPass.ts` | 지도 체류 reclaim |
| `app/(game)/worldmap.tsx` (~554–627) | 5분 soft / N틱 deep |
| `app/(game)/planet.tsx` (soft/deep interval · skipBackdropRemount) | 허브 주기 |

---

## 3. handoff 산출 형식 (PENDING 시 필수)

```text
status=PENDING
task_id=worldmap-native-heap-pss-audit-recheck-20260801
verdict=AGREE | PARTIAL | DISAGREE
code_changes=NONE
```

| 항목 | 김클로드 기입 |
|------|----------------|
| 스테이지 판정(17:34~21:05=지도?) | AGREE/DISAGREE + log 1줄 인용 |
| native_heap 본축? | AGREE/DISAGREE + 수치 |
| GPU release no-op | AGREE/DISAGREE + 파일:줄 |
| remount cooldown skip | AGREE/DISAGREE + 로그 인용 |
| 김팀장 1안 | 유지 / 수정제안(문장만) / 기각 |
| 누락 가설(있으면 1개) | 짧게 |

**git commit 안 함** — 김팀장 검수 후 코드 task READY는 별도 배정.
