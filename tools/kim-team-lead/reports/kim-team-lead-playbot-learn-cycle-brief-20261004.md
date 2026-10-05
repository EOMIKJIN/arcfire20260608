# 김팀장 → 김클로드 협의 브리프 — 학습 프로세스 6단계

```text
task_id=playbot-learn-cycle-20261004
kind=CONSULT (이 브리프 단계에서는 코드 변경 0 · 커밋 금지)
작성=김팀장 · 2026-10-04 10:34 KST
요청=대표님 — 아래 6단계가 전체 학습 프로세스다. 협의 후 최종 개선안을 만들고 반영해 학습 프로세스를 고도화한다.
선행 결론=tools/kim-team-lead/reports/playbot-human-learn-consult-conclusion-20261004.md
         (델타 게이트·M1·M3는 이미 반영. 이번 협의는 그 위를 덮어쓰지 않는다)
```

김클로드는 이 분석을 그대로 받지 말 것. 인용한 파일을 직접 읽고 AGREE / PARTIAL / DISAGREE 를 근거(파일:줄)와 함께 적어 달라.

답변 파일만 작성한다. `tools/kim-team-lead/reports/kim-claude-playbot-learn-cycle-consult-20261004.md`
`kim-claude-handoff-pending.md` 와 `src/` `app/` `tables/` 는 수정하지 말 것.

## 1. 대표님이 잠근 학습 프로세스

이 여섯 단계의 반복이 학습 전체다. 가중치 한 줄이나 승수는 재료다.

1. **원시 데이터** = 대표님 플레이. 실시간으로 이어지는 게임 안에서 쌓이는 중요 플레이.
2. 그 수집으로 봇 플레이의 **행동 기반**을 만든다.
3. 그 기반으로 봇이 **전체 플레이를 설계하고, 지금 가능한 범위에서 인간형으로 실행**한다. 초반 3분, 하루 플레이, 주요 퀘스트, 전투, 그 밖에 가능한 행동, 레벨에 따른 전투가 설계에 들어간다.
4. 3번 실행의 **총괄 분석**. 부족한 점, 설계를 따르지 않은 점, 목표 의도와 다른 점.
5. 개선안 **자체 분류**. 봇에 넣을 기능과 게임에 넣을 기능.
6. **보고하고 반영**. 실제 작업은 봇 기능과 게임 기능 양쪽. 그 다음 1번으로 돌아간다.

1인 플레이만으로 충분하다. 다른 유저는 필요 없다.

## 2. 김팀장 현황 (재검증)

### 2-1. 1–2만 부분 가동

- 수집: `watch-owner-playlog-auto.ts`. 15초 폴링. 세션은 유휴 20분·앱 pid·날짜·3시간·기기 끊김에 닫힌다 (`ownerPlaylogAuto.ts` `shouldRotateAutoSession`).
- 사람 인정: 화면 Awake일 때 `route_focus|transit_hop_start|system_change|planet_change` 가 3회 이상 (`countUserActionMarkers`, `AUTO_MIN_USER_ACTIONS=3`). 미만은 profiler, 시드 제외.
- 학습 가중: 미소비 `human-delta.json`이 있을 때만 `adaptPolicy` (`policy.ts`). 새 동사쌍 +0.02. 승패·레벨·퀘스트 범프 없음. 델타 없으면 `새 실기 없음·학습대기`.
- 오늘 03:54 KST 이후 정책 파일은 세대 65789에서 멈췄다. 메모는 `신규순서 없음 · 전투방식 없음`. 런 `pb-2026-10-03T1809-mixed_ref` 는 가상 9747일·L60·퀘스트 96·편입 0·개척 0·블루 0·레드 18·수도 플래그 1·크레딧 약 60만·전투 29479승/5732패. LEARN 줄은 학습대기.

### 2-2. 3–6은 순환이 아니다

- 실행은 `stepAction` / `decideIntentKind` / `earlyFeel`(180초). 전투는 `winChance` 주사위 (`actions.ts` `fightHere`). 웨이브 9·이터니티 복제·전투 방식 필드 없음.
- `analyzeDay` (`analyze.ts`)는 당일 위험 코드다. 본편 P0–P5·`story_022`·수락의뢰 33·독립국 1과 대조하지 않는다. 가상일마다 ANALYZE를 찍지만 개선안 분류·반영으로 이어지지 않는다.
- 설계 대조 정본: `docs/expansion/엔드콘텐츠_개발계획.md` §5-3·§5-5·§7. 라이브 부모 55 (`story_001`–`022` + `sandbox_001`–`033`). 엔드 입장은 레벨 52. 독립국 ≥1. 블루≥레드는 소프트 관측. `questCleared=96` 을 만렙 게이트로 쓰지 말 것 (§6-4).
- 승리 도색: `actions.ts` `fightHere` 승리면 `RED` 와 `BLUE` 를 모두 중립으로 바꾼다. 아군 블루 승리도 영토를 지운다.
- 게임 기능 자동 수정은 이번 착수에서 하지 않는다. 6번의 «게임 기능»은 분류된 보고로 남기고, 반영 코드는 트윈(Node)만. 앱 틱·CSV·세이브 금지. 13번째 서브코어 금지.

## 3. 김팀장 개선안 (채택·축소·기각을 판정해 달라)

### A. 프로세스 모듈 (이번 반영의 본체)

`tools/play-bot-console/src/learnCycle.ts` 순수 함수.

입력: 트윈 KPI (level, questCleared, annexOk, colonizeOk, blue, red, neutral, independent, capitalDestroyed, credits, blueVault, combatWins/Losses, currentPlanetId) + 델타 유무(전투방식 absent/present).

출력:

- `design`: 레벨 밴드로 P0–P5 중 지금 단계 한 줄. 초반 3분은 `earlyFeel`에 두고 이 판정에 넣지 않는다.
- `gaps`: 설계와 다른 점. 레벨 60·퀘스트 96은 그 자체로 완료가 아니다.
- `classes`: 각 gap을 `bot_function` | `game_function` | `hold` 중 하나.
- 가중치·generation은 바꾸지 않는다. 델타 게이트는 그대로 2번 전용.

기록: 가상일마다 디스크에 쓰지 않는다. 판정 서명이 바뀌거나 벽시계 10분이 지났을 때만 `logs/learned/learn-cycle-latest.json` 한 파일을 교체한다. 이력 배열은 두지 않는다.

하니스 `onDay`에서 호출한다. 학습대기 중이어도 4–5번은 돈다. 지금 프로세스는 재시작해야 새 코드가 로드되고, 재시작은 메모리 세계를 L1으로 되돌린다. 그래서 첫 보고는 상태 JSON을 읽는 1회 실행으로 만들고, 하니스 재시작은 이번 착수에서 하지 않는다.

### B. 이번 사이클에서 트윈에 바로 넣는 bot_function 하나

`fightHere` 승리 시 `BLUE` 를 중립으로 바꾸지 않는다. `RED` 승리는 지금처럼 중립화. 블루를 스스로 지우는 경로는 설계의 점령과 다르다.

편입·개척 가중을 레벨 60 농장으로 올리지 않는다. P4 전 편입 강제는 엔드 문서의 배드케이스이므로 이번엔 넣지 않는다.

### C. game_function 은 보고만

아래는 분류만 하고 `src/` `app/` `tables/` 를 수정하지 않는다.

- 전투 방식(거리·무기·접근)이 원시 마커에 없다.
- 웨이브 9·`eternal_throne` 복제 보스가 트윈에 없다.
- 중요 플레이 마커가 이동 4종뿐이다.
- `readOffset` 을 Awake 판정보다 먼저 올리는 구멍.

### D. 테스트

`play-bot-console.test.ts`에 사이클 판정 2개. (1) L60·퀘 96·블루 0·편입 0·수도 1은 완료가 아니고 gap이 있다. (2) 서명이 같으면 기록 스킵. 기존 델타 게이트 테스트는 유지.

## 4. 물어보는 것

1. 6단계를 이렇게 나누는 것이 대표님 의도와 맞는가. 어긋나면 어디인가.
2. A의 벽시계 10분·서명 교체·하니스 무재시작이 PSS(가상일이 분당 수십 일)와 맞는가.
3. B를 이번 bot_function으로 넣는 것이 맞는가. 더 작은 수정이 있으면 그것으로 바꿔라.
4. C를 게임에 바로 넣지 않는 것이 6번 «게임 기능도 반영»과 충돌하는가. 충돌하면, 이번 착수에서 게임 쪽에 허용되는 최소가 무엇인지 한 가지만 말해라. 앱 틱·CSV 값 변경·세이브는 제외다.
5. 완료 선언은 여전히 금지인가. 인간 세션의 전투방식 0, 독립국 0이면 인간 수준·시나리오 완료를 말하지 않는다.
