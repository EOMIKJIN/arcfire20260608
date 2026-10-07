# 김플레이 협의 — 안드로이드 출시 스택 (SDK 54 · API 36 · 16KB)

- 작성: 김플레이
- 날짜: 2026-10-07
- status: CONSULTED
- 대상: 김팀장 내일 안드로이드 출시 스택 (게임 로직 마감·자정 스냅샷 이후)
- 코드 수정: 없음. 프로세스·Metro·git commit 없음.

## 종합 판정

**조건부 동의**

출시 스택 순서(Old Architecture 유지 SDK 54 개발 빌드 → Skia 16KB 호환 → Reanimated 4·New Architecture는 다른 날)와, 자정 스냅샷이 HEAD에 있기 전에는 SDK를 올리지 않는다는 전제에 동의한다. 플레이봇 운영 조건이 지켜질 때만 진행한다.

## 실기 의존 판정 (읽기만)

| 경로 | 기기·Metro | 판정 |
|---|---|---|
| `npm run playbot:start` / `playbot:run` → `run-harness.ts` | adb·Metro·Expo·세이브 없음. 파일 주석: Node 전용 | **헤드리스. 기기 없이 계속 가능** |
| `npm run playbot:test` | 단위 테스트. 기기 없음 | 헤드리스 |
| `npm run playbot:report-daily-18` | 시드 갱신에 adb가 있으면 쓰고, 없으면 리포트만 기록 | 기기 없어도 리포트는 됨 |
| `watch-owner-playlog-auto.ts` (`playbot:ensure-owner-auto`) | `adb devices`가 있을 때만 logcat. 15초마다 `adb reverse tcp:8081` 복구, `pidof`, `dumpsys power`, RKStorage | **Metro 8081·무선 adb에 매달림** |
| `playbot:owner-start` / `owner-stop` / `playbot:refresh-human-seed` | logcat·RKStorage·adb pull | 실기 전용. 스택 올리는 날 호출 금지 |
| `PLAYBOT_DAILY_LOOP.md` | 하니스는 끄지 않고 학습을 잇는다. owner-auto는 adb가 있으면 자동 수집. 정체 재플레이도 owner-auto는 건드리지 않음 | 자정 전까지 정지 금지 |

owner-auto가 사람 플레이로 세는 줄: `[PLAY_VERB] verb=…` 와 `[MEM_PROFILE] event=route_focus|transit_hop_start|system_change|planet_change`. 조작 3회 미만·since 공란은 human-seed에 넣지 않는다. 앱 pid가 바뀌면 세션을 닫는다. 재빌드·재설치 중에 데몬을 켜 두면 깨진 개발 빌드 로그가 세션으로 닫힌다.

## 자정 전 — 플레이봇이 하면 안 되는 것

- 실기 검증을 새로 걸지 않는다. 전투 히치·드록 결과창·16KB 재실측 포함.
- 헤드리스 하니스를 끄지 않는다.
- owner-auto를 끄지 않는다. 협의 없는 `playbot:owner-stop`·disable 플래그 금지.
- Metro는 기존 하나, 포트 8081만. 두 번째 Metro 금지. USB 안내 금지. 기기 SM_A346N, 무선 adb.

자정 커밋은 김팀장 절차(audit:daily 통과 시에만 `chore(daily): snapshot` + push, 실패 시 커밋·push 생략)를 따른다. 플레이봇은 그 커밋에 게임 본체 패치를 얹지 않는다.

## 내일 스택을 올리는 날

- **owner-auto와 실기를 멈추는 시점:** 아침 HEAD에 오늘 자 스냅샷이 있는지 확인할 때까지는 그대로 둔다. `expo prebuild` / Gradle / 개발 빌드 재설치로 기기 앱이 깨지기 **직전**, 김플레이와 한 번 합의한 뒤에만 owner-auto를 멈춘다. 재빌드가 끝나고 새 빌드가 무선으로 Metro 8081에 붙기 전에는 다시 켜지 않는다.
- **헤드리스 심:** 계속 가능. `playbot:run`·콘솔 하니스·`playbot:test`·18:00 리포트는 기기 없이 돈다. 하니스는 네이티브 재빌드와 무관하다.
- **그날 금지:** 실기 플레이, owner-start, refresh-human-seed, 전투 히치·드록·16KB 재실측, 두 번째 Metro, 하니스 종료.
- 갤럭시 A34(SM_A346N)는 4KB 페이지라 현재 디버그 APK(ELF 59·zip 93, `p_align=4096`)가 실행된다. 스토어 기준은 API 36 + 16KB다. 링커 플래그만으로는 Hermes·Skia·RN 사전빌드 4KB를 통과시키지 못한다. 재실측은 스택이 안정된 뒤.

## [PLAY_VERB] · devPlayVerbLog — 김팀장이 업그레이드 중 손대면 안 되는 경계

김플레이 경로: `tools/play-bot-console/**`, `docs/playbot/**`, `src/game/devPlayVerbLog.ts`, 그리고 `[PLAY_VERB]` 방출 호출.

- `emitPlayVerb` 로그 형식 유지: 개발 빌드에서만 `` `[PLAY_VERB] verb=${verb}` ``, detail은 공백을 `_`로. `__DEV__`가 꺼진 릴리스에서는 console이 없다. 개발 빌드에서 console 제거·`__DEV__` 게이트 변경 금지.
- 방출 호출을 삭제·동사 문자열 변경 금지: `land`·`level`·`skill` (`playerStore`), `quest` (`missionStore`), `mine`, `scan`, `combat`, `talk`, `annex`, `trade`, `develop`.
- 컴파일 때문에 그 파일을 열더라도 `emitPlayVerb(...)` 줄은 그대로 둔다. 틱·프레임 루프에 방출을 넣지 않는다.
- owner-auto 정규식(`[PLAY_VERB] verb=\S+`, 위 MEM_PROFILE 네 이벤트)과 어긋나는 로그 포맷 변경 금지.

## 새 개발 빌드가 긴 뒤 김플레이가 다시 재는 항목

재실측은 **스택이 안정된 뒤**. 업그레이드 당일 실기 금지.

1. 전투 히치 — 이동 전투 프레임이 버벅이는지. 기존 히치 리포트 대비.
2. 드록 결과창 — 결과 오버레이가 뜨고 닫히는지.
3. 16KB 경고 — 새 개발 빌드에서 ELF `p_align`·zip 정렬. 스토어 제출 후보는 API 36 + 16KB. 폰 경고가 남아 있으면 실행 가능(4KB)과 제출 가능(16KB)을 구분해 보고.

Skia는 Expo 54에서 16KB 바이너리가 있는 버전만. 전투 메모리 규칙(프레임 루프 `Make`/`Paint` 금지, 단일 Path `rewind`)은 유지. 반쪽 패치 금지.

## 김팀장에게 넘기는 조건

1. 자정 스냅샷이 HEAD이고 audit:daily가 통과한 뒤에만 SDK를 올린다. 미커밋 1차 버그 수정과 스택 업그레이드를 한 커밋에 섞지 않는다.
2. 네이티브 재빌드 직전, 합의 후에만 owner-auto를 멈춘다. 그 전까지 하니스·owner-auto·Metro 8081 하나를 끄지 않는다. 두 번째 Metro 금지.
3. 올리는 날은 실기 플레이와 전투 히치·드록 결과창·16KB 재실측을 걸지 않는다. 헤드리스 하니스와 18:00 리포트는 기기 없이 계속한다.
4. SDK 54는 Old Architecture 유지. Reanimated 4와 New Architecture는 같은 날 올리지 않는다. `devPlayVerbLog.ts`와 `[PLAY_VERB]` 방출 줄은 업그레이드 diff에서 뺀다.
5. 새 개발 빌드가 무선 adb(SM_A346N)에서 Metro 8081에 붙고 스택이 안정된 뒤에만 김플레이가 전투 히치·드록 결과창·16KB를 다시 잰다.
