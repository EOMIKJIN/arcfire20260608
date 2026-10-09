# 재시동 반복 · 허브 GL 폭증 분석 (김플레이 → 김팀장·김클로드 · 2026-10-09 01:50)

status: **분석 완료 — 코드 수정은 김클로드 진행 중 · 김플레이는 실기 재측 검수**

## 1. 결론 3줄

1. 재시동 반복은 OOM이 아니다. 장시간 모니터 `AUTO_FIX app relaunch`(force-stop)가 5회 앱을 내렸다. 안드로이드 exit-info에 LMK·OOM은 0건이다.
2. 모니터가 앱을 내린 이유는 허브 GL mtrack 294~441MB다. 이 폭증은 10-08 23:23 수정(드론 꼬리를 SkPath 1개로 합침) 직후부터만 나온다.
3. 그 수정에서 `rewind()` 뒤에 `setIsVolatile(true)`가 빠졌다. 그래서 GPU가 프레임마다 꼬리 모양을 캐시했다. 김클로드가 01:40에 넣은 `trailPath.setIsVolatile(true)`(`PlanetHubInboundDroneSkiaTrailLayer.tsx:191-192`)가 이 원인을 정확히 겨눈다. → **AGREE (원인)**

## 2. 근거

### 2-1. 죽은 이유 — `adb shell dumpsys activity exit-info com.arcfire.online`

| 시각 | pid | 사유 | PSS |
|---|---|---|---|
| 23:38:05 | 27318 | FORCE STOP (모니터) | — |
| 23:59:11 | 29253 | FORCE STOP (모니터) | 1.0GB |
| 00:32:18 | 1119 | FORCE STOP (모니터) | — |
| 00:49:11 | 3439 | FORCE STOP (모니터) | 0.89GB |
| 01:06:01 | 7138 | FORCE STOP (모니터) | 0.96GB |
| 01:32 / 01:36 / 01:40 | 9481 / 12330 / 13157 | FORCE STOP (모니터 일시정지 이후 → 수동 A/B 재시작) | 230~300MB |

- `remediation.log`의 `AUTO_FIX app relaunch reason=gl_critical_active_hub` 시각이 위 force-stop과 같다.
- 모니터 relaunch는 01:31부터 `app_relaunch=OFF(monitor-paused)` 상태다.
- 별건: 21:03 pid 15872 `APP CRASH(EXCEPTION)` 1건이 있다. 반복 루프와는 무관하다. 원인은 미확인이다(logcat 없음).

### 2-2. 언제부터 — mem-timeline (허브 views 377~415 구간)

| 구간 | pid | 허브 GL | 비고 |
|---|---|---|---|
| 21:14~22:51 | 18710 | 47~106MB (1.5시간) | 23:23 이전 코드 |
| 23:03:56 | — | APK 재설치 (`lastUpdateTime`) | 네이티브 라이브러리 버전은 10-08 10:05 이후 그대로 |
| 23:23~23:24 | — | `inboundDroneSkiaTrail.ts` · `runPlanetHubPostSkiaPeakReclaimPass.ts` 수정 (mtime) | |
| 23:37 이후 매 세션 | 27318·29253·1119·3439·7138 | **294~441MB** (허브 진입 16분 안) | GL이 PSS 상승을 주도 |
| 01:38 | 13157 | 29MB | 김클로드 수정 반영 뒤 첫 표본 (1개뿐) |

meminfo(`meminfo-20261008-230640.log`): pid 1119 기준 GL mtrack 441,268KB · Native Heap 380,978KB · TOTAL PSS 1,109,743KB. 축은 **GL**이다. Native는 기존 수준(250~380MB)이다.

### 2-3. 왜 — 코드

- 23:23 이전(`b53b44f^`): 드론마다 풀 경로에 `resetSkPath(path); path.setIsVolatile(true);`를 하고 Picture에 기록했다. 지금도 `recordInboundDroneVfxPicture` 79~81줄에 남아 있다.
- 23:23 수정(`b53b44f`): 꼬리를 `trailPath` 1개로 합치고 `<Path path={trailPathSv}>`로 직접 그린다. 매 프레임 `resetSkPath(trailPath)`(=rewind)를 하는데 **volatile 재설정이 없었다**.
- Skia `SkPath::rewind()`/`reset()`은 `fIsVolatile=false`로 되돌린다. 비volatile AA fill 경로는 Ganesh가 generation id별 마스크·테셀레이션을 GPU 리소스 캐시에 남긴다. 모양이 프레임마다 바뀌니 캐시가 예산까지 찬다. GL 300~440MB 고점과도 맞는다.

## 3. 김클로드 진행 중 diff에 대한 김플레이 판정

| 변경 | 판정 | 이유 |
|---|---|---|
| `trailPath.setIsVolatile(true)` (TrailLayer 191-192) | **AGREE · 핵심** | 위 2-3 |
| TEMP-DIAG `{false && picture ? <Picture/> : null}` (TrailLayer 356-358) | 원복 필수 | 화염 FX가 안 보인다. 진단 전용 |
| 드론 Canvas·dodge 오버레이 허브 상시 마운트, 디바운스 언마운트 제거 (`PlanetHubInboundDroneLayer.tsx`, `planetHubSubcomponents.tsx`, `SkiaPlanetNebulaShaderBackdrop.tsx`) | **DISAGREE (근거 부족)** | 가설은 「웨이브마다 언마운트하면 GL 표면이 남는다」다. 그런데 23:23 이전 코드도 웨이브마다 언마운트했고, pid 18710은 1.5시간 동안 허브 GL 47~106MB였다. 상시 마운트는 허브 체류 내내 Canvas GL 표면을 고정 비용으로 만든다 |
| `subscribeHubSkiaNativeReclaim` 구독 삭제 (`planetHubSubcomponents.tsx`) | **DISAGREE · 위험** | `releasePlanetMainStageSession`의 포커스 경합과 무관한 강제 해제 경로다. STAGE 이탈 dispose 규칙(CLAUDE.md 금지 1순위 영역)을 약하게 만든다 |

권고: **volatile 1줄만 남기고 A/B를 먼저 본다.** 상시 마운트 묶음은 volatile만으로 GL이 안정되면 되돌린다. 안정되지 않을 때만 별도 근거를 붙여 다시 올린다.

## 4. 검수 기준 (김플레이 실기 재측)

- 허브 체류 30분 이상, 인바운드 드론 웨이브 3회 이상 → GL mtrack < 80MB 유지, 웨이브 전후 차이 회수.
- 은하 지도 왕복 2회 → GL·Native 계단이 남지 않음.
- 측정 중에는 모니터 relaunch OFF 유지. 켜 두면 16분마다 앱을 내려서 장시간 추세를 볼 수 없다.

## 4-1. 실기 재측 결과 (01:50~02:29 · pid 15250 · 작업 트리 = volatile + 상시 마운트 3파일 · 모니터 relaunch OFF)

표본: `tools/play-bot-console/logs/sdk54-upgrade/gl-volatile-recheck-20261009.csv`(30초) · `…-logcat-20261009.txt`

| 항목 | 결과 | 판정 |
|---|---|---|
| 허브 체류 39분 · inbound 웨이브 29회 | 허브 GL 29.9~64.5MB. 웨이브당 증가 없음 | **PASS** (기준 <80) |
| 은하 지도 왕복 (01:57 · 02:15 · 02:18 2회 + 교역 + synth_073 이동) | 지도 위 일시 GL 163~264MB → 허브 복귀 후 50~61MB. 1회차만 30→50 계단, 2회차부터 추가 계단 없음 | **PASS** |
| 크래시 | FATAL·SIGSEGV 0 · 프로세스 유지 | **PASS** |
| PSS / Native | 허브 PSS 634→790~820MB · Native 326→395~425MB 완만 상승 | **관찰 지속** — GL과 별개 축(은하 P0와 동일). 장시간 시 950 근접하면 모니터 PSS 한도에 걸릴 수 있음 |

- 측정 종료 후 `monitor-paused.flag` 삭제 → 모니터 relaunch ON 복귀(02:30).
- 미측정: 상시 마운트 3파일 원복 상태. 김팀장 원복 결정 후 같은 절차로 재측.

## 4-2. 정정 — 상시 마운트 3파일 원복은 오판 → 재적용 (02:33~03:36)

- 02:33 김플레이가 3파일 원복(백업 `backup-kim-team-lead-hub-sticky-mount-20261009.patch`). Fast Refresh hook 순서 오류로 허브 트리가 내려감(02:31:05) → 재시작(pid 19469).
- **원복 상태, synth_073_p**: 허브 GL 21→30→44→51→64→72→81MB(02:36~02:50, 웨이브마다 바닥 약 +3~4MB). 같은 행성 상시 마운트 상태(02:19~02:29)는 53.6~61.6MB로 평탄.
- 결론: volatile = 큰 누수(웨이브당 ~45MB), 상시 마운트 = 작은 누수(웨이브당 ~4MB). **둘 다 유지.** 김클로드 판정 PARTIAL(큰 누수 원인은 Canvas 수명이 아님) 수용.
- 02:52 Edit로 재적용 → git diff가 백업 patch와 identical=True → force-stop 재시작(pid 20711). tsc PASS · audit:skia-memory 31/31 PASS.

## 4-3. 최종 재측 (pid 20711 · 상시 마운트 + volatile · 02:57~03:36)

표본: `gl-revert-recheck-20261009.csv` · `gl-sticky-final-20261009.csv` · `gl-galaxy-repeat-20261009.csv`(15초) · `gl-revert-recheck-logcat-20261009.txt` · `gfxinfo-sticky-posttrip-20261009-0328.txt` (모두 `tools/play-bot-console/logs/sdk54-upgrade/`)

| 항목 | 결과 | 판정 |
|---|---|---|
| 허브 39분 · 웨이브 26회 이상 | GL 23.6~36(왕복 전) · hook 오류·크래시 0 | PASS |
| 백그라운드(HOME 40초) → 복귀 | GL 30→17.6 → 복귀 직후 42.5 → 1분 뒤 31 | PASS (Canvas가 내려간 효과 · Skia purge 아님) |
| 은하 왕복 1회(03:11 · synth_073_p) | 31 → 53~65 고정 16분 | 1회 계단 → 아래 반복 시험으로 판정 |
| 포그라운드 trim-memory RUNNING_CRITICAL | 60.2→58.2→60.2 미해제 | 앱·RN Skia 모두 GrResourceCache purge·한도 설정 없음 (김클로드 교차 확인) |
| 같은 행성 왕복 3회(arcadia_prime · 03:31/03:32/03:33) | 왕복 전 58.2 → 1회 후 46.7 → 2회 후 50.0 → 3회 후 50.7(체류 36초) | PASS (회차당 +5 미만 · 오히려 감소) |
| 다른 행성 왕복(03:34 → synth_073_p) | 49~53 (일시 77.6) | PASS (+20 미만) |
| 절대 상한(합의 기준) | 허브 GL 최고 77.6(지도 전환 직후 일시) · PSS 최고 753 | PASS (<100 · <850) |

**판정**: 은하 왕복 뒤의 GL 상승은 회차마다 쌓이는 계단이 아니다. 허브 진입 때(ingress reclaim) 다시 내려가고 50MB 안팎에서 고원을 이룬다. 다만 포그라운드에서는 Skia GPU 캐시를 비울 수단이 없다. 장시간 PSS 바닥(Native 380~410MB)은 별건으로 계속 관찰한다.
**FAIL일 때만 착수할 후속(기록만)**: ① patch-package로 RN Skia OpenGLContext 생성 직후 `setResourceCacheLimit(48~64MB)` ② STAGE 전환 때 `purgeUnlockedResources` JSI 진입점. 둘 다 APK 재빌드 필요 → 대표님 승인 필요.

## 4-4. 야간 소크 — 은하 지도 연속 체류 6.5시간 (03:39~10:13 · pid 20711 · 크래시·재시작 0)

표본: `soak-overnight-20261009.csv`(03:39~03:57) · `soak-overnight2-20261009.csv`(03:58~10:13, 60초 · unknown/dalvik/bitmap 열 추가) · `meminfo-galaxy-soak-20261009-0346.txt` · `gfxinfo-galaxy-soak-20261009-0346.txt`

| 시간대 | PSS | GL | Native PSS | Unknown | Dalvik |
|---|---|---|---|---|---|
| 03시 | 831~851 | 174.5 | 386~396 | 86~90 | 28~31 |
| 04시 | 826~922 | 174.5~183.7 | 385→**469** (04:18:46 +74) | 86~87 | 22~32 |
| 05~07시 | 894~922 | 181.7~185.7 | 460~467 | 86 | 22~32 |
| 08시 | 844~908 | 181.6~185.7 | 467→**240** (08:55:53 −164·−62) | 75~86 | 21~30 |
| 09~10시 | 853~885 | 181.6~183.6 | 256~276 | 69~71 | 12~28 |

- **04:18:46 계단 1회**(Native PSS +74 · GL +7). 그 뒤 4.5시간 동안 추가 상승 없음. SvgView는 같은 인스턴스 `f9384c3`이고 크기 4610×5034도 그대로(10:15 확인) → 크기 변경으로 비트맵을 다시 만든 것은 아님. 04:18 전후 logcat은 기기 버퍼에서 이미 밀려나 원인 이벤트는 미확정.
- **08:55 하락은 해제가 아니라 swap**. 같은 시각 기기 전체에 Play 스토어 업데이트·다수 프로세스 기동이 있었음(ActivityManager). 10:15 meminfo: Native Heap PSS 269.7MB · **SwapPss 207MB** · TOTAL SWAP PSS 235MB · RSS 770 < PSS 891.
- **실제 할당량(Heap Alloc)**: 03:46 444,208KB → 10:15 451,116KB = **6.5시간 동안 +6.9MB(시간당 약 1MB)**. Bitmap (malloced)는 내내 1장(88.5MB).
- 판정: **누적 계단 누수 아님.** PSS의 계단과 하락은 이미 잡힌 힙 페이지가 상주하느냐 swap되느냐의 차이다. 다만 시간당 +1MB의 느린 Heap Alloc 증가와 04:18의 상주 +74MB 원인은 미확정이다. 다음 소크에서 Heap Alloc 열을 추가하고 logcat 전체를 파일로 남겨 다시 본다.
- **김클로드 재검수 AGREE + 정정 반영(10:20)**:
  1. 04:18:46 같은 샘플에서 **views 181→175**(이후 유지) → 무조작 계단이 아니라 게임 쪽 UI 이벤트가 계기다(김플레이 CSV 재확인). views 175↔178 변화는 06:19~06:38 · 08:18~08:38에도 있었지만 이때는 메모리 계단이 없었다.
  2. swap은 여유가 아니다. TOTAL PSS는 SwapPss를 포함하므로 08:55 이후에도 862~870이 남았다. 소크 시작 대비 순증 약 +30MB이고 대부분 04:18분이다. 모니터 950 판정도 TOTAL PSS 기준이다.
  3. 세션 cron에 기대지 않는다 → 샘플러 자체에 임계 알림과 스냅샷을 넣은 `tools/play-bot-console/soak/soak-watch.ps1` 작성. logcat 전체 상시 파일 캡처, views 변화·PSS≥900·GL≥200·Native 한 샘플 +40MB·pid 변경 시 스크린샷+meminfo+gfxinfo 저장, `alerts.log` 기록. 열: swap_pss_mb · native_alloc_mb 추가. 자체 시험 PASS.
- 점검 한계: 30분 주기 점검 예약(cron)이 세션에서 실행되지 않아 밤사이 실시간 보고를 못 했다. 샘플러는 끝까지 정상 기록했다.
- 고원 위험은 그대로: 지도 체류 PSS 최고 921.9(04~06시) → 모니터 PSS 한도 950까지 28MB. → **RASTER_SCALE 1→0.85/0.75(대표님 확인 필요)** 우선순위 상향.

## 4-5. 은하 지도 1안 — 라벨 분리 + SVG 래스터 0.75 (대표님 승인 · 2026-10-09 낮)

원인: react-native-svg(Android)는 지도 판 전체(4610×5034)를 비트맵 1장으로 굽고, HWUI가 GPU 사본을 한 장 더 든다. 내용(노드·글자)과 무관하게 판 크기로 정해진다. 글자도 같은 비트맵에 구워져, 배율을 낮추면 흐려졌다(10-02 0.5 실패).

수정 (김플레이 · 김클로드 검수 PASS):
- `GalaxyMapSystemsSvg.tsx`: 복구 스위치 `GALAXY_MAP_LABELS_AS_RN_TEXT = true`. 라벨 규칙을 `resolveSystemLabel()` 하나로 모으고, `GalaxyMapSystemLabelsOverlay`(RN Text · allowFontScaling false · key=system.id)를 추가했다.
- `GalaxyMapTerritoryOccupationLabelsSvg.tsx`: `GalaxyMapTerritoryOccupationLabelsOverlay`(RN Text) 추가. 스위치 ON이면 SVG 쪽은 null.
- `worldmap.tsx`: `</Svg>` 뒤 같은 카메라 View 안에 두 오버레이를 넣었다.
- `galaxyMapZoomLadder.ts`: `GALAXY_MAP_SVG_RASTER_SCALE` 1 → 0.75(주석에 근거·복구 조건 기록) · test:161 갱신.
- 배경 그림(성운 등)은 SVG 안에 넣지 않고 별도 이미지 층으로 둔다(코드 주석에 원칙 기록).

검증:
- tsc PASS · galaxyMap 테스트 48/48 · audit:skia-memory 31/31.
- 라벨 OFF/ON 캡처: 위치 일치(기준선 −7.5) · 퀘스트 마크 겹침 없음 · 국가명 대비 동등. 노드 안쪽 점 색 차이는 개척 허브 펄스(의도된 연출) 위상 때문.
- 래스터 화질(최대 줌 원본 픽셀 확대): 0.75 ≈ 1.0 · 0.6 경미하게 부드러움 · 0.5 링 번짐 → 0.75 채택. 캡처: `tools/play-bot-console/logs/sdk54-upgrade/galaxy-raster-compare-20261009/`

실측 (콜드스타트 pid 19243 · 1초 샘플 `r075-galaxy-to-hub-1s.csv` · `r075-entry-peak-1s.csv` · gfxinfo/meminfo 스냅샷):

| 은하 지도 | 래스터 1 (야간 소크) | 래스터 0.75 | 차이 |
|---|---|---|---|
| Bitmap (malloced) | 90.6MB | 49.8~51.0MB | −40MB |
| HWUI GPU Texture | 104.6MB | 49.8MB | −55MB |
| GL mtrack 체류 | 174~186MB | 84~97MB | 약 −90MB |
| PSS 체류 | 832~922MB | 748~761MB | 약 −85~160MB |
| PSS 최고(지도 진입·전환 순간) | 931 (03:21) | 806 (15:12:31) | −125 |
| PSS 최고(측정 전체 · 김클로드 정정) | 931 | **835.6** (15:17:11 · 허브 views 352) | 950까지 여유 19 → **약 114MB** |

- **정정(김클로드 재검수)**: 처음 보고한 「최고 806 · 여유 144」는 지도 구간만 본 값이었다. 같은 CSV 전체 최고는 허브에서 나왔다(825.3 · 831.6 · 835.6). 원인은 아래 신규 P1(Hermes 힙)이다.
- **신규 P1 — Hermes JS 힙(hades-segment) 단조 증가**: pid 19243 Unknown 0.9(11:30) → 44 → 77(12:07, 대기 화면에서도 약 1MB/분) → 117(15:11) → 152(15:17) → 155(15:2x). smaps에서 [anon:hades-segment] 149MB가 Unknown과 일치(김클로드 run-as 확인). 래스터 절감분을 몇 시간 안에 잠식하는 속도다. js_allocatedBytes(실사용)와 js_heapSize(확보량)를 나눠 기록해 「누수 vs GC 지연」을 판정한다. dev 전용(console.log·HMR·LogBox) 여부도 함께 본다.

- 지도를 떠나면 비트맵이 바로 해제된다(49.8 → 5.3, 15:11:23 착륙).
- 남은 백로그: 1380 SurfaceTexture 잔류(약 15MB, RN Skia native) · svg HARDWARE 비트맵(CPU 사본 제거 후보) · routeLabelText allowFontScaling 누락.

## 5. 별건 (본 루프와 분리)

- **모니터 incident logcat 0바이트**: `incident-logcat-20261009-*.log` 5개가 전부 비어 있다. 원인 추적 근거가 남지 않는다 → 김경제 `long-run-monitor` 점검 필요.
- **PSS 바닥 950MB 문제는 그대로**: 23:23 이전에도 허브 PSS 950~1000(Native 450~475MB)에서 `GL_HARD_CEILING`이 나왔다(22:51 · 10-08 10:21 등). 은하 지도 P0(`kim-play-p0-galaxy-map-memory-step-20261008.md`)와 같은 Native 축이다. volatile 수정으로는 해결되지 않는다.
- 21:03 APP CRASH 1건: 원인 미확인.
