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

남은 실기 항목 (설치 후): 무선 Metro 8081 연결 · 부팅 · 허브→은하 지도→전투 왕복 · logcat FATAL 0 · `[PLAY_VERB]` 방출.

리스크: SDK 54는 레거시 아키텍처 마지막 SDK → 출시 후 2027-08 API 37 대응 시 New Architecture 전환 필수. 출시 전에 하지 말고 출시 후 첫 대형 업데이트로 분리 권장.
