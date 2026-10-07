# 출시 스택 준비 검토 — 2026-10-07

- 작성: 김팀장
- 범위: 검토만. SDK 업그레이드·게임 코드 수정·커밋 없음.
- 기준 HEAD: `0ea9a58` `chore(daily): snapshot 2026-10-07 (KST)` (오늘 00:00 스냅샷)
- 오늘 밤 00:00 커밋이 성공하면 기준은 `snapshot 2026-10-08` 이 된다. 그 전에 `npx expo install` / prebuild 금지.

## 자정 스냅샷에 들어가는 작업 트리

미커밋이 약 142경로다. `audit:daily`(tsc 포함)가 실패하면 커밋과 push가 모두 건너뛴다. 그 경우 내일 스택 작업을 시작하지 않는다.

| 구분 | 내용 | 내일 업그레이드 중 |
|---|---|---|
| 1차 마감, 스냅샷에 포함할 것 | 홉 조우, 편입·개척 취소, 배달 홀드, 튜토리얼 녹색 마커, 개인 대사 같은 창, 퀘스트 잠금 | 로직을 다시 고치지 않는다 |
| 미완이지만 되돌리지 말 것 | 스텔라 대화·게이트, 호송 계획, 전투 Skia·시차, NPC 함장/함선 generated | 업그레이드 diff와 섞어 수정하지 않는다 |
| 김플레이 경로 | `tools/play-bot-console/**` 변경·산출 | 김팀장이 정리하지 않는다 |
| 김클로드 | `kim-claude-handoff-pending.md` status=PENDING. R-A 날짜 전환 장부, R-B 스파이 빈 결과 매 프레임 | 이번 스택 작업에서 고치지 않는다 |

알려진 테스트 1건은 이번 패스가 아니다. `combatFourAxisPlaySim.test.ts`의 「코어 21행성 — 유휴 착륙에서 허브·웨이브 이중 발화 없음」. `arcadia_prime`의 `mainStageCombatEnabled`와 테스트의 `hubOrbitHostileEntered`가 어긋난다. `audit:daily`는 이 테스트를 돌리지 않는다.

## 업그레이드 당일 설치를 막는 것 (이미 HEAD에 있음)

1. `patches/react-native+0.74.5.patch`  
   RN 0.81에는 적용되지 않는다. `postinstall`의 `patch-package`가 실패하면 설치가 멈춘다.  
   패치가 하는 일: 개발 로딩 팝업 끄기, Metro reload 350ms 전에 `ArcfirePrepareMetroReload` emit. 수신은 `src/game/devMetroReloadGuard.ts`.  
   내일: 새 RN에 같은 동작을 다시 심기 전에는 이 패치 파일을 설치 경로에서 빼야 한다. 오늘 밤 디버그 빌드는 이 패치가 있어야 한다.

2. `patches/@react-native-firebase+app+24.0.0.patch`  
   `patches/@react-native-firebase+firestore+24.0.0.patch`  
   버전이 24.0.0에 고정이다. Firestore 패치는 없는 `app.plugin.js` 스텁을 넣는다. SDK 54가 Firebase를 올리면 패치 적용이 실패한다. 내일 버전을 확인한 뒤 스텁만 다시 만든다.

3. `package.json` `postinstall`  
   `patch-package` 다음에 `build-balance-from-csv.mjs`와 `gen:galaxy-graph`가 돈다.  
   밸런스 빌더 전체 실행은 예전 `csvWeaponTradeListingPolicy.ts`에서 `w_laser_arc_029`를 떨어뜨린 적이 있다. 내일 `npm install`이 이 스크립트를 타면 generated를 바로 커밋하지 않고 diff를 본다. `capital_ship_max_upgrade_value.csv`는 재생성하지 않는다.

4. `android/` · `ios/` 는 `.gitignore`  
   로컬 `android/build.gradle`의 NDK `26.1.10909125`, Google Services classpath `4.4.1`, `android/app/build.gradle`의 `apply plugin: 'com.google.gms.google-services'`는 스냅샷에 없다.  
   `app.json` 플러그인에 `@react-native-firebase/app`와 `googleServicesFile`이 있다. 내일 prebuild는 이 무시된 폴더를 새로 만든다. 옛 `android/`를 복사해 덮어쓰지 않는다. 릴리스 서명은 아직 debug keystore다. 스토어 서명 키는 이번 16KB 빌드 작업에 넣지 않는다.

## 내일 첫 순서 (이 검토의 범위 밖, 시작 금지 조건)

스냅샷 `2026-10-08`이 HEAD이고 `audit:daily`가 통과했을 때만.

1. Old Architecture 유지. Reanimated 4 · New Architecture는 다른 날.
2. RN 0.74 패치를 적용 대상에서 뺀 뒤 SDK 54로 설치.
3. Firebase 패치가 실패하면 24.0.0 핀을 확인하고 스텁만 다시 작성.
4. `postinstall`이 만든 generated diff를 게임 로직 변경과 분리해 확인.
5. prebuild로 `android/`를 새로 만들고, 무선 SM_A346N · Metro 8081 하나만 사용.
6. 네이티브 재빌드 직전 owner-auto는 김플레이와 다시 합의한 뒤에만 멈춘다.
7. `devPlayVerbLog.ts`와 `[PLAY_VERB]` 방출 줄은 diff에서 제외.
