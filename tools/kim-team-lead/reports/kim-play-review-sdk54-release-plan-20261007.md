# 김플레이 검수 — 김팀장 SDK 업데이트(출시 기준) 검토·대응 계획 (2026-10-07 21:10)

대표님 지시: 「김팀장의 검토 내용을 전수 조사하여, 최초 경고부터 대응 계획까지 모두 검수하라.」
대상: 김팀장 세션 2026-10-07 20:30~20:54 (16KB 경고 → 원인 → 출시 기준 → 「자정 커밋 후 내일 Expo SDK 54」) + 최초 경고 `docs/ops/BUILD_PACKAGING_ANDROID_PLAY_RESCAN_2026-08-03.md`.
코드 수정 없음 (김플레이 범위 밖). 단 김플레이 산출물 대용량 로그 2개는 커밋 경로에서 뺐다 (§4).

**종합: 조건부 PASS** — 방향(SDK 54 · 자정 스냅샷 후 착수 · 버그 목록 잔여 제외)은 맞다. 사실 1건 정정, 계획 누락 7건 보강 필요.

## 1. 경고 이력

| 시점 | 내용 | 판정 |
|---|---|---|
| **2026-08-03 (최초 경고)** | 패키징 재점검 No-Go. P0 = ① target API 36 (기한 08-31, 당시 4주) ② 릴리스 전용 서명 + AAB ③ 16KB 재빌드 | 2개월간 미착수 → **기한 08-31 이미 경과** |
| 2026-10-07 20:30 | 기기 「16KB 호환 안 됨 · APK·ELF 정렬 실패」 | 김팀장 원인 분석 정확 (§2) |
| 20:46 | 대표님 「다른 일정 홀드 · 현재 버전에서 16KB·출시 기준」 | 김팀장 「현재 Expo 51/RN 0.74로는 불가」 — **맞다** |
| 20:53 | 「자정 데일리 커밋 후 내일부터 업데이트」 | **맞다**, 단 §4 조건 |

## 2. 사실 검수

| 김팀장 주장 | 검수 | 근거 |
|---|---|---|
| API 36 의무 2026-08-31 · 연장 11-01 | **PASS** | Play Console 도움말 11926878. 단 연장은 **기존 앱**의 정책 경고 화면에서만 신청 → 신규 앱이면 연장 없음. Play 등록 여부 확인 필요 |
| 16KB 미지원 업데이트 차단 2027-02-01 | **PASS** | developer.android.com page-sizes (2026-09-16 갱신). target 35+ 앱에 적용 → API 36 올리는 순간 대상 |
| 현재 스택 Expo 51 · RN 0.74.5 · AGP 8.2.1 · NDK 26.1 · target 34 | **PASS** | `package.json` (expo 51.0.39 설치) · `android/build.gradle` · RN `libs.versions.toml` |
| 「방금 설치한 `app-debug.apk`: 라이브러리 120개 중 ELF 실패 59」 | **정정** | 그 수치는 **2026-08-08 디버그 APK**와 정확히 일치. 오늘 빌드가 아님. 결론은 같음 — 오늘 15:22 `app-release.apk` 직접 측정: 64비트 118개 중 **ELF 실패 116 · zip 정렬 실패 91** (`libappmodules`·`libhermes`·`librnskia`·`libreanimated` 포함, 통과 1개) |
| 링커 플래그로는 사전 빌드 lib 해결 불가 → 플래그 미반영 | **PASS** | 위 측정. 우리 lib만 고쳐도 검사는 실패 |
| SDK 54가 API 36 공식 세대 | **PASS** | Expo SDK 54 = RN 0.81 · Android API 36 지원 |
| 「Skia 1.2.3·Reanimated 3.10이 같이 올라감」 | **부분** | 범위가 더 크다 (§3) |

## 3. 계획 누락 · 보강 (내일 착수 전 김팀장 확정 요청)

1. **New Architecture 유지 결정** — 현재 `newArchEnabled=false`. SDK 54가 레거시를 지원하는 **마지막** SDK. SDK 54 기본 Reanimated는 v4(New Arch 전용)라 **Reanimated v3 유지 + `expo.install.exclude`** 필요 (expo/fyi `expo-54-reanimated.md`). New Arch 전환은 별도 단계로 분리 (Expo 공식 권장).
2. **동반 메이저 상승** — React 18.2 → **19.1**, expo-router 3.5 → **6.x**, Skia 1.2.3 → **2.x**, TypeScript 5.3 → 5.9. `Navigation.replace()` 계약 · Skia dispose/Zero-Alloc 계약 · worklet 계약 전부 재검증 대상.
3. **edge-to-edge 강제 (P0 레이아웃)** — SDK 54/Android 16은 edge-to-edge **항상 켜짐·해제 불가**. 행성 허브 `planetMainStageLayout` 상수(탑바 lift · 하단 reserve)와 `expo-navigation-bar` 사용처가 흔들릴 수 있다. 헌법 §6-1 잠금 상수라 **값 변경 시 대표님 재확인** 필요.
4. **단계 업그레이드** — 51 → 54 직행 대신 `npx expo install --fix` 기준 52 → 53 → 54 단계별 빌드 확인 권장 (원인 분리).
5. **스토어 게이트 3종은 SDK와 별개 (최초 경고 P0 미해결)** — 릴리스가 **debug keystore 서명** (`android/app/build.gradle:135`), AAB(`bundleRelease`)·`eas.json` 없음, 릴리스 APK 196.5MB에 x86·x86_64 포함(`reactNativeArchitectures`). SDK 54 끝나도 이것 없으면 제출 불가.
6. **`android/`는 git 제외(CNG)** — 자정 스냅샷에 안 들어감. prebuild `--clean` 시 `gradle.properties` 수동값(ABI 목록·jvmargs 등)이 사라지므로 `app.json` `expo-build-properties`로 옮기고 작업 전 `android/` 폴더 백업.
7. **16KB 검증 게이트 부재** — 릴리스 빌드마다 ELF/zip 정렬 자동 검사 필요. A34는 4KB라 실기 검증 불가 → 16KB 에뮬레이터 이미지로 부팅 확인. 김플레이 측정 스크립트(Node, ZIP+ELF 파싱) 제공 가능.

## 4. 자정 스냅샷 (기준점) 점검

- 스케줄러 `ArcfireOnline_DailyCommit` Ready · 다음 2026-10-08 00:00 · 감사 → `git add -A` → commit → push.
- 최근 4일 중 2일(10/4·10/5) **감사 실패로 커밋 건너뜀** 이력. **21:00 사전 실행 `audit:daily` = exit 0 (PASS)**.
- `git add -A` 라 git 제외 안 된 산출물 전부 포함 → 김플레이 대용량 로그 **78.3MB·39.7MB 2개를 git 제외 폴더 `tools/play-bot-console/logs/owner-release-20261007/`로 이동**, 참조 보고서 2건 경로 갱신. 남은 1MB 이상 미추적 파일 없음.
- 권장: 내일 아침 HEAD = `chore(daily): snapshot 2026-10-08` 확인 → **`pre-sdk54` 태그 + 별도 브랜치**에서 작업. 감사 실패로 스냅샷 없으면 김팀장 수동 커밋 후 착수.

## 5. 김플레이 측 협조 (업그레이드 후)

- 플레이봇은 게임 `src/` TS를 그대로 import → SDK·React 19·TS 5.9 반영 후 **플레이봇 테스트 114개 + 하루 헤드리스 시뮬**을 회귀 게이트로 돌린다 (김플레이 수행).
- `[PLAY_VERB]` 학습 로그 방출 지점 실기 확인 (김플레이).
- 업그레이드 중 플레이봇 콘솔은 PC 전용이라 계속 가동, 실기 수집기는 새 빌드 설치 후 재개.

## 6. 대표님 확인 필요

- ~~Play Console에 앱이 이미 등록돼 있는가~~ → **답변 (21:06): Play 미등록 · 개발 중 신규 앱**
- 레거시 아키텍처로 SDK 54 먼저 → New Arch는 다음 단계 (권장)
- edge-to-edge로 허브 레이아웃 상수가 바뀌면 재확인 후 변경

## 7. 추가 (21:06) — 신규 앱 확정에 따른 판정 변경

대표님 답변: **Play에 등록한 적 없는 개발 중 앱**. 출처: Play Console 도움말 11926878 · 17492799 (2026-10-07 재확인).

| 항목 | 변경 |
|---|---|
| API 36 | 신규 앱은 **첫 제출부터 API 36 필수** · 11-01 **연장 대상 아님**. 기한 위반 상태가 아니라 「제출 불가」 상태 → 외부 기한 압박은 없고 **출시일이 곧 기한** |
| 16KB | 2027-02-01은 **업데이트** 차단 기한. 신규 번들은 기술 품질 요건상 64비트·16KB 지원 대상 → **첫 업로드 전 16KB 통과를 출시 게이트로 둔다** (보수 해석) |
| 출시 순서 | SDK 54(API 36) → 릴리스 서명·AAB·64비트 전용 ABI → 16KB 검사 통과 → 내부 테스트 트랙 첫 업로드 |
| 개인 개발자 계정 | 신규 개인 계정은 프로덕션 전 비공개 테스트(테스터 다수·일정 기간) 요건이 있다 — 계정 유형 확인 후 출시 일정에 반영 (미검증 · 대표님 확인 요망) |
| 메모리 (2027-02~) | Android vitals 메모리 기준 신설 (Anon RSS+Swap, 기기 RAM 등급별 · 앱/게임 별도 기준). 과거 1GB OOM 이력 → 김경제 PSS 감시와 연계 권장 |

## 8. 출시 목표 (21:08 대표님) — Android 출시 기준 충족 · 2027년 1~2월

출시 시점에 겹치는 기준: API 36(현행) · 64비트·16KB(신규 번들) · 2027-02 메모리 vitals 기준. 다음 target API 상향(API 37)은 관례상 2027-08이라 출시 자체엔 API 36이면 충분.

역산 일정 (김플레이 제안 · 김팀장 확정 요청):

| 시기 | 마일스톤 | 완료 기준 |
|---|---|---|
| 10월 | SDK 54 업그레이드 (레거시 아키텍처 유지) | tsc · audit:memory:all · skia · worklet · 플레이봇 114 + 헤드리스 시뮬 · 실기 STAGE 1→2→3 왕복 |
| 11월 상순 | 릴리스 서명 키 · AAB · arm64-v8a(+armeabi-v7a) 전용 · 16KB 자동 검사 | 16KB 검사 0실패 · 16KB 에뮬레이터 부팅·전투 1회 |
| 11월 하순 | Play 개발자 계정·앱 등록 · 내부 테스트 트랙 첫 업로드 | 사전 출시 보고서(pre-launch) 크래시 0 |
| 12월 | 비공개 테스트 (개인 계정이면 필수 기간) · 메모리 vitals 기준 대비 측정 | 4GB급 기기 포그라운드 메모리 기준 이내 |
| 2027-01 | 프로덕션 심사 제출 | 1~2주 심사 여유 |

## 9. 대표님 결정 (21:09) — 김팀장 고지

- **계정: 개인사업자.** Play 계정 유형이 「개인」으로 만들어지면 신규 개인 계정의 비공개 테스트 요건(프로덕션 전 일정 인원·기간 테스트)이 적용된다. 「조직」 유형은 D-U-N-S 번호가 필요하고 발급에 수 주가 걸린다. → **11월 계정 등록 전에 유형을 정한다.** 요건 수치는 등록 시점 Play 도움말로 재확인 (김플레이 미검증). 12월 비공개 테스트 구간은 일정에 그대로 둔다.
- **레이아웃: 최적화는 추후 별도 작업.** SDK 54(edge-to-edge 강제)에서 허브·서브 화면이 깨지면 **화면이 정상 동작하는 최소 대응만** 한다. `planetMainStageLayout` 잠금 상수의 재정렬·최적화는 이번 범위에서 **제외**하고, 대표님 지시 시 다시 진행한다. 김팀장은 `docs/ops/차기_업무_목록.md`에 「SDK 54 edge-to-edge 레이아웃 최적화」로 등록 요청.

## 10. 작업 체계 (21:12 대표님 승인 요청 → 김플레이 동의)

김팀장 구현 → 김플레이 검수·안정성 확인 → 김팀장 커밋. 단계마다 반복 (SDK 52·53·54, 서명/AAB, 16KB).

| 단계 | 담당 | 산출 |
|---|---|---|
| 구현 · self-check (tsc · audit) | 김팀장 | 단계 완료 통보 (변경 파일 · 빌드 경로) |
| 검수 | 김플레이 | diff 계약 검수 (replace · Skia dispose · worklet) · 플레이봇 114 + 헤드리스 시뮬 · 16KB/ELF 검사 · 실기 STAGE 1→2→3 왕복 + logcat FATAL 0 · `[PLAY_VERB]` 방출 확인 |
| 메모리 | 김경제 | `mem-post-dev-recheck` (PSS floor · GL · retention) |
| 판정 | 김플레이 | 본 문서에 단계별 PASS/FAIL. FAIL 시 근거(logcat·테스트) 첨부 |
| 수정 · 커밋 | 김팀장 | **김플레이 PASS 전 커밋 금지** |

김플레이는 게임 본체 코드를 고치지 않는다 (발견 → 김팀장). 전제: 실기 A34 연결 유지 + 16KB 에뮬레이터 이미지 준비.

## 11. 단계 검수 — SDK 52 (2026-10-08 02:50 · 김플레이)

판정: **중간 PASS (헤드리스·정적)** · 실기 왕복은 빌드 설치 후. **커밋은 실기 PASS 뒤.**

| 항목 | 결과 |
|---|---|
| 착수 조건 | HEAD `3dfc926 snapshot 2026-10-08` · 태그 `pre-sdk54` · 브랜치 `sdk54-upgrade` — **OK** |
| `android/` 백업 | `D:\arcfire-android-backup-pre-sdk54` 존재. prebuild 재생성(02:37)과 비교: `android.enableJetifier=true` 만 사라짐 → 빌드가 support 라이브러리 오류를 내면 여기부터 |
| RN 0.74 패치 | `patches/` 에서 빠지고 `held-patches/` 보관 — 계획대로. JS 리로드 가드 유지 |
| 아키텍처 | `app.json newArchEnabled:false` · `gradle.properties newArchEnabled=false` · Reanimated 3.16.7 — OK |
| babel | reanimated 플러그인 마지막 위치 유지 — OK |
| 설치 버전 | expo 52.0.49 · RN 0.76.9 · React 18.3.1 · Skia 1.5.0 · RNFB 24.0.0 |
| tsc (client) | **PASS** |
| 플레이봇 테스트 | **114/114 PASS** |
| 헤드리스 1일 (`sdk52-gate-1d`, seed 7) | 정상 종료 · `EARLY_SPINE_OK` |
| generated diff | `src/` generated 변경 없음 — OK |

메모 (차단 아님, 54 단계에서 다시 본다):
- `.npmrc legacy-peer-deps=true` 신규(미추적) — peer 충돌을 전부 숨긴다. 54 완료 후 제거 가능 여부 확인.
- `"expo": "^52.0.49"` 캐럿 — Expo 관례는 `~`. 52 범위 안이라 동작 영향 없음.
- 디버그 ABI x86/x86_64 유지 (합의 5번대로).

owner-auto: 02:50 설치 직전 김플레이가 정지 (합의 11번). 헤드리스 하니스는 계속. 새 빌드 부팅 확인 후 김플레이가 재기동.

### 11-1. 실기 1차 (04:35) — SDK 52 디버그 설치 04:29:34 · pid 12049 · 포그라운드

- FATAL·SIGSEGV **0**. 부팅·허브 진입은 됨 (사용자 조작 없음 → 왕복·`[PLAY_VERB]` 미확인).
- **E1 (확인 요망)** 04:30:08 부팅 직후 1회 `Error: Requiring unknown module "undefined"` (Component Stack). 앱은 계속 동작. Metro가 `expo start --port 8081`(캐시 유지)로 떠 있음 → 먼저 `--clear` 재기동 후 재현 여부 확인. 재현되면 lazy `require` 경로 조사 (김팀장).
- **E2 (관측)** `[arc-hitch] tick arc_core_spy_subcore` 평균 150ms · 최대 215ms · 6분간 468회(약 0.6초마다). 김클로드 handoff R-B(스파이 빈 결과 매 프레임)와 같은 축. 업그레이드 전 프로세스(19729) 같은 로그에는 0회지만 포그라운드 여부 미확인이라 **SDK 원인으로 단정하지 않음**. 디버그 번들 비용 포함 가능 → 업그레이드 전 빌드와 같은 조건 비교 필요.
- 04:05 `Cannot find native module 'ExpoAsset'` · `"main" has not been registered` — **구 바이너리(21:28 설치)에 새 JS 번들이 로드된 것**, 새 설치 후 미발생. 무시.

### 11-2. 실기 2차 (05:45) — 대표님 플레이 중 · 재설치 05:37:20 · pid 16391

- FATAL·SIGSEGV **0** (04:29~05:45 전 구간).
- **E1 해결 확인**: 04:52(pid 13053)에 재현됐으나, 김팀장 `devLoadingViewSuppress.ts` 수정(RN 0.76 `LoadingView`→`DevLoadingView`, `module.exports` 형태 확인) 후 05:37 빌드에서 **0건**.
- **`[PLAY_VERB]` 방출 정상**: talk · scan · mine · trade · combat(hub_orbit) — 튜토리얼 b1(조선소)까지 진행 중.
- 왕복: 13053 세션에서 `combat transit:win` → `land draco_haven` 확인 (은하 지도 이동·이동 전투·착륙 경로). 16391 세션은 아직 허브 튜토리얼.
- **E2 지속**: 스파이 서브코어 tick 평균 166ms(203회). 판정 보류 — 업그레이드 전 디버그 빌드와 비교 필요 (김팀장 판단).
- 추가 변경 검수: `arcfire-native-memory` devDep `expo-modules-core ~2.2.3` (SDK 52 정합) · `patches/@react-native-firebase+analytics+24.0.0.patch` (ESM `type:module` 표기 제거) — 동의.

### 11-3. SDK 52 마감 (09:15 · 김플레이)

- **SDK 52 PASS** — 커밋 `5ffb943` 수용. 05:37~09:00 pid 16391 단일 프로세스 **3.4시간 생존 · FATAL 0 · JS 오류 0**. 왕복은 13053 세션(은하 지도 → 이동 전투 승 → 착륙)으로 확인.
- **E2 = 기존 버그로 판정 (SDK 원인 아님)**: 스파이 tick 3.4시간 15,598회 · 평균 168ms · 최대 348ms. 김클로드 handoff R-B(「스파이 조회 결과가 비면 1초 간격이 풀려 매 프레임 전 함장 인덱스」)와 증상 일치. 유휴에도 JS 스레드를 상시 점유 → **출시 전 수정 대상 (김팀장, SDK 작업과 분리)**. 디버그 로그도 3.4시간 3.8MB로 불어남.

## 12. 단계 검수 — SDK 53 (09:15 · 진행 중, 미커밋)

판정: **정적 PASS** · 빌드·실기 대기.

| 항목 | 결과 |
|---|---|
| 설치 | expo 53.0.27 · RN 0.79.6 · React 19.0.0 · Skia 2.0.0-next.4 · Reanimated 3.17.5 · TS 5.8.3 |
| 아키텍처 | `newArchEnabled:false` 유지 (SDK 53은 신규 프로젝트 기본 New Arch → 명시값 필수, OK) |
| tsc (client) | **PASS** (React 19 · Skia 2 타입 포함) |
| 플레이봇 | **114/114 PASS** · 헤드리스 1일 `sdk53-gate-1d` `EARLY_SPINE_OK` |

실기에서 꼭 볼 것 (SDK 53 고유):
1. **저장 데이터 유지** — AsyncStorage 1.23 → **2.1.2 메이저**. 덮어 설치 후 기존 계정·진행이 그대로 로드되는지 (새 시작 화면이면 즉시 중단).
2. **Skia 2 (`next` 프리릴리스 · Expo 53 지정 버전)** — 허브 성운·궤도, 이동 전투 배경, 전투 렌더. `audit:skia-memory` · `audit:worklet-contract` 김팀장 재실행.
3. React 19 · safe-area-context 5 — 상단 크롬·바텀시트 위치 (레이아웃 상수 변경 금지, 깨지면 기록만).
4. RNFB 24.0.0 + RN 0.79 — 부팅 시 Firebase 초기화 오류 유무.

### 12-1. SDK 53 실기 1차 (09:45 · 설치 09:27:34 · pid 31787)

- FATAL·SIGSEGV **0** · JS 오류 **0**. 경고만: RNFB 네임스페이스 API deprecated(3) · `expo-av` deprecated(1).
- **저장 데이터 유지 판정 OK(간접)**: 재설치 후 인트로·초반 튜토리얼 재생 없이 `land arcadia_prime` → `obj_002_a` → `combat hub_orbit:win` → `complete:mission_002` → `level 2` 로 이어짐 (어제 세션 진행 다음 단계). 대표님 눈으로 계정명·크레딧 한 번 확인 요망.
- `[PLAY_VERB]` 정상 (land · quest · combat · level).
- 상단 「Refreshing…」 깜빡임: 김팀장 수정 중. 개발 서버 로딩 표시(DevLoadingView) 계열이면 **릴리스 빌드엔 없는 표시** — 보류된 RN 0.74 패치가 끄던 기능. 앱 코드가 `tools/` 보고서를 import하지 않음을 확인(플레이봇·감사 산출이 갱신을 유발하지 않음).
- 스파이 tick(R-B) 464회 · 평균 **205ms** (SDK 52: 168ms). 디버그 조건이지만 악화 경향 기록.
- **SDK 54 대비**: `expo-av` 경고가 「SDK 54에서 제거」라고 표시 → 54 설치 시 `expo-av` 존속 여부 확인, 없으면 `expo-audio`/`expo-video` 이전이 54 단계 선행 작업.

## 13. 단계 검수 — SDK 54 (10:55 · 미커밋 · 설치 전)

판정: **정적·빌드 PASS** · 실기 대기. SDK 53 체크포인트 `c6bf83d` 수용.

| 항목 | 결과 |
|---|---|
| 설치 | expo 54.0.37 · RN 0.81.5 · React 19.1.0 · Skia 2.2.12(정식) · Reanimated **3.19.5 고정 + `expo.install.exclude`** (계획 12번대로) · AsyncStorage 2.2.0 · RNFB 24.0.0 · expo-av 16.0.8(존속) · TS 5.9.3 |
| 아키텍처 | `newArchEnabled:false` (app.json · gradle.properties) |
| APK (`app-debug.apk` 10:38) | **targetSdk 36 · compileSdk 36** · minSdk 24 |
| **16KB** | 64비트 lib 36개 **zip 정렬 실패 0 · ELF 실패 0** (어제 릴리스: 118개 중 116 실패). `librnskia`·`libreanimated`·`libhermes`·`libreactnative`·`libexpo-av` 포함 전부 통과. `libworklets.so`는 Reanimated 3.19 자체 산출(react-native-worklets 패키지 없음 확인) |
| tsc (client) | **PASS** |
| audit:worklet-contract · audit:skia-memory | **PASS** · 31/31 |
| 플레이봇 | **114/114** · 헤드리스 `sdk54-gate-1d` `EARLY_SPINE_OK` |

실기에서 볼 것 (SDK 54 고유):
1. **edge-to-edge 강제** (`edgeToEdgeEnabled=true`) — 상단 크롬·하단 바텀시트·전투 HUD 가림. 깨지면 **최소 대응만** · 잠금 상수 변경 금지(SDK54-E2E HOLD).
2. **내비게이션 바 몰입 모드** — `app/_layout.tsx:434`, `src/ui/overlay/reapplyAndroidImmersiveNavBar.ts:8` 의 `setVisibilityAsync('hidden')` + `setBehaviorAsync('overlay-swipe')`. expo-navigation-bar 5는 edge-to-edge에서 일부 API를 지원하지 않는다고 안내함 → 하단 바가 숨겨지는지·스와이프 후 다시 숨는지 확인. 경고 로그 유무 기록.
3. 저장 데이터 유지 (AsyncStorage 2.2.0) · Firebase 초기화 · Skia 2.2 정식 렌더 (허브 성운 · 이동 전투 배경 · 전투).
4. 예측형 뒤로가기는 opt-in이라 기본 꺼짐 — 뒤로가기 동작 변화 없어야 정상.

### 13-1. SDK 54 실기 1차 (11:25 · pid 9525)

- SDK 54 프로세스 9525: **FATAL 0 · JS 오류 0**. 경고는 RNFB deprecated 3건뿐.
- 부팅 → 타이틀 활성 약 4.5초 (`post_boot_settled`). 차원항로 로딩 자체 0.6초 (`continue_prewarm_start+292s`는 타이틀 대기 시간).
- `[PLAY_VERB]` 정상 (scan · land · quest · develop · talk).
- **11:16 계정 초기화 실행됨** (`[reset-diag] purge=22380ms` · cloud_phase 15.0s · world_expansion 2.8s) → 이후 `story_001` 인트로부터 재시작. 대표님 의도 여부 확인 요망. 의도라면 정상이며, **초기화 22.4초**는 별도 기록(기존 동작 여부 미확인).
- 대표님 관측(김팀장 수정 중): 키보드 자동 내림 · 인게임 대사창·팝업 하단이 시스템 바 영역 침범 → edge-to-edge 강제 영향과 일치. 잠금 상수 변경 없이 최소 대응 원칙.
- 무시 가능: pid 31787·5334 오류(`React Native version mismatch JS 0.81.5 / Native 0.79.6`, async-require 미해결)는 **SDK 53 구 바이너리에 SDK 54 번들이 로드된 것** — 새 설치 후 미발생.
- 스파이 tick(R-B) 평균 180ms 지속.
- 참고: adb에 같은 기기가 2개 이름(IP·mDNS)으로 잡힘 → adb 명령은 `-s` 지정 필요.
- **정정 (12:20)**: pid 9525는 **11:26:42에 종료됨** — `JNI DETECTED ERROR IN APPLICATION: field operation on NULL object` → SIGABRT(`mqt_js`). 위 「FATAL 0」은 11:25까지 구간 기준.
  - 직전 11:26:40~41에 개발 모드 JS 재시작이 일어나 모든 네이티브 모듈이 「Cannot find native module」(ExponentAV · ExpoNavigationBar · ExpoFontLoader · reanimated)로 사라진 상태였고, 그 사이 도착한 Firestore `documentGet` 응답(`ReactNativeFirebaseFirestoreDocumentModule.java:130`)이 해제된 브리지에 쓰다가 중단됨.
  - 판정: **개발 모드 리로드 중 Firestore 콜백 경합** — 릴리스 빌드에는 리로드가 없어 출시 경로와는 무관할 가능성이 높음. 단 릴리스 빌드 실기에서 같은 스택이 없는지 11월 릴리스 검수 때 재확인.
- **13-2. 새 설치 실기 (12:20~12:34 · pid 14101)**: FATAL 0 · JS 오류 0 · 경고는 기존 3종(expo-av · RNFB 네임스페이스 · 레거시 아키텍처)+DevLoadingView 깊은 import. 일일 배치 완료(28.2초) · RTDB boot sync ok · 12:27 JS 리로드 후 정상 복귀 · 허브 Skia reclaim 정상. 메모리(12:34 허브, 디버그): TOTAL PSS 712MB · GL mtrack 44.5MB · Native Heap 372MB · **Views 389**(idle 기준 ≤380 초과, ≥450 FAIL 미만 → 김경제 30분 idle 재측 필요). 스파이 tick 평균 146ms(n=963, 최대 266). **Firestore 쓰기 로그 여전히 없음** · `[PLAY_VERB]` 0건(조작 전).
- **13-3. 스파이 tick 수정 검수 (12:50 · 김팀장 미커밋 diff · 12:46:45 리로드로 반영)** — 판정 **PARTIAL**
  - diff: `ArcCoreSpySubCore` 스파이 0명일 때 매 tick 조회하던 조건 제거(1초 주기로 제한) · `buildCaptainPresenceWorldIndex.arcTrafficSig`에서 `phase` 제외. tsc PASS.
  - 실기: 1분당 스파이 지연 기록 **약 77회 → 28회**(빈도 약 63% 감소) · 1회 비용은 **평균 165ms 그대로**(12:48 163ms · 12:49 167ms, 최대 228ms). 즉 1초 조회 중 절반가량이 여전히 무거움 → `getCaptainPresenceWorldIndex` 캐시 미스(재빌드) 또는 캐시 확인 경로 자체(`listGovernorCaptainPrimaryPlanets` · govSig 정렬 · key 문자열) 비용 의심. 구간별 소요 계측으로 원인 특정 필요.
  - 엣지 버그: 새 비교가 `lastSpyKey` 기준이라, 알림이 소비되지 않은 상태(`consumed=false` → lastSpyKey 미갱신)에서 스파이 집합이 다시 이전 집합으로 돌아가면 `cachedSpyIds`가 갱신되지 않고 떠난 스파이가 남음 → 매 tick 알림 재시도. 피해는 작음(펄스 피해는 bundle을 새로 계산해 0). 1초 주기라 비교 없이 `cachedSpyIds = nextIds` 로 항상 대입 권장.
- 12:12 수동 빌드(`gradlew :app:assembleDebug -PnewArchEnabled=false`) 성공 · 12:17 설치. `npx expo run:android`만 reanimated `NativeWorkletsModuleSpec` 컴파일 오류로 실패(2회) → 김팀장 원인 조사 필요. 그 전까지 수동 빌드 경로 사용.

## 14. 전수 조사 — 원래 목표 대비 완료 여부 (11:30 · 김플레이)

**종합: SDK 업데이트는 사실상 완료(커밋·화면 보정 남음). 안드로이드 출시 수준은 미완 — 11월 항목 그대로 남음. DB는 Firestore 1건 미확인.**

| 영역 | 판정 | 근거 / 남은 것 |
|---|---|---|
| SDK 업데이트 | **거의 완료** | Expo 54 · RN 0.81.5 · targetSdk/compileSdk 36 · 16KB 64비트 36/36 통과(디버그). **SDK 54 미커밋**(package.json·lock·`ArcCoreChatOverlayContent.tsx` 수정 중) · `main` 미병합 |
| 코드 안정화 (정적) | **PASS** | tsc · `audit:daily` · `audit:memory:all`(memory 37/37 · skia 31/31 · worklet · native-reclaim 20/20 · resident-set 7/7 · hot-path 0) · `audit:ui-overlay` · 플레이봇 114 · 헤드리스 1일 |
| 코드 안정화 (실기) | **PASS + 잔여** | SDK 52·53·54 새 바이너리 FATAL 0 · JS 오류 0 (52는 3.4시간 생존). 잔여: edge-to-edge 화면 침범·키보드(김팀장 수정 중) · 스파이 tick R-B 평균 180ms(기존 버그, 출시 전 수정) · 계정 초기화 22.4초 |
| 김경제 메모리 게이트 | **미실행** | `mem-post-dev-recheck`·30분 idle PSS floor 미측정. 개발 반영 후 필수 게이트 → SDK 54 커밋 전후 배정 필요 |
| 기존 시스템 | **PASS** | `[PLAY_VERB]` 학습 로그 · 플레이봇 · 경제 배치 마커 · 아크코어 대화(cloud ok) 동작. Firebase 패치 3종 적용 · RN 0.74 패치 보류(개발 전용 기능만 영향, DevLoadingView는 JS로 대체) |
| 지원 중단 경고 | **출시 무관 · 기록** | RNFB 네임스페이스 API(다음 RNFB 메이저에서 제거) · `expo-av`(SDK 55에서 제거 → 출시 후 SDK 55 전 `expo-audio`/`expo-video` 이전) |
| DB 연결 | **부분** | Firebase Auth OK(초기화 후 새 익명 uid 로그인) · RTDB OK(`boot sync ok`, learning merge). **Firestore 미확인**: 초기화 직후 닉네임 확인·예약·재확인 3회 모두 5초 타임아웃 → `cloud sync deferred (firebase offline)`. 코드 주석상 초기화 직후 기존에도 있던 패턴이나, SDK 54에서 Firestore 정상 쓰기는 **아직 한 번도 확인 못 함** → 앱 재시작 후 클라우드 저장·닉네임 예약 성공 로그 확인 필요 (P0) |
| 프로세스 | **위험 1** | 자정 `ArcfireOnline_DailyCommit`은 **현재 브랜치에서** `git add -A`→commit→`git push`. 지금 `sdk54-upgrade`는 upstream이 없어 push 실패 → 실패 보고 생성. 또 미완 화면 수정이 그대로 스냅샷됨. → **자정 전에 SDK 54 커밋 + main 병합(또는 upstream 지정) 결정 필요** |
| 안드로이드 출시 수준 | **미완 (계획상 11월)** | 릴리스가 `debug.keystore` 서명 · AAB·`eas.json` 없음 · ABI에 x86/x86_64 포함 · minify/shrink 꺼짐 · **SDK 54 릴리스 빌드 미생성**(16KB 릴리스 재검사 필요) · Play 계정 유형(개인/조직·D-U-N-S) 미정 · 개인정보처리방침·데이터 보안 양식 미확인 · 2027-02 메모리 vitals 미측정 |
| 알려진 기존 실패 | 변동 없음 | `combatFourAxisPlaySim.test.ts` 1건(audit:daily 미포함, SDK 무관) |

권장 순서: ① 화면 보정 마감 → ② Firestore 쓰기 실기 확인 → ③ SDK 54 커밋 + main 병합(자정 전) → ④ 김경제 메모리 재검수 → ⑤ 스파이 R-B 수정 → ⑥ 11월 릴리스 서명·AAB·arm 전용·릴리스 16KB.

남은 것 (11월): 릴리스 서명·AAB·x86 제외 후 **릴리스 번들로 16KB 재검사**.

메모: `"expo": "^53.0.0"` 캐럿 반복 (54 단계에서 `~` 정리 권장).

남은 실기 항목 (설치 후): 무선 Metro 8081 연결 · 부팅 · 허브→은하 지도→전투 왕복 · logcat FATAL 0 · `[PLAY_VERB]` 방출.

리스크: SDK 54는 레거시 아키텍처 마지막 SDK → 출시 후 2027-08 API 37 대응 시 New Architecture 전환 필수. 출시 전에 하지 말고 출시 후 첫 대형 업데이트로 분리 권장.
