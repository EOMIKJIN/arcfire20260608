# Arcfire Memory Profiler — 김경제 상시 프로파일링

> **목표**: Xcode Instruments(Allocations) · Android Studio Memory Profiler와 유사하게  
> **스냅샷 diff + STAGE 닫힘 후 retention** 을 자동 탐지.

## 3층 프로파일

| 층 | 소스 | 역할 |
|---|---|---|
| **Native (PSS/GL/Views)** | `adb dumpsys meminfo` | `profile-timeline.csv` · `mem-timeline.csv` |
| **JS heap proxy** | Hermes `getInstrumentedStats` → logcat `[MEM_PROFILE]` | dev 빌드 only |
| **Retention diff** | `run-retention-audit.cjs` | `route_blur` 후 recovery window 내 floor 비교 |

## 김경제 일일 루틴

```powershell
# 1) 상시 watch (30m meminfo + MEM_PROFILE logcat + 60m retention audit)
npm run profile:mem:watch

# 2) 플레이 중 STAGE 전환마다 (선택)
npm run profile:mem:tag -- -Stage planet_hub -Event route_blur -Detail depart_worldmap

# 3) 수동 스냅샷
npm run profile:mem:snapshot -- -Stage galaxy_map -Event manual

# 4) retention 리포트 (수동·CI)
npm run audit:memory:retention
```

산출:

- `tools/memory-profiler/reports/profile-timeline.csv` — tagged snapshots
- `tools/memory-profiler/reports/latest-retention-audit.md` — **닫힌 화면 survivor** 판정
- `tools/memory-profiler/reports/snapshots/*.json` — heap-style JSON (meminfo 전체)

## `[MEM_PROFILE]` 마커 (__DEV__)

앱 STAGE blur/focus/ingress 시 Metro logcat:

```text
[MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=42.3 detail=arcadia_prime
```

`pull-mem-profile-logcat.ps1` → retention audit 입력.

## Retention FAIL 예시

- `GL_NOT_RECOVERED` — 허브 blur 후 15분 내 GL ≥12MB 미회수
- `PSS_FLOOR_UP` — 닫힌 STAGE 후 PSS floor +35MB+
- `VIEWS_RETAINED` — planet_hub 닫힘 후 Views ≥450 (RN 트리 중복)

임계값: `retention-thresholds.json`

## Cursor / 김경제 handoff → 김팀장 개발 반영

`audit:memory:retention` **FAIL** 또는 handoff `mem-profile: FAIL`:

1. 김경제: `kim-economy-handoff.md` **`## [관측]`** 갱신 (`ready-for-team-lead-action`)
2. 김팀장: 본 섹션 플래그 매핑으로 STAGE·Skia·reclaim **코드 수정**
3. 김팀장: `audit:memory:retention` 재실행 · handoff `[mem-profile-fix]` 기록
4. 김경제: 재감사만 배정 (코드 수정 금지)

정본: `.cursor/rules/arcfire-main-lead-agent.mdc` · `docs/KIM_TEAM_ECONOMY_WORKFLOW.md`

## 한계 (v1)

- Chrome DevTools full heap snapshot 자동화 **미포함** (Hermes + meminfo proxy)
- **release** 빌드: `[MEM_PROFILE]` 없음 — PSS/GL/Views만
- 진짜 JS 객체 retainers → dev 빌드 + Metro inspect 보조

## 관련

- `tools/long-run-monitor/logs/WATCH_README.md` — GL/PSS 30m watch
- `src/game/devMemoryProfileBridge.ts` — 마커 emit
