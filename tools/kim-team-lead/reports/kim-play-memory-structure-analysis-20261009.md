# 플레이 누적 메모리 구조화 분석 + 총괄 작업계획 재수립 (김플레이 · 2026-10-09 22:5x · 코드 변경 없음)

대표님 지시(22:4x): release 상태에서 PSS가 300MB대에서 500MB대로 올라간 뒤 내려오지 않는다. 필요할 때 올라갈 수밖에 없는 것과 해제되어야 하는 것을 구분하고, **행성 허브를 기준으로** 플레이 액션이 쌓여도 한계치 안에서 관리되도록 구조를 만든다. 이번에는 분석과 계획만 한다.

원본
- 모니터 meminfo(16분 간격): `tools/long-run-monitor/logs/meminfo-20261008-230640.log` 5636~6236행(pid 5540)
- logcat 덤프: `tools/play-bot-console/logs/soak/release-play-20261009-2245/logcat-dump.txt` · 현재 meminfo: 같은 폴더 `meminfo-now.txt`
- 빌드: release-perf(20:21 빌드 · E6 1단계 미포함)

## 1. 대표님 플레이 동선과 축별 메모리

| 시각 | 위치·직전 동작 | PSS | Native PSS | **Native 살아 있는 할당** | GL | EGL | Unknown | Views |
|---|---|---|---|---|---|---|---|---|
| 20:27 | 아르카디아 허브 · 콜드스타트 직후 | 285 | 82 | 77 | 26 | 24 | 31 | 400 |
| 21:31 | 아르카디아 허브 · 무조작 63분 | 373 | 128 | 101 | 39 | 43 | 46 | 392 |
| 21:47 | **은하 지도**(21:45 진입) | 424 | 135 | 135 | **98** | 28 | 45 | 169 |
| 22:03 | 베가 허브 · 21:48~21:49 아르카디아↔베가 **빠른 왕복 4회** 뒤 | 449 | 168 | **159** | 56 | 43 | 53 | 392 |
| 22:19 | 베가 허브 체류 | 448 | 176 | 158 | 51 | 43 | 53 | 413 |
| 22:35 | 베가 허브 · 22:31 **웨이브 전투** → 22:33 지도 출입 뒤 | 505 | 203 | **181** | 70 | 43 | 50 | 432 |
| 22:4x | synth_052 허브 · 지도 경유 이동 뒤 | 471 | 202 | 176 | 50 | 29 | 56 | 363 |

Hermes(JS): GC 직후 사용량 20~33MB로 평탄 · 예약 영역만 28 → 48MB(Unknown 축 +5~10). **JS는 이번 누적의 주원인이 아니다.**

## 2. 판정 — 무엇이 쌓였나

21:31 허브 기준(373) 대비 22:35에 +132MB가 늘었고, 축별 내역은 다음과 같다.

| 축 | 증가 | 성격 | 근거 |
|---|---|---|---|
| **Native 살아 있는 할당** | **+80** | **해제되지 않음(누수 또는 상한 없는 상주)** | 허브 무조작 63분 동안 평탄(20:43~21:31: 96~127, 톱니) → 지도·허브 왕복 뒤 159(+58) → 전투 뒤 181(+22). 허브로 돌아와도 내려오지 않는다. free된 페이지가 아니라 **살아 있는 할당**이라 heap purge(`mallopt`)로는 반환되지 않는다 |
| GL(드라이버 텍스처) | +12~30 | 상한 없는 캐시 + 일부 잔류 | 지도에서 98 → 허브 복귀 56(기준 39보다 +17 잔류). RN Skia 2.2.12는 GrResourceCache 한도 API를 노출하지 않는다(Skia 기본값 256MB) |
| Unknown(Hermes 예약) | +4~10 | 상한 있는 예약 | GC 직후 사용량은 평탄. 예약 영역은 Hermes 정책에 맡겨진다 |
| Bitmap(malloced) | 0 | **STAGE 이탈 시 정상 해제** | 지도 50.9MB → 허브 5.5MB로 복귀(10-08 SVG opacity 비트맵 수정이 유효함) |
| Dalvik · views | 0 | 정상 | views는 허브마다 363~432(지도 169) |

- **허브 체류 자체는 쌓이지 않는다**(20:28~21:31 release 무조작 평탄, E6 판정 §3-2와 같다).
- **누적은 「전환 이벤트」에서 생긴다**: 지도 왕복 · 빠른 허브 hop · 웨이브 전투 · 이동 중 전투. 그리고 허브로 돌아와도 원래대로 돌아오지 않는다.
- 회수 장치가 닿는 축(Fresco 비트맵 · scudo free 페이지)은 이미 회수되고 있다. **쌓이는 축(Native 살아 있는 할당 · GL 잔류)에는 회수 장치가 없다.** 회수 패스를 더 돌려도 해결되지 않는 이유가 이것이다.

### 2-1. 원인 후보 (확정 전 · 귀속 측정 필요)
| 후보 | 근거 | 반박·불확실 |
|---|---|---|
| RN Skia 네이티브 상주(Canvas·surface·Picture·이미지 CPU 사본·SkResourceCache·글리프) | 전환마다 Canvas mount/unmount가 반복된다(성운 · 드론 trail · 전투 · 이동 전투 백드롭 `useImage` 4장) | SkImage·SkPicture는 Hermes에 외부 메모리 크기를 알린다(JsiSkImage.h:276) → ext_mb는 5~11로 작다. **JS가 잡고 있는 Skia 객체는 원인이 아닐 가능성이 크다** → 네이티브 내부 상주(컨텍스트·surface·캐시) 쪽이 남는다 |
| 1380 SurfaceTexture 잔류(약 15MB · gralloc) | 김클로드 인벤토리 §4-1 · `RNSkOpenGLCanvasProvider` 전역 참조 | Canvas 생성 횟수에 비례해 쌓이는지는 미측정 |
| react-native-svg 지도 렌더 잔여 | 지도 진입 때 native +26(10-08 측정) | Bitmap 축은 복귀했다. Path·Yoga 등 네이티브 잔여는 미측정 |
| 행성별 캐시(행성마다 하나씩 남음) | 대표님 우려 「각 행성 허브가 모두 누적」 | 21:48 왕복은 **같은 두 행성**만 오갔는데도 +58이었다 → 행성 수보다 **전환 횟수**에 비례하는 쪽이 유력(재현 실험으로 확정) |
| 시스템 trim에 반응하는 상주분 | 22:50 `send-trim-memory RUNNING_CRITICAL`에서 GL 114 → 47 · Native 할당 209 → 152 | **이동 중 전투(22:49:52~22:50:27)와 겹쳐 무효** → 무조작 조건에서 다시 실험 |

## 3. 구조화안 — 「허브 기준선」 메모리 3계층

**원칙: 어느 행성 허브에 도착하든, settle(약 30초) 뒤 메모리는 「허브 기준선 + 허용치」 안으로 돌아와야 한다. 직전에 무엇을 했든(지도 · 전투 · hop) 마찬가지다.**

| 계층 | 정의 | 대상 | 관리 방식 | 완료 기준 |
|---|---|---|---|---|
| **L1 STAGE 소유** | 해당 STAGE에서만 필요하고 이탈하면 0이 되어야 함 | 지도 SVG 비트맵 · 전투 Canvas·Picture·이미지 · 이동 전투 백드롭 · 드론 trail | STAGE dispose(기존 `planetSessionRegistry`) + 이탈 직후 1회 회수(E6 스케줄러로 통합) | 허브 복귀 잔여 ≈ 0(Δ ±5MB) |
| **L2 상한 캐시** | 다시 쓰면 빠르므로 남겨도 되지만 **천장**이 있어야 함 | Skia GrResourceCache(GL) · 성운·행성 이미지 캐시 · Hermes 예약 · scudo free 페이지 · 글리프 | 캐시마다 상한값을 명시(CSV 또는 정책 상수) + 상한을 넘으면 LRU로 제거 + 허브 ingress 시 「keep = 현재 행성」만 유지 | 전환을 N회 반복해도 **평탄(plateau)** |
| **L3 누수** | 해제 경로가 없음 | 현재 Native 살아 있는 할당 +80의 미귀속분 | 원인 할당을 찾아 근본 수정(회수 패스로 덮지 않음) | 왕복 10회에서 기울기 0 |

**허브 예산(제안 · 수치는 실측 뒤 대표님 확정)**
- 허브 기준선 = 콜드스타트 직후 허브 30분 체류 floor(오늘 release: PSS 약 375 · Native 할당 약 100 · GL 약 39).
- 허브 복귀 허용치 = 기준선 + L2 상한의 합(예: +60MB). 넘으면 모니터가 「허브 잔여 초과」로 경고하고 다음 전환 때 deep 회수를 1회 실행한다.
- 전역 천장 = 현재 soft zone(800~950MB)보다 낮게 다시 잡는다(예: 600 soft · 750 hard). L3를 없앤 뒤 확정한다.

**측정 단위 — 「허브 복귀 잔여」**
- 허브 `route_focus` 30초 뒤 meminfo 1회 → (PSS · Native 할당 · GL · Unknown) − 기준선. 직전 액션(지도 왕복 · hop · 웨이브 · 이동 전투 · 행성 변경)으로 분류해 누적한다.
- 도구 쪽에서만 구현한다(모니터가 logcat `route_focus`를 보고 adb meminfo 실행). 게임 코드는 바꾸지 않는다.

## 4. 귀속(누가 Native를 잡고 있나) 방법

release 빌드는 debuggable이 아니어서 `am dumpheap -n`·malloc debug를 쓸 수 없다.
1. **profileable release + Perfetto heapprofd**(Android 10+): 매니페스트에 `<profileable android:shell="true"/>`만 추가하면 release 성능 그대로 네이티브 할당 콜스택을 얻는다. 전환 전후 diff로 L3 소유자(Skia · RN · svg · Hermes)를 특정한다. → **매니페스트 변경 + 재빌드 = 대표님 승인 대상**.
2. 재현 실험 3종(같은 빌드 · 무조작 구간 포함):
   - A: 같은 두 허브 왕복 10회 → 선형으로 늘면 전환당 누수, 평탄해지면 L2 캐시
   - B: 서로 다른 허브 5곳 순회 → 행성 수에 비례하면 행성별 캐시
   - C: 웨이브 전투 5회 · 이동 중 전투 3회 → 전투 STAGE의 L1 잔여
   - 각 실험 끝에 무조작 상태에서 `send-trim-memory` → trim에 반응하는 몫 = 「요청하면 해제 가능」(L2 후보)

## 5. 김클로드 마지막 보고 재검수 (handoff 상단 · e6-hub-reclaim-dedupe-step1)

| 항목 | 판정 | 근거 |
|---|---|---|
| 「미기록 미커밋 변경 발견」 | 정정 | 김플레이가 21:3x 크레딧 중단 재개 후 직접 반영했고 `kim-play-efficiency-audit-20261009.md` §3-2에 기록함 |
| flying→0 트리거 제거 「미착수」 | **DISAGREE** | `app/(game)/planet.tsx` 웨이브 종료 effect에서 이미 제거함(진입점은 vfx_cleared 1개). 김클로드는 nativeReclaim 2파일만 확인했다 |
| audit 미실행 | 정정 | 김플레이가 audit:skia-memory 31/31 · 정책 테스트 2건 실행함 |
| bypassCoalesce면 soft가 항상 true → settle 경로 trim 유실 없음 | AGREE | runPlanetHubSoftNativeReclaimPass.ts:27 |
| 웨이브 뒤 Native floor 실측 필요 | AGREE | 이번 release-perf 빌드에 E6가 들어 있지 않음 → 다음 빌드에서 측정 |

## 5-1. 압박 플레이 중간 확인 (22:58~23:45 · `logs/soak/press-play-20261009-2310/`)

대표님 지적: 성계를 이동하면 이전 성계의 플레이 기록은 저장하되, 메모리 할당과 그래픽 처리는 완전히 비워야 한다.

**(1) 성계 이동 시 이전 성계 자원 처리 — 그래픽 해제 경로 없음 (확인)**
- `galaxyMapStageSession.ts:131-148`(`system_change`)은 이전 성계 행성의 **JS 데이터만** 비운다(memo · 성운 프로필).
- RN Skia GPU 컨텍스트(`node_modules/@shopify/react-native-skia/android/cpp/rnskia-android/OpenGLContext.h:184-197`, 스레드별 `thread_local`)는 **캐시 한도 없이** 만들어진다(Skia 기본 GrResourceCache 256MB). JS에는 purge 수단이 없다 → 이전 성계·STAGE의 텍스처가 한도 안에서 계속 남는다(GL 잔류와 일치).

**(2) View 누수 (신규 · 확정)**
- meminfo `Views`(ART가 GC 뒤 셈 = 도달 가능한 View 객체 수): 494(22:58) → 836(23:01, 아르카디아 허브 전투 orbit·시설 출입) → 1,262(23:02, eden_city 도착) → 1,275(23:13) → **2,161(23:32, 베가 허브)**.
- 같은 시각(23:40) 화면 트리에 실제로 붙어 있는 View는 **457개**(`activity-top-2340.txt`, ReactViewGroup 255 · ReactTextView 119 · svg 52 · Screen 2). → **약 1,700개가 화면에서 떨어졌는데도 참조가 남아 있다.**
- 스택 누적은 아니다: 시설은 `router.push` → `useSafeRouterBack`이 `router.back()`으로 복귀(`src/navigation/useSafeRouterBack.ts:24-25`). STAGE 전환은 모두 `replace`.
- 대표님은 주로 허브에 머물렀다 → 허브 체류 중 액션(전투 orbit · 시설 출입 · 행성 도착)에 따라 계단식으로 늘어난다.
- release는 Java 힙 덤프가 막혀 있다(`am dumpheap` → SecurityException not debuggable) → 소유자 특정에는 profileable(또는 진단용 debuggable) 빌드가 필요하다.

**(3) 백그라운드 회수 단서**
- 23:13~23:32 무선 adb가 끊긴 동안 화면이 꺼짐 → 앱이 백그라운드로 내려감 → PSS 544 → 440~462, Native PSS 231 → 116~126.
- Android의 trim(UI_HIDDEN) 처리와 surface 해제로 **약 100MB가 풀렸다** = 해제할 수 있는 메모리인데 게임이 포그라운드에서 스스로 비우지 않는다. 후보는 HWUI 렌더 캐시 · TextureView surface · Fresco · RN.
- 22:50 trim 실험은 이동 중 전투와 겹쳐 무효였다 → 허브 무조작 상태에서 다시 실험해야 한다.
- **[정정 · 23:47 대표님 홈 버튼 실험 · `bg-test-3s.csv`]** 앱이 앞에 있을 때 adb trim은 거부된다(UI_HIDDEN: foreground 불가 · RUNNING_CRITICAL: 22:50에 이미 같은 단계). 그래서 홈 버튼으로 실제 백그라운드 전환을 측정했다.
  - 백그라운드: PSS 478 → 415(−63) · Native 사용 180 → 131 · GL 48 → 32 · EGL 43 → 23.5.
  - **복귀 후 10~60초 안에 거의 전부 원래대로 돌아왔다**(478 · 175 · 50.5 · 43.3). → 풀린 몫은 「현재 화면 작업 메모리」이고 누적분이 아니다.
  - **View 2,161은 백그라운드 중에도 그대로였다** → 앱 코드의 참조 누수가 확정이다.
  - 23:13~23:32의 「약 100MB 해제」는 그 사이 허브를 옮긴 효과와 섞인 값이라 철회한다.
  - 결론: 안드로이드 백그라운드 방식을 그대로 쓰면 효과가 일시적이다(보조 수단). 1순위는 View 누수 근본 수정 → Skia GPU 상한·전환 purge → Native 소유자 특정 순이다.

## 6. 총괄 작업계획 재수립 (2026-10-10~)

| 순위 | ID | 작업 | 담당 | 코드 | 승인 |
|---|---|---|---|---|---|
| P0 | M1 | 「허브 복귀 잔여」 자동 측정(모니터 · route_focus +30초 meminfo · 액션 분류 표) | 김플레이 | 도구만 | — |
| P0 | M2 | 재현 실험 A·B·C + 무조작 trim(§4-2) — 이번 release-perf 빌드로 가능 | 김플레이(대표님 플레이 병행 가능) | 없음 | — |
| P0 | M3 | profileable release 빌드 + heapprofd로 L3 귀속 | 김플레이 | 매니페스트 1줄 + 재빌드 | **대표님** |
| P0 | M4 | 3계층 레지스트리 설계 — L1(STAGE dispose 목록 전수) · L2(캐시별 상한표, Table-First) · 허브 예산 수치 | 김플레이 설계 · 김클로드 L1 목록 초안 | 문서 | 대표님(수치 확정) |
| P1 | M5 | L3 근본 수정(M3 결과에 따라) · GL 상한(RN Skia GrResourceCache 한도 patch-package — 네이티브 재빌드) | 김플레이 | 있음 | **대표님**(네이티브 패치) |
| P1 | E6-2 | 회수 스케줄러 단일화 2단계 → 「허브 ingress 체크포인트」(1회 회수 + 잔여 기록)로 M1과 통합 | 김플레이 | 있음 | — |
| P1 | D1 | dev 빌드 재측정(RDT OFF · E6 1단계 포함) — 10-10 중 | 김플레이 | 없음 | — |
| P2 | — | 드론 레이어 동기 렌더(publish 25~75ms) · TEMP-DIAG `[arc-hitch-split] drone` 제거(커밋 전 필수) · E6 신호 모듈 삭제 판단 | 김클로드 초안 → 김플레이 | 있음 | — |
| 보류 | — | CLAUDE.md READY 표의 경제·분쟁·대사창 등 | — | — | 메모리 P0 종료 후 재배정 |

- 순서: M1 → M2(오늘 빌드로 바로 가능) → M3(승인 후 빌드 1회에 E6·D1 검증을 함께 실음) → M4 → M5.
- 참고: 자정 데일리 커밋은 현재 미커밋 변경 전체를 스냅샷한다(TEMP-DIAG 포함 · dev 전용이라 release 영향 없음).
