# 이상현상 전수조사·조치 리포트 (2026-06-19)

## 분류 요약

| # | 이상 | 분류 | 근거 | 조치 |
|---|------|------|------|------|
| 1 | 00:25 GL_HARD_CEILING (GL 157MB · PSS 1313MB) | **실제 OOM 임박** | meminfo Unknown +323MB cliff · Skia/네이티브 | PSS creep 패치(§2) · 자동조치 relaunch 정상 |
| 2 | 00:25~03:56 주기적 `INCIDENT CRASH` (Firebase W만) | **오탐 (구 regex)** | `SIGSEGV` 전역 매치 · DEBUG 백트레이스 잔재 · chunk 내 비-arcfire | `Get-ArcfireCrashLogEvents` — arcfire 한정 + 타임스탬프 신선도 |
| 3 | 04:17 FinalizerDaemon SIGSEGV (pid 2514) | **실제 크래시** | `JsiSkImage`/`ImageProp` GC 파괴 · dodge overlay mount/unmount | dodge overlay **세션 sticky mount** + `dodgeFxActive` 게이트 |
| 4 | 04:26 / 06:26 handoff (real signature) | **04:26 실제 · 06:26 중복 가능** | 04:17 FATAL이 30m chunk에 포함 | 이벤트 키 dedupe (`.crash-last-event`) + maxAge 필터 |
| 5 | 00:25 이중 relaunch | **운영 버그** | `run-monitor` + `check-and-remediate` 동시 `apply-auto-remediation` | hard-ceiling → **check-and-remediate 단일 경로** |
| 6 | 06-14~17 librnskia SIGSEGV (FinalizerDaemon / mqt_v_js) | **실제 (반복)** | SkImage 수명 · 60Hz `runOnJS` 압력 | §2 허브 bridge 48ms · trail layer idle gate |
| 7 | 08:56 GL_ELEVATED 81MB | **정상 footprint** | 전투/허브 Skia plateau | restart held (v2.1 정책 유지) |

## 코드 조치 (2026-06-19)

### PSS creep / runOnJS

- `planetHubSubcomponents.tsx` — dodge bridge **48ms** throttle · `dodgeFxActive={latch}`
- `PlanetHubInboundDroneSkiaTrailLayer.tsx` — trail/hitFx 없을 때 reaction skip · 48ms throttle

### Skia SIGSEGV (JsiSkImage)

- dodge `SkiaPlanetNebulaShaderBackdrop` — **행성 세션 동안 sticky mount** (latch OFF ≠ unmount)
- `dodgeFxOnlyOverlay && !fxLoopActive` → 투명 View (useImage 수명 유지)

### 모니터 v2.6

- `Get-ArcfireCrashLogEvents` — `.arcfire.online` FATAL/Killing:crash/Process died + **≤max(35, 2×interval+5)분**
- 자동조치 force-stop/kill 제외 · handoff **이벤트 키 dedupe**
- `run-monitor.ps1` — hard-ceiling 즉시 relaunch 제거 (coalesce)

## 잔여 관측 (배포 후)

- [ ] 허브 5h+ soak — PSS/Unknown floor 비상승 (`mem-timeline.csv`)
- [ ] dodge burst 후 FinalizerDaemon SIGSEGV **0건** (logcat)
- [ ] 30m tick — Firebase W만으로 CRASH/handoff **미발생**

## 검증 게이트

- `npx tsc --noEmit -p tsconfig.client.json`
- `npm run audit:skia-memory`
