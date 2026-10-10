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

## 5-2. 초기화 후 압박 플레이 전수 분석 (2026-10-09 23:58 ~ 10-10 00:18 · pid 24055 · `logs/soak/press-reset-20261010-2357/`)

5초 간격 meminfo 218회 · 이벤트 84건(`events.txt`) · 대표님 행동 기록을 맞춰 보았다.

| 행동 | 결과 | 판정 |
|---|---|---|
| 앱 시작 → 아르카디아 허브 첫 도착 | PSS 249 → 334~354 · Native 사용 87~100 · GL 35~49 · View 약 400 | **허브 기준선** |
| 허브 전투(orbit) ×2 | 종료 뒤 Native **+20~25** 잔류(2회 재현), 바닥이 돌아오지 않음 | **잔류(L3 후보) — 김클로드 독립 분석 중** |
| 이동 중 전투 ×2(STAGE 3) · 패배 귀환 | 전투→지도→전투 뒤 시작값 같음(PSS 약 505~524 · Native 180~188) | 정상(L1 해제됨) |
| 교역소 진입·광물 판매·퇴장 | View 387 → 468 → 381 · Native·PSS 원복 · GL +6 | 정상(GL 소폭 잔류) |
| 조선소 진입·퇴장 | View 381 → 935 → 382~403 · Native +15~20 | View 정상 · Native 소폭 |
| 메신저·바·통신 창 | Bitmap 7.5 → 2.0 원복 · View 원복 · **GL +10~17 잔류** | GL 잔류(L2 · Skia GPU 캐시) |
| 행성 정보·개발 창 · 위성 설치 | 닫은 뒤 Native 205 → 178(원복 이상) | 정상 |
| 드론 웨이브(허브 체류 중 매분) | 웨이브마다 Native 톱니 +20 → 하락, **바닥 약 +2MB/분** · 끝난 뒤 GL +23(1회) | 잔류 소폭 |
| 은하 지도 진입 1·2·3차 | 지도 자원(Bitmap 51 · GL 110~125)은 매번 같음, 바닥만 1차 513 → 3차 약 610 | 지도 정상 · 이전 잔류가 따라옴 |
| 지도 안 성계 홉 ×4 | 홉마다 PSS 약 609 · Native 244 그대로 | **정상(누적 없음)** |
| 화면 전환 순간 | 허브 착륙 590 · 전투 진입 670 · 지도 복귀 654 | **겹침 최고치 +50~60**(이전 화면 해제 전에 다음 화면 할당) |
| 허브 5분 무조작 | PSS +5/분 · Hermes 확보 영역 53 → 65(+2.3/분) · GL·View 평탄 | Hermes 확보 영역 증가(이후 68 → 60으로 반환 관측 = 상한 있음) |
| View 누수 | 화면에 붙은 View 130·383 vs 살아 있는 View 138·395~414 | **이번 세션 재현 없음**(저녁 약 1,700은 장시간 세션에서만) |

- 결과: 20분 동안 허브 기준선 약 340 → 약 545(+205). 전환 최고 670.
- heap purge 효과 검증: 허브 체류 중 Native PSS − 사용량 = 대체로 5~20MB. 웨이브 끝(`vfx_cleared`)마다 purge가 돌아 반환되고 있다. 단 **드론 웨이브가 없는 허브와 허브 착륙 직후에는 purge 경로가 없다**(호출처는 지도 route_blur와 vfx_cleared 두 곳뿐).

### 반영 1차 (2026-10-10 00:2x · 김플레이 · 미커밋 · 실기 전)
| 파일 | 내용 | 기대 |
|---|---|---|
| `node_modules/@shopify/react-native-skia/android/cpp/rnskia-android/OpenGLContext.h` | GrDirectContext 생성 직후 `setResourceCacheLimit(64MB)`(기본 256MB) | GL 잔류 상한 |
| `.../OpenGLWindowContext.cpp` `present()` | 120 present마다 `performDeferredCleanup(10s)` — 10초 넘게 안 쓴 GPU 자원 해제(프레임당 할당 0) | 닫힌 창·이전 STAGE 텍스처 상주 해제 |
| `patches/@shopify+react-native-skia+2.2.12.patch` | patch-package(생성 중) | 재설치 시 유지 |
| `modules/arcfire-native-memory/src/index.ts` | `scheduleNativeHeapPurgeAfterSettle(delayMs=2500)` 추가(디바운스 1회) | 진입 후 이전 화면 해제분 반환 |
| `src/game/nativeReclaim/planetHubIngressReclaim.ts` · `galaxyMapIngressReclaim.ts` | STAGE 진입 정리 끝에 settle purge | 착륙 직후 빈 페이지 반환 |
| `src/game/nativeReclaim/runPlanetHubSoftNativeReclaimPass.ts` | 5분 soft 뒤 settle purge | 웨이브 없는 허브의 반환 경로 |
| `android/app/src/main/AndroidManifest.xml`(로컬 · git 미추적) | `<profileable android:shell="true"/>` — heapprofd 진단 빌드 전용 | Native 소유자 콜스택 |

- 자가 점검: 대표님이 권장안을 승인함(00:3x) → tsc exit 0 · `git apply --check -R` 패치가 node_modules와 일치. patch-package는 RN Skia 패키지가 커서 실패 → 바뀐 두 파일만 담은 패치를 직접 작성.

### 김클로드 독립 분석 재검수 (`kim-claude-hub-combat-orbit-residual-20261010.md`)
| 주장 | 판정 | 근거 |
|---|---|---|
| 전투 Native 톱니는 JS Hermes GC 묶음이 아니다 | **AGREE** | 10-10 release `[MEM_HEAP]` hermes_ext 1~11MB 평탄(전투 00:00·00:07 포함) |
| `PlanetCapitalCombatRoot`가 Fragment ↔ Binder로 바뀌어 전투 시작·종료마다 허브 서브트리 전체가 재마운트된다 | **AGREE** | `src/game/planetCapitalCombatIntegration.tsx:60-74` 요소 타입 교체 → React 재마운트 |
| Binder는 비활성이면 통과 래퍼다 | AGREE(직접 확인) | `PlanetEdenRaidTestLayer.tsx:3059-3079` 버퍼 비움 · `:3209` 루프 미실행 · `:4157-4173` value=null |
| RN Skia `<Canvas>` + Reanimated 경로의 Recorder가 picture를 UI 런타임 GC에 묶는다(P1 = SkiaPictureView 명령형) | PARTIAL(가설 · 미계측) | 코드 경로는 그럴듯하다. 실측 확정 전이고 변경 범위가 커서 1차 빌드에서는 제외 → 진단 빌드 heapprofd로 확인한 뒤 결정 |
| 모듈 캐시(`_combatPictureRecorder` 등)는 주원인이 아니다 | AGREE | 수십 KB 이하이고 해제 경로가 있다 |

**반영(김플레이 · P2안 변형):** `planetCapitalCombatIntegration.tsx` — Binder를 한 번 불러온 뒤에는 비활성이어도 계속 감싼다(`if (!Binder) return <>{children}</>`). 전투 종료마다 일어나던 허브 서브트리 재마운트가 0회로 줄고, 첫 전투 진입 때 1회만 남는다. tsc exit 0. 위험: 전투 경계의 하위 state 초기화에 의존하던 UI → 실기에서 확인.

**김클로드 재마운트 의존 감사(리포트 §6) 재검수 · 보완**
| 항목 | 판정 | 보완 |
|---|---|---|
| A1: 종료 홀드(800ms) 뒤 `hubOrbitCombatResultSession.questOrbit`를 읽는데, 그 사이 Binder 비활성 정리(`resetHubOrbitCombatResultSession`)가 초기화할 수 있다 → 퀘스트 전투 부제 대신 일반 부제가 나온다 | AGREE(`PlanetEdenRaidTestLayer.tsx:3442-3466`) | `questOrbit`를 홀드 전에 지역 변수로 받아 둠 |
| B1: 전투 시작 때 재마운트가 없어져 sticky dodge 오버레이(Canvas 1장 · 이미지 3장)가 전투를 지나도 유지된다 → 전투 뒤 기준선 상승 | AGREE(`planetHubSubcomponents.tsx:374-376`) | `showEdenRaidTest`가 켜질 때 latch·mounted·ready를 해제하는 effect 추가(기존 blur effect와 같은 패턴) |
| context null · 언마운트 cleanup 의존 · 그 밖의 항목 | AGREE(무해) | — |

- tsc exit 0 · audit:skia-memory 31/31.

## 5-3. 수정 1차 빌드 압박 플레이 + heapprofd · Java 힙 덤프 (2026-10-10 01:05~01:30 · pid 30826 · `logs/soak/press-fix1-20261010-0100/`)

빌드: 진단 release(profileable · RN Skia GPU 캐시 64MB + deferred cleanup · settle purge · `PlanetCapitalCombatRoot` 트리 고정 · A1/B1 보완). **주의:** 측정 플래그가 번들에 전달되지 않아 JS 이벤트 로그(`MEM_PROFILE`)가 없다 → 구간은 meminfo로만 판정.

**(1) View 누수 재현 · 붙잡는 주체 확정**
- 01:25~01:28 지도 ↔ 이동 중 전투 반복 구간에서 살아 있는 View가 557 → 1,729로 늘었다. 01:29 아르카디아 허브: 살아 있는 View 1,796 vs 화면에 붙은 View 400.
- Java 힙 덤프(`arc-java-0130.pftrace` 34.8MB · perfetto java_hprof):
  - `ReactViewGroup` 839 · `ReactTextView` 815, 이 중 Fabric `SurfaceMountingManager$ViewState`(등록된 View)는 444.
  - 부모가 없는 덩어리 꼭대기 26개를 붙잡는 실제 참조는 **`SurfaceMountingManager$ViewState.mView` 하나뿐**이다(WeakReference·자기 헬퍼 제외). 즉 화면 트리에서는 빠졌지만 Fabric이 Delete를 받지 못해 등록표에 남은 **고아 View**다.
  - 덩어리 크기가 같은 모양으로 반복된다: 객체 715/714/711 · 622×3 · 638/637/549 · 텍스트 75×5 · 105~106×7. → **같은 화면이 여러 번 만들어지고, 그때마다 이전 인스턴스가 고아로 남는 패턴.** 이동 중 전투 반복과 일치한다.
- 네이티브 비용: heapprofd(24분) 해제되지 않은 할당 중 `libhwui` 64.2MB(7분 시점 18.8MB)는 RenderNode·DisplayList(`RecordingCanvas`·`drawRenderNode`·`sk_malloc`)다. 고아 View의 그리기 기록이 남은 몫으로 판단한다(근거 중).
- 가설(미확정): react-native-screens 4.16(Fabric) + `freezeOnBlur` + `animation:'fade'` 상태의 `router.replace`(지도 ↔ 전투)에서, 사라지는 화면의 하위 트리가 네이티브에서 먼저 떼어지고 Fabric Delete가 누락된다.
- 다음 단계: 어떤 화면인지 특정한다. ① debuggable dev 빌드에서 `am dumpheap`(문자열 포함 hprof)으로 고아 `ReactTextView`의 텍스트를 읽는다. ② 지도 ↔ 전투 replace를 `animation:'none'`으로 바꾼 A/B를 실험한다.

**(2) heapprofd(24분) 해제되지 않은 네이티브 할당 상위**
| 라이브러리 | 7분 | 24분 | 해석 |
|---|---|---|---|
| libhwui(View 그리기 기록 · 글자 · 비트맵) | 18.8 | **64.2** | 고아 View와 함께 증가 |
| librnskia | 5.4 | **40.1** | 단일 지점 26.5MB(`sk_malloc_flags`, 스택 해석 실패) — 이미지 1장(약 2,560² RGBA) 크기. 현재 허브 배경일 가능성 → 누수 단정 보류 |
| libreactnative | 13.9 | 18.5 | Reanimated 화면 노드 복제 · 브리지 데이터 |
| libhermes · libworklets · Mali | 2.9 · 3.8 · 2.8 | 8.7 · 7.1 · 4.0 | 소폭 증가 |

**(3) 1차 수정 효과(같은 조건 비교 불가 · 참고)**
- 허브 체류 GL: 수정 전 70~88 → 수정 후 52~61(약 −20, Skia GPU 캐시 상한 효과로 판단).
- 허브 PSS: 고아 View 누적 때문에 약 655로, 수정 전 같은 시점보다 높다. View 누수를 해결해야 1차 수정 효과를 분리해서 볼 수 있다.

## 5-4. View 누수 근본 원인 확정 · 수정 · 검증 (2026-10-10 01:30~02:45)

**원인 경로(Java 힙 덤프 3회 · perfetto java_hprof)**
- 누수 View의 대부분은 **닫힌 시설 화면(push → back)** 이다. `ScreensCoordinatorLayout` → `Screen` → `ScreenContentWrapper` → `SafeAreaView`(StageShell) → `ReactScrollView` → … 한 벌이 View 50~600개다.
- 붙잡는 경로: 닫힌 화면 안의 View 1~2개(스크롤 내용 컨테이너 또는 텍스트)가 Fabric `SurfaceMountingManager` 등록표(`mTagToViewState`)에서 지워지지 않음 → 그 View의 `mParent` 사슬이 화면 전체를 붙잡음 → 루트는 `FabricUIManager`(JNI 전역).
- 1차 빌드: 같은 화면 2벌(597 · 텍스트 311) + 52. 2차 빌드(시설 `freezeOnBlur:false`): 597 · 219 · 162 · 52 → **freeze 가설 기각**(변경 되돌림).
- 결론: 화면이 닫히는(pop) 과정에서 Fabric 삭제가 일부 누락된다(RN 0.81.5 · react-native-screens 4.16 · Android). RN 안드로이드 본체는 미리 빌드된 AAR이라 직접 수정하지 않는다.

**수정(3차 빌드 · JS)**
| 파일 | 내용 |
|---|---|
| `src/navigation/facilityExitTeardown.ts`(신규) | 시설 4종(trade·shipyard·bar·skilltree) 「나가는 중」 표시 · `useSyncExternalStore` · 3초 안전 해제 · 다시 열면(focus) 즉시 해제 |
| `src/stages/StageShell.tsx` | 나가는 중이면 내용 전체 대신 배경색 View 1개만 렌더(hook 이후 분기) |
| `src/navigation/useSafeRouterBack.ts` | 시설이면 표시 ON → 2×rAF → `router.back()`. 시설 화면 focus 동안 안드로이드 하드웨어 뒤로가기도 같은 경로(아크코어 대화창 처리기가 나중 등록이라 우선) |

**검증(3차 빌드 · pid 11963 · 02:28~02:43 · 시설 반복 출입 13회 · 지도·이동 중 전투 포함)**
| 항목 | 2차 빌드(수정 전) | 3차 빌드 |
|---|---|---|
| 허브 살아 있는 View | 1,500 | **438** |
| 남은 닫힌 화면 컨테이너 | 4벌 | **0** |
| 허브 PSS(약 15분 뒤) | 약 495 | **약 444~464** |
- tsc exit 0. 체감 변화: 시설 나가기가 2프레임 늦어지고, 닫히는 순간 배경색이 보인다.

**남은 항목(다음 라운드)**
1. 허브 전투(orbit) 잔류 수정(`PlanetCapitalCombatRoot` 트리 고정)의 단독 효과 재측정 — View 누수에 가려져 미분리.
2. 화면 전환 순간 겹침 최고치(이번 576 · 이전 670~754) — 이전 화면 해제 후 다음 화면 할당 순서.
3. RN Skia 26.5MB 단일 이미지 할당의 소유자(스택 해석 실패) — 허브 배경 크기 축소 또는 해제 시점 확인.
4. Hermes 확보 영역(Unknown) 45 → 80 상승 구간.
5. 같은 패턴이 STAGE `replace`(지도 ↔ 전투 ↔ 허브)에도 있는지 — 이번 덤프에서는 시설 화면만 확인됐다.
6. 측정 빌드 주의: `EXPO_PUBLIC_ARC_PERF_LOG=1` + `EXPO_PUBLIC_ARCFIRE_MEM_PROFILE=1` 두 플래그가 모두 필요하다. Gradle이 번들 단계를 UP-TO-DATE로 건너뛰므로 `:app:createBundleReleaseJsAndAssets --rerun`을 함께 실행한다.

## 5-5. 야간 체류 검증 (3차 빌드 · 아르카디아 허브 · 2026-10-10 02:46~10:29 · 7시간 43분)

원본: `tools/play-bot-console/logs/soak/overnight-arcadia-20261010/mem-5s.csv`(30초 간격 899회 · pid 11963 고정 · NOPROC 0 · 전 구간 화면 앞(FG))

| 시간대 | PSS | Native 사용량 | GL | Unknown | View |
|---|---|---|---|---|---|
| 02시 | 453~516 | 107~193 | 47~51 | 68 | 443~464 |
| 04시 | 411~450 | 106~159 | 40~53 | 53 | 443~471 |
| 06시 | 405~447 | 105~149 | 40~56 | 54 | 443~471 |
| 08시 | 386~441 | 108~156 | 40~56 | 52 | 443~471 |
| 10시 | 382~418 | 112~154 | 40~55 | 52 | 443~471 |

- 판정: **누적 없음.** 7시간 43분 동안 PSS 바닥이 약 450에서 약 380으로 오히려 내려갔다. Native는 톱니 모양이고 바닥은 105~112로 평탄했다. GL 40~56, Unknown 52~54, View 443~471로 모두 평탄하며, 크래시는 0건이다.
- 허브 드론 웨이브가 약 460회 반복됐는데도 바닥이 오르지 않았다. 10-09 저녁에 보인 「웨이브당 Native +2MB」도 이번 빌드에서는 재현되지 않았다.

### 10:48 덮어쓰기 사고 · 복구 (김플레이 · 대표님 권장안 A 승인)
- 경위: 10:48:18에 여러 파일이 HEAD(00:01 데일리 스냅샷) 내용으로 다시 쓰였다. 대표님 확인: 김팀장 세션의 미뤄진 UI 작업(함장정보 버튼)이 이 시각에 반영되면서 생긴 일이다. 김클로드 세션(4c)은 관여하지 않았다.
- 실제로 내용이 사라진 곳: `modules/arcfire-native-memory/src/index.ts`(`scheduleNativeHeapPurgeAfterSettle`) · `planetHubSubcomponents.tsx`(B1) · `PlanetEdenRaidTestLayer.tsx`(A1) · `docs/ops/차기_업무_목록.md`(ETC-TRANSIT-COMBAT-RATE). 그 결과 tsc가 3건 실패했다.
- 조치: 4곳 모두 검증된 내용으로 복구. 김팀장 변경(`PlanetMainPilotInfoPanel.tsx`)은 유지. 같은 시각에 다시 쓰인 그 밖의 파일(네이티브 모듈 cpp/kt · 생성 CSV 정책 · 외교 문서 · Cursor 규칙)은 HEAD와 내용이 같아 영향이 없다.
- 확인: tsc exit 0 · audit:skia-memory 31/31 · hubPeakBackdropRemountPolicy.test PASS. 기기 빌드(야간 검증본)에는 복구한 4곳이 모두 포함되어 있었다 → 검증 결과는 유효하다.

## 5-6. 다음 라운드 (2026-10-10 11:00~11:37 · 김플레이)

**데이터로 판정(코드 변경 없음)**
| 항목 | 판정 | 근거 |
|---|---|---|
| 지도·전투 replace 경로 View 누수 | 없음 | 3차 빌드 Java 덤프(02:44, 지도·이동 중 전투 이후) 남은 화면 컨테이너 0 |
| Hermes 확보 영역(Unknown) | 수정 불필요 | 플레이 중 45→80 이었다가 야간 52~54로 반환·평탄 = 엔진이 상한을 두고 관리 |
| RN Skia 26.5MB 단일 지점 | 누수 아님 | 앱 이미지 최대 1024²(4MB) → 이미지 아님. 콜스택이 1단계에서 끊겨 JS 스레드 Skia 할당이 한 줄로 합산된 값. 야간 Native 바닥 평탄 = GC로 회수 |

**측정(3차 빌드 · round2 · 11:02~11:13)** — 허브 전투 종료 후 Native +50(113~119 → 165~168), 1시간 안에 회수됨(야간 근거) = 지연 해제. 화면 전환 순간 최고 666 · 600 초과 5회.

**수정(4차 빌드)**
| 파일 | 내용 |
|---|---|
| `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx` | `<Canvas><Picture/>` → `SkiaPictureView picture=`(JSI 직접 전달 · UI 런타임 재생 제거 · dispose 없음) — 김클로드 P1안 |
| `tools/memory-audit/run-skia-worklet-memory-audit.cjs` | 전투 「그림 1장」 규칙이 SkiaPictureView 방식도 인정 |
| `src/navigation/facilityExitTeardown.ts` | `beginStageExitTeardown` · `navigateAfterStageExitTeardown` 추가 |
| `src/stages/StageShell.tsx` | 언마운트 시 해체 표시 해제(빠른 재진입 시 빈 화면 방지) |
| `src/navigation/stageNavGate.ts` | `runStageNavAfterTeardown({ exitRoute })` — teardown 직후 떠나는 화면 내용을 먼저 내림 · 중단 시 해제 |
| `app/(game)/worldmap.tsx` | 허브 착륙 · 이동 중 전투 출발에 `exitRoute:'worldmap'` |
| `app/(game)/planet.tsx` | 허브 → 지도 출발 3곳 `navigateAfterStageExitTeardown('planet', …)`(시설 push에는 미적용) |
- tsc exit 0 · audit 31/31.

**검증(4차 빌드 · round2b · pid 24712 · 11:29~11:37 · 허브 전투 2 · 지도 이동 · 이동 중 전투 · 크래시 0)**
| 항목 | 3차 빌드 | 4차 빌드 |
|---|---|---|
| 전환 최고 PSS | 666 | **562** |
| 600 초과 | 5회 | **0회** |
| 마지막 허브 PSS · Native | 491~501 · 174~184 | **431 · 149** |
| 허브 전투 중 Native 톱니 | +2MB/s · −45 낙하 | **+0.4MB/s · −20~25 낙하** |
| 허브 전투 종료 후 잔류 | +50 | +25~40(종료 25초 만에 출발해 이후 감쇠 미측정) |

**남은 확인(다음 기회)**: 허브 전투 종료 후 3분 이상 체류해 잔류가 내려오는지 확인 · 출시 빌드 전 로컬 매니페스트 `profileable` 제거.

## 5-7. 장시간 모니터 상한 — 빌드별 분리 (2026-10-10 14:1x · 대표님 지시)

- 경위: 14:06:21 개발 빌드 PSS 992(Native Heap 574) → 하드 상한 950 초과 → 모니터가 강제 종료(exit-info `FORCE STOP` from 모니터 pid) → 14:07 재시작. 크래시가 아니다.
- 원인: 상한(soft 800 · hard 950)이 빌드를 구분하지 않았다. 개발 빌드는 정상 플레이에서도 790~990이라 개발 중 강제 재시작이 반복된다. release(허브 400~450)에는 너무 느슨하다.
- 수정 `tools/long-run-monitor/mem-gl-leak-rules.ps1`: 설치 패키지 flags의 `DEBUGGABLE`로 빌드를 판별(`logs/.build-variant.txt` 2분 캐시). 하드·소프트 판정 함수가 호출될 때마다 갱신.

| 빌드 | soft(경고) | hard(강제 재시작) | views 경고 | native_heap 경고 | GL hard |
|---|---|---|---|---|---|
| release | **600** | **800** | 600 | 300 | 200 |
| 개발 | 1,000 | 1,300 | 600 | 650 | 200 |
| 판별 실패 | 직전 값 유지(기본 800/950) | | | | |

- 반영: 감시 루프 재시작(백엔드 `run-monitor` pid 31548 · 콘솔 「Arcfire Kim Economy Monitor」 pid 36888 · `report-watch.pid` 동기화). 확인: 현재 판별 = debug, 992 → 재시작 아님, 1,350 → 하드 상한.

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
