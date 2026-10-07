# 김플레이 회신 — SDK 54 계획 잠관 (2026-10-07)

작성: 김플레이 · 2026-10-07 · status=CONSULTED
대상: 김팀장 13조건. 기본안 `kim-play-review-sdk54-release-plan-20261007.md` 는 덮어쓰지 않음.
코드·커밋·Metro·프로세스 변경 없음. 플레이봇 경로(`owner-auto` · Metro `tcp:8081` · `[PLAY_VERB]`)와 설치 패치 3개만 대조.

**종합: 조건부 동의**

방향·일정·작업 체계는 잠근다. 아래 2·3·4·7·9만 수정. 오늘 밤 SDK 설치·태그 금지.

## 13조건 판정

1. **동의.** 조건부 PASS · 2027-01 심사 · 10월 SDK 54(레거시) → 11월 서명·AAB·16KB → 12월 비공개 테스트 · 구현 → 김플레이 검수 → PASS 전 업그레이드 커밋 금지.
2. **수정.** SDK 단계 커밋만 금지하고, 오늘 수동 커밋과 자정 `chore(daily): snapshot`은 그 밖인 점은 동의. 「스냅샷이 없으면 내일 착수하지 않는다」는 기각 — 10/4·10/5는 감사 실패로 스케줄이 건너뛰었다. 대안: 아침 HEAD에 `snapshot 2026-10-08`이 없으면 김팀장이 수동 스냅샷을 만든 뒤에만 착수한다. 하루 전체를 비우지 않는다.
3. **수정.** 0단으로 두는 것은 동의. `patches/react-native+0.74.5.patch`는 RN 0.81에 안 붙고 postinstall의 patch-package가 멈춘다. 패치는 개발 로딩 팝업을 끄고 reload 350ms 전 `ArcfirePrepareMetroReload`를 낸다. Firebase 패치 2개는 24.0.0 고정, 버전이 오르면 스텁만 다시 만든다. postinstall의 `build-balance-from-csv.mjs`·galaxy-graph 산출은 게임 로직과 구분해 본다. `capital_ship_max_upgrade_value.csv`는 이 파이프라인 밖(`tools/ship-upgrade-value`)이라 재생성하지 않는다. 대안: 빼는 것은 네이티브 패치뿐이다. `src/game/devMetroReloadGuard.ts`의 JS `DevSettings.reload` 래핑은 삭제·무력화하지 않는다. 네이티브 이벤트 재이식은 이번 착수 조건이 아니고 기록만 한다.
4. **수정.** 52→53→54, 52·53은 출시 정지점 아님, 16KB·API 36은 54만, 부팅된 단계만 검수 후 커밋 — 동의. 대안: 부팅 실패 단계는 실기 플레이를 걸지 않고, 원인 한 줄을 남긴 뒤에만 다음 SDK로 간다. 그 단계는 커밋하지 않는다. 헤드리스는 그 날도 계속한다.
5. **동의.** 디버그 ABI에서 x86/x86_64를 첫 SDK 빌드부터 빼지 않는다. 16KB 에뮬레이터가 그 ABI를 쓸 수 있다. 릴리스 전용 ABI(arm64 + 필요 시 armeabi-v7a, x86 제외)는 11월 서명·AAB.
6. **동의.** 릴리스 키스토어는 김팀장이 만들거나 커밋하지 않는다. 비밀번호는 대표님. 11월.
7. **수정.** 검사기 제공은 김플레이, 김팀장 복제 금지, 실행과 릴리스 빌드 경로 통보는 김팀장 — 동의. 대안: 스크립트는 11월 16KB 게이트 전에 준다. 10월 SDK 단계 검수의 필수는 플레이봇 114 + 헤드리스 + 부팅된 실기 왕복이다. PASS 판정은 통보된 산출로 김플레이가 한다.
8. **동의.** edge-to-edge가 깨지면 최소 동작만. `planetMainStageLayout` 잠금 상수는 이번에 바꾸지 않는다. 후속 한 줄은 협의 직후 김팀장이 `docs/ops/차기_업무_목록.md`에 등록한다.
9. **수정.** 오늘 밤 `pre-sdk54` 태그 금지는 동의. 대안: 태그·작업 브랜치는 아침 HEAD 메시지가 `snapshot 2026-10-08`일 때만. 자정 스케줄이든 2번의 아침 수동 스냅샷이든 같다.
10. **동의.** `devPlayVerbLog.ts`와 `[PLAY_VERB]` 방출 줄은 업그레이드 diff에서 뺀다. 실기 확인은 새 개발 빌드가 무선으로 Metro 8081에 붙은 뒤 김플레이 (`tcp:8081` reverse).
11. **동의.** owner-auto는 네이티브 재설치 직전, 그 순간 다시 합의한 뒤에만 멈춘다. 10월 전체를 끄지 않는다. 헤드리스 하니스는 계속.
12. **동의.** Old Architecture 유지. Reanimated 3 + `expo.install.exclude`. Reanimated 4·New Architecture는 출시 후.
13. **동의.** `android/`는 복사해 prebuild 위에 덮어쓰지 않는다. 작업 전 백업 후 `expo-build-properties`로 옮긴다.

## 잠관된 내일 첫 순서

스냅샷 확인 다음부터. 오늘 밤 SDK 설치·태그 금지.

1. HEAD가 `snapshot 2026-10-08`인지 확인한다. 없으면 김팀장 수동 스냅샷 후 다시 확인한다. 그 전 설치 금지.
2. 그 HEAD에만 `pre-sdk54` 태그와 작업 브랜치를 만든다.
3. `android/`를 백업하고 수동 gradle 값을 `expo-build-properties`로 옮긴다. 복사본으로 prebuild를 덮지 않는다.
4. 0단: `react-native+0.74.5.patch`만 설치 경로에서 뺀다. JS 리로드 가드는 둔다. Firebase 24.0.0 패치는 둔다. `capital_ship_max_upgrade_value.csv`는 재생성하지 않는다.
5. SDK 52를 빌드한다. 부팅이 안 되면 실기 없이 원인 한 줄만 남기고 53으로 간다. 비부팅 단계는 커밋하지 않는다.
6. 부팅된 단계만 김플레이가 검수한다(플레이봇 114 · 헤드리스 · 무선 Metro 8081 실기). PASS 전 그 단계 커밋 금지. `devPlayVerbLog`·`[PLAY_VERB]` 줄은 diff에서 뺀다.
7. owner-auto는 재설치 직전 재합의 때만 멈춘다. 헤드리스는 계속. 디버그 ABI의 x86/x86_64는 유지한다.
8. 16KB 검사기 · 릴리스 키스토어 · 릴리스 ABI · 레이아웃 상수 변경은 내일 순서에 넣지 않는다.

## 김팀장 수락 (2026-10-07)

13조건 중 김플레이가 수정한 2·3·4·7·9를 그대로 받는다. 오늘 밤 SDK 설치와 태그는 하지 않는다. `SDK54-E2E`는 `docs/ops/차기_업무_목록.md`에 HOLD로 등록했다. 내일 첫 순서는 위 8줄을 따른다.

## SDK 52 부팅 (2026-10-08)

브랜치 `sdk54-upgrade`, 태그 `pre-sdk54` = `3dfc926`. 커밋 없음.

- 디버그 APK 빌드·무선 설치·부팅까지 했다. `BuildConfig.IS_NEW_ARCHITECTURE_ENABLED=false`. 프로세스 12049가 `Running "main"` 이후 `[boot-perf] boot_ready`, ArcCore 동기, `[title-diag]`까지 갔다. FATAL 없음.
- 사용자 Gradle 홈 `C:\Users\eomsp\.gradle\gradle.properties`의 `newArchEnabled=true`가 프로젝트 `false`보다 우선했다. 이번 재빌드는 `-PnewArchEnabled=false`. 이 인자를 빼면 New Architecture로 다시 켜진다.
- 설치 경로 기계 수정: `expo-modules-core@2.2.3`, `expo-asset@~11.0.5`, `query-string@7.1.3`. 로컬 모듈 devDependency도 `~2.2.3`. `w_laser_arc_029`는 postinstall 뒤 복구했다.
- 잔여 JS 한 줄: `Requiring unknown module "undefined"`. 그 뒤 부팅은 계속됐다.
- owner-auto는 재설치 창 동안만 플래그로 멈추고, 부팅 확인 직후 pid 23340으로 재개했다. 검수는 재개 뒤.
