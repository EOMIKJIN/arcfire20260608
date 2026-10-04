# 김팀장 → 김클로드 정밀 협의 — 플레이봇 실기 연결 설계

```text
task_id=playbot-live-phone-design-20261004
kind=CONSULT (코드 변경 0 · 커밋 금지 · 설계만)
작성=김팀장 · 2026-10-04 11:06 KST
대상=docs/PLAYBOT_LIVE_PHONE_DESIGN.md
선행 학습=playbot-human-learn-consult-conclusion-20261004.md
         playbot-learn-cycle-conclusion-20261004.md
```

김클로드는 설계문을 그대로 받지 말 것. 아래를 직접 읽고 섹션마다 AGREE / PARTIAL / DISAGREE 를 파일:줄과 함께 적어 달라. 최종 설계에 넣을 수정 문장까지 써 달라.

답변 파일만 작성한다.
`tools/kim-team-lead/reports/kim-claude-playbot-live-phone-consult-20261004.md`

금지: `src/` `app/` `tables/` `firestore.rules` `kim-claude-handoff-pending.md` 수정. 커밋 금지.

## 대표님 잠금 (이 문장에서 벗어나면 DISAGREE)

1. 지금 구축된 학습 프로세스(대표님 실기 → owner-auto → human-delta → adaptPolicy → learn-cycle, PC 트윈 가상일)는 동작 규칙을 바꾸지 않는다. 봇이 아닌 대표님 플레이의 학습은 계속된다.
2. 스마트폰은 한 대. 시작 화면에서 설정 버튼과 동일한 디자인(높이 47, `btnStart` 크롬)의 봇 버튼을 **왼쪽**에 둔다. 설정은 오른쪽. 임시이며 출시 빌드에서는 그리지 않는다.
3. 봇을 누르면 파이어스토어 가상 계정이 플레이를 시작한다. 컬럼과 구조는 대표님 데이터를 복제한 디폴트 시작이다.
4. 그 계정은 실시간으로 사람처럼 실기(허브·이동·전투·퀘스트)를 지속한다. 트윈 주사위·가상일 배속은 이 세션에 넣지 않는다.
5. 종료는 앱 강제 종료 또는 나가기 버튼. 둘 중 하나면 봇 프로세스는 끝난다. 둘을 동시에 눌러야 끝나는 조건이 아니다.
6. 대표님 세이브는 봇 플레이로 덮이지 않는다.

## 김팀장이 코드에서 본 충돌 (재검증 후 설계를 고쳐라)

설계 §4는 클라우드 문서를 `arcfire_player_v1`이라고 적었다. 로컬 키는 `playerStore`의 `arcfire_player_v1`이고, 클라우드 정본은 `users/{uid}` (`src/firebase/firestoreRefs.ts` `USERS_COLLECTION`, `userDataSync.ts` `syncUserDataWithServer`)다. `firestore.rules`의 `users/{uid}` create/update는 `request.auth.uid == uid`가 아니다. `authed()`이면 된다. 게임 uid와 Auth uid는 규칙 주석이 분리한다고 적혀 있다(`firestore.rules` 행성 증서 근처).

그래서 가상 계정은 **같은 익명 Auth로 `users/{botUid}` 문서를 쓰는 것**으로 보는 것이 김팀장 수정안이다. 폰에서 Firebase Auth 사용자를 갈아타면 대표님 세션과 기기가 꼬인다. 이 수정이 규칙·`getCurrentUser`(기기 스코프, `auth.ts`)와 맞는지 판정하라.

닉네임 예약은 `nicknames/{sha}`에 uidHash가 있다. 대표님 닉을 봇 문서에 그대로 넣으면 예약 충돌이 난다. 봇 표시 닉은 복제본과 달라야 하는지 한 줄로 정해라.

`planet_unique_deeds`는 `authUid == request.auth.uid`이고 update는 `ownerUid`를 못 바꾼다. 진행 스냅샷을 통째로 복제하면 봇이 대표님 증서 문서를 다시 쓰려 할 수 있다. 복제 제외를 설계에 못 박아라.

섀도우: `scheduleArcCoreShadowPairingPassAfterBoot`는 부트 후 약 12초에 `getCurrentUser().uid`로 `ensureArcCoreShadowPairing`을 호출한다(`runArcCoreShadowPairingPass.ts`). 봇 버튼을 그 전에 누르면, 활성 uid가 봇으로 바뀐 뒤 지연 패스가 봇을 대기열에 넣을 수 있다. 봇 세션 플래그가 켜져 있으면 패스가 return 해야 한다. 대표님 uid의 기존 페어는 유지한다. 봇 uid는 풀에 넣지 않는다.

`PLAYER_GAME_SAVE_BACKUP_KEYS`에는 `arcfire_planet_core_runtime_v1`이 들어 있다. 주석은 팩션 금고·무역 원장은 월드 축이라 제외한다고 한다. 설계 §4의 «월드 축은 봇 오버레이에만»이 이 키 목록과 충돌한다. 봇이 대표님 세계 파일을 덮지 않으려면 어떤 키를 활성 슬롯 스왑으로 두고, 어떤 키를 봇 오버레이(종료 시 폐기)로 둘지 표를 다시 써라.

수집: `watch-owner-playlog-auto.ts` `absorbNewLog`는 화면 Awake일 때 `route_focus|transit_hop_start|system_change|planet_change`를 userActions로 센다. 봇이 같은 폰에서 그 이벤트를 내면 사람 시드로 들어간다. 설계는 «봇 세션 동안 시드에 넣지 않음»이다. 구현 없이, **수집기 판정 한 곳**에 봇 세션 플래그를 보는 것이 학습 규칙(3회·20분·델타 게이트)을 바꾸지 않는 최소인지 판정하라. 플래그가 꺼진 뒤의 대표님 조작은 지금과 같아야 한다.

정책: 폰이 `playbot-policy.json`을 시작 때 1회 읽는 것은 PC 트윈 세계를 바꾸지 않는다. 그 가중만으로 실기 `decideIntent`가 되는지, 트윈 `WorldState` 없이 실기 스토어를 읽어야 하는지를 구분해라. 실기 실행기가 트윈 `fightHere`를 호출하면 설계 위반이다.

PSS: 타이틀 `titleInteractive` 전에 복제·프리웜 금지. 복제는 차원항로. 실행기는 화면 setInterval 금지. 전투 dispose 전 다음 행동 금지. 강제 종료 후 다음 부트는 봇 자동 재개 없이 대표님 칸 복구.

## 섹션별 질문

설계 문서 §0~§7 각각에 대해:

- 사실 오류 (파일:줄)
- 대표님 잠금과 충돌하는 문장
- 최종안에 남길 문장 또는 대체 문장
- 이번 설계에서 아직 열면 안 되는 구현

마지막에 **최종 설계 초안**을 김클로드 문장으로 8절 이내로 써라. 김팀장이 그 초안을 검수한 뒤 정본을 고친다.
