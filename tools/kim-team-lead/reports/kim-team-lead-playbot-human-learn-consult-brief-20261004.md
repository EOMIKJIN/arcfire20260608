# 김팀장 → 김클로드 협의 브리프 — 인간 플레이 수준 플레이봇

```text
task_id=playbot-human-learn-consult-20261004
kind=CONSULT (코드 변경 0 · 커밋 금지)
작성=김팀장 · 2026-10-04 02:49 KST
요청=대표님 — 의도·최종목표·학습방법을 김클로드에게 설명하고, 김팀장 분석도 공유한 뒤 협의 결론을 정리
교차=docs/PLAYBOT_HUMAN_PATTERN_AND_ARCCORE_LEARNING_v1.md (v1.1 · 설계 정본 · 코드 착수 금지)
     tools/kim-team-lead/reports/kim-claude-playbot-learning-audit-20261002.md
     tools/kim-team-lead/reports/kim-claude-playbot-human-data-scale-plan-20261002.md
```

김클로드는 이 분석을 그대로 받지 말 것. 아래 파일·줄을 직접 읽고 AGREE / PARTIAL / DISAGREE 를 근거와 함께 적어 달라.

## 1. 대표님 의도 (오늘 대화에서 확정된 말)

최종 목표: **인간 플레이어 수준의 플레이봇 완성.**

기준: 대표님이 실제로 플레이한 **원시 플레이 데이터**.

도달 범위: 전체 게임플레이의 최종 레벨, 모든 콘텐츠, 모든 퀘스트, 적과의 전투, 전투 방식 효율. 스스로 개선하면서 그 수준에 가까워진다.

학습 방법 (두 문장이 한 루프):

1. 목표를 수행하는 데 필요한 기능을 찾아 추가하고, 목표를 다시 도전한다. 또 부족하면 그 기능을 반복해 넣는다.
2. 대표님 플레이 데이터가 **쌓일 때마다** 그 원시를 분석한다. **새 플레이 데이터가 있을 때만** 학습을 다시 돌린다.

거부된 것: 가상 120일마다 초반(레벨 1)으로 되돌려 초반만 반복 학습하는 방식. 2026-10-04 김팀장이 `learnGate.ts`에서 until-close 120일 컷·캠페인 재시드를 뺐다. 한 세계 연속은 그 지시의 결과이고, 위 루프 자체는 아직 아니다.

## 2. 김팀장 현황 분석 (재검증 대상)

### 2-1. 수집은 된다

- `tools/play-bot-console/watch-owner-playlog-auto.ts` — adb logcat. 유휴 20분·날짜·앱 pid·3시간·기기 끊김에 세션을 닫는다.
- `shouldImportAutoSession` (`src/ownerPlaylogAuto.ts`) — 화면 켜짐 조작 마커 3개 미만·since 없음·MEM_PROFILE 0건은 시드에 넣지 않는다. 원본 폴더는 남는다.
- 닫을 때 `import-mem-profile-trace.ts` → `writeHumanSeed`. 최근 32세션(`HUMAN_SEED_SESSION_CAP`).

### 2-2. 분석은 동사 개수다

- `src/humanSeed.ts` `VERB_TO_KIND`: land/depart/travel→travel, combat→combat, quest/scan/mine/talk→quest, trade→trade.
- `blendPersonaWeights` — 관측된 ActionKind 비율로 기준 가중치 합만 다시 나눈다. 비관측 kind는 하드코드 유지.
- `orderTop`은 시드 전체의 동사 쌍 상위 3개. 이번 세션이 이전에 없던 무엇을 새로 보여 주는지는 저장하지 않는다.
- 실기 원시는 `[MEM_PROFILE]` 화면 전환(route_focus, transit_hop, system_change, planet_change)이다. 퀘스트 수행·전투 방식(사거리·무장·접근)은 이 로그에 없다. A-2 허브 동사 로그는 계획에만 있고 승인 전이다 (`PLAYBOT_DAILY_LOOP.md`).

### 2-3. 학습은 새 실기와 무관하게 돈다

- `run-harness.ts` `onDay` — 시드 mtime이 바뀌면 캐시만 다시 읽고 «진행 세계는 유지». 학습 1회를 열지 않는다.
- `adaptPolicy` (`src/policy.ts`) — 트윈 승패·격납고·HOLD로 가중치를 올린다. 새 인간 델타가 없어도 가상일 주기마다 돈다.
- `pickStepKind` — 탐색 비율일 때만 학습 가중. 그 외는 `decideIntentKind` 고정 규칙.
- 전투는 `winChance` 주사위(`actions.ts`) + `fightPowerBonus`. 방식 학습 없음.
- 퀘스트: `listPlayableMissionIds`가 skeleton 본편·일부 sandbox를 빼고, 미해석 토큰은 HOLD. 기능 추가 루프는 없다.
- 18:00 `dailyUrgentTriage.ts` — 보고 이슈만 escalate. 나머지는 «자체 1안» 메모. 기능을 넣고 재도전하지 않는다.

판정: 지금은 «실기가 쌓이면 이동 비율이 조금 바뀐 채 같은 판이 계속 돌고, 봇 자기 KPI로 가중치가 계속 움직인다». 대표님 의도의 «새 원시를 분석한 뒤에만 학습을 다시 연다»가 아니다.

## 3. 김팀장 제안 (1안 · 구현 전)

수집 데몬은 유지. 학습이 켜지는 조건만 바꾼다.

```text
실기 세션 닫힘
  → 조작 있는 세션만 원시 보관
  → 직전 시드와 비교해 human-delta.json (분석)
  → 새 내용이 있으면 학습 1회
  → 목표 카드까지 한 세계로 수행
  → 막히면 부족 기능 1개 기록
  → 그 기능을 트윈에만 추가
  → 기능 추가를 트리거로 같은 목표 학습 1회
```

- 새 실기도 없고 넣은 기능도 없으면 `adaptPolicy`는 멈춘다.
- 델타 칸: 새 세션 id, 이번 세션에만 있는 동사 쌍, 트윈이 이미 하는 동사, 트윈에 없는 동사, consumed.
- 분석 입력은 32세션으로 잘린 시드가 아니라 방금 들어온 세션 원시.
- 전투 방식은 그 세션 로그에 있을 때만 델타에 적는다. 없으면 «이번 실기에는 전투 방식 없음». 주사위 승률로 전투 학습을 열지 않는다.
- 목표 카드: 최종 레벨, 수행 가능 퀘스트, 실기에 나온 콘텐츠 동작, 전투가 기록된 경우의 전투 효율.
- 성공 = 이전 수행보다 순서 재현·퀘스트 수·레벨·(기록된) 전투 효율이 앞서는 것. 가중치 세대 번호가 아니다.
- 앱 세이브·밸런스 CSV·13번째 서브코어·타이틀/부트 경로는 열지 않는다.
- v1.1 순서 «실기 원시 → 봇 학습 → 인간 근접»은 유지. 2026-10-02 구현 보정의 120일 학습창과, 시드가 없을 때의 페르소나 가중 학습은 이 1안에서 뺀다.

구축 순서 제안: (1) 미소비 델타가 있을 때만 adapt (2) import 직후 델타 작성 (3) 부족 기능 1개씩 트윈에만 추가하고 앞엣지 스냅샷으로 확인.

## 4. 김클로드에게 묻는 것

답은 `tools/kim-team-lead/reports/kim-claude-playbot-human-learn-consult-20261004.md` 에만 쓴다. `src/` `app/` `tables/` `kim-claude-handoff-pending.md` 는 수정하지 말 것. 커밋하지 말 것.

1. 대표님 의도 해석 — AGREE / PARTIAL / DISAGREE. 틀린 전제가 있으면 정정.
2. §2 현황 — 파일을 다시 읽고 틀린 줄을 고쳐라.
3. §3 루프 — 채택 / 수정안. v1.1 §7·§9·§10, 2026-10-02 감사, scale plan A-1~A-5 와 충돌하면 어디인지.
4. 최종 목표 «인간 플레이어 수준»의 완료 조건을 측정 가능한 문장으로. 인간 세션 0건·전투 필드 0건일 때 선언 금지 여부를 포함.
5. 공동 결론: 지금 코드로 착수해도 되는 최소 범위 1개, 대표님 승인 없이 하면 안 되는 것, 보류.

한국어. 대표님 호칭. 코드 인용은 파일:줄.
