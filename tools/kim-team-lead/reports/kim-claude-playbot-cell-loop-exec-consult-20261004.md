# 김클로드 → 김팀장 협의 답 — 세포 학습 루프 실행

```text
task_id=playbot-cell-loop-exec-20261004
kind=CONSULT (이 턴 코드 0 · 답변 파일 1장만)
작성=김클로드 · 2026-10-04 KST
브리프=tools/kim-team-lead/reports/kim-team-lead-playbot-cell-loop-exec-brief-20261004.md
정본=docs/playbot/PLAYBOT_CELL_LEARNING_DESIGN.md §0 · §0-1 · §0-2 · §3 · §4 · §5 · §6
재검수 범위=intent.ts · actions.ts · run-harness.ts · watch-owner-playlog-auto.ts · memProfileToSessionTrace.ts
```

> 재검수 원칙(2026-08-02 룰)대로 브리프 초안을 그대로 받지 않고 정본·코드로 전제를 직접 확인했다. 아래 판정은 파일:줄 근거를 단다. 커밋·완료 선언은 하지 않는다.

---

## 1. 이 범위가 §0-2의 한 바퀴를 실제 행동까지 닫는가 — **AGREE (조건 1개)**

§0-2(docs/playbot/PLAYBOT_CELL_LEARNING_DESIGN.md:40–49)의 한 바퀴는 생성→수집→반복→검증→선별→**적용(6번)**→다시 1번이다. 브리프 B가 그 6번을 실제 행동에 건다: `stepAction` 이 combat/trade 를 고른 뒤 카드의 선택 장소를 우선한다(판정 지점 = `actions.ts:598`~`604` combat 분기, `actions.ts:605` trade 분기, 그리고 의도 산출 `intent.ts:58` `pickStepKind`). "declareComplete 는 항상 false · 바퀴 수만 증가"는 §0-2:38 「한 번의 카드 기록이 학습 완료가 아니다」와 §1:58 「1회 완료가 아니다」에 정확히 맞는다. 누적 평균(승1패0, 크레딧 델타)로 점수를 쌓는 것도 §0-2:44 「다음 플레이와 다음 봇 행동에서 다시 본다」의 반복 축적과 맞는다. **1회 완료로 읽히지 않는다.**

**조건(여기를 고쳐라) — 적용(6번)의 읽기 지점을 프로세스 안에서 닫아야 한다.**
- 정본 §6(130줄)은 「통합 카드의 재로드 경로는 없다」라고 적는다. 그 말대로 구현하면 6번(적용)이 **하니스 재시작 때만** 일어난다. 그런데 Section C(재가동)는 재시작이 가상일을 1로 되돌린다고 한다. 즉 "재시작으로만 적용"이면 바퀴가 재시작 사이에 멈춘다.
- 다행히 untilClose 모드는 한 프로세스가 캠페인을 연속으로 돈다(`run-harness.ts:127` `while (isRecording())` · `run-harness.ts:282` `shouldLoopNextCampaign`). 시드는 캠페인 머리에서 재로드된다(`run-harness.ts:129` `reloadHumanSeedIfChanged`). **카드도 같은 자리(캠페인 경계)에서 재로드하거나, onDay 가 메모리 카드 객체를 갱신하고 `stepAction` 이 그 객체를 읽게 하면** 재시작 없이 프로세스 안에서 6→1 이 닫힌다. 이 읽기 지점을 명시로 넣어야 "반영되지 않은 검증은 학습이 아니다"(§0-2:49)를 어기지 않는다.
- 부수 확인: 브리프 A는 쓰기를 「벽시계 10분·서명 변경 시」로 게이트한다(§3:92, §2:86과 일치). 반면 읽기(onDay)는 가상일마다 돈다(`run-harness.ts:176` `onDay`). 읽기 cadence 가 10분 타이머가 아니라 onDay 라는 점은 수용 — 읽기 전용이고 쓰기만 게이트되므로 §3 위반 아님. 다만 구현 보고에 "읽기=onDay, 쓰기=10분 벽시계"로 분리 기재하라.

---

## 2. 전투 승패 평균·교역 크레딧 평균을 가족 안 효율로 — **PARTIAL**

§0-1:32 는 「효율 숫자의 공식은 이 문서에서 새로 확정하지 않는다 … 기존값을 덮지 않고 가족 안 비교만 연다」이다. 두 지표는 **기존에 이미 기록되는 결과**를 재집계하는 것이라 새 가중 공식이 아니다 — 전투 승패는 `actions.ts:199`(`world.combatWins`) · `actions.ts:215`(`world.combatLosses`), 교역 크레딧은 `actions.ts:509`~`512`(`world.credits += TRADE_SELL`)에 이미 있다. 점수 없는 세포는 순위를 안 바꾼다는 제약도 §0-1:30 · §5:120 과 일치한다. 여기까지 AGREE.

**PARTIAL 사유 — 교역 크레딧 평균은 현재 코드에서 가족 안 변별력이 없다(degenerate).**
- `TRADE_SELL=310` · `TRADE_BUY=420` 는 **장소 무관 평탄 상수**다(`actions.ts:61`~`62`). `doTrade` 의 매도는 어느 장소든 `+310` 고정(`actions.ts:509`). 세포 키가 가족+장소+멈춤/쓰임인데, 매도 세포의 크레딧 평균은 장소가 달라도 전부 +310 → **"더 효율적인 매도 장소"를 가를 수 없다.** 게다가 매도/매입 비율은 이미 `getPreferSell`(`actions.ts:495`)이 정책으로 편향하고 있어, 교역 점수는 그 편향과 중복된다.
- 반면 전투 승률은 `winChance` 가 `slot.tcl` 에 의존(`actions.ts:172`~`175`)하므로 장소별로 실제로 갈린다 → 전투 평균은 변별력 있는 효율 지표다. 이건 그대로 수용.
- **권고**: (a) 교역 점수는 장소별 가격이 생기기 전까지 보류하거나, (b) 쓴다면 평탄 상수 대신 `itemBasePrice`(`actions.ts:448`·`catalog`)처럼 품목/장소로 변하는 값에 걸어라. 그리고 두 공식을 상한으로 고정 — travel/develop 등 **제3의 공식은 거절**(§0-1:32). 두 평균 모두 **adaptPolicy 가중에 되먹이지 말 것**(§5:124 의 +0.02 스칼라에 장소·멈춤·쓰임이 들어가면 안 됨).

---

## 3. 퀘스트·격납고·초반 분기를 카드가 덮지 않는 것 — **AGREE**

카드는 kind 가 정해진 **뒤** combat/trade 의 장소만 우선한다. 하드 게이트는 그대로다:
- 격납고 0 → travel: `intent.ts:26` · `intent.ts:59` · `actions.ts:582`(`if (world.hangarShips <= 0) kind = 'travel'`).
- 초반(earlyFeelClosed 전) → quest: `intent.ts:27` · `pickStepKind` 가 earlyFeelClosed 전에는 learn-explore 를 타지 않음 `intent.ts:60`~`61`.
- 진행 중 퀘스트 우선: `intent.ts:32`~`35` · `actions.ts:583`(`else if (world.activeQuest && rng() < 0.48) kind = 'quest'`).

이 게이트를 카드가 덮지 않는 것이 **옳다.** 퀘스트는 목표 행성으로 라우팅된다(`doQuest` → `objectivePlanetId`/`questFightPlanet`, `actions.ts:394`~`396`, `actions.ts:466`~`478`). 카드가 퀘스트 장소를 덮으면 목표 행성 도달·격파 판정이 깨진다. 특히 「플레이어 사망 = 퀘스트 실패」가 최상위 룰이라 퀘스트 전투 경로를 학습 카드로 흔드는 것은 금물. §0-1:30 「목적이 없으면 그 가족은 갱신하지 않고 봇은 지금 선택한 세포로 계속」과도 일치 — 퀘/격납고/초반은 최적화 대상 "가족"이 아니라 게이트다. **그대로 유지가 정답.**

---

## 4. 하니스만 재시작하고 owner-auto 는 살리는 것 — **AGREE**

브리프 Section C 의 전제를 코드로 확인했고 맞다.
- owner-auto 의 stop 핸들러는 SIGINT/SIGTERM 에서 `closeSession(active, 'signal')` 를 호출한다(`watch-owner-playlog-auto.ts:341`~`345`). `closeSession` 은 capture.pid(logcat)를 killTree 하고 세션을 닫아 시드 임포트까지 돌린다(`watch-owner-playlog-auto.ts:251`~`305`). → **owner-auto 를 죽이면 진행 중 실기 세션이 강제로 닫혀 중간 임포트된다.** 살려 두는 것이 진행 중 실기를 지킨다. AGREE.
- 하니스 stop 은 owner-auto·human-raw 로그를 건드리지 않는다 — `persistLearningNow`/`flushLearnedWrites`/`endRecording` 만 한다(`run-harness.ts:93`~`97`). 재시작은 메모리 세계만 L1 으로 되돌리고 디스크 학습 산출(정책·시드·델타·카드)은 남는다. 정본 §6:128 과 일치.
- 세포의 사람 쪽 읽기 = 재시작된 하니스가 **열린 session.log 를 읽기 전용**으로 본다. 이때 owner-auto 의 증분 오프셋(`watch-owner-playlog-auto.ts:30`~`42` `readOffset`, `absorbNewLog` `:111`~`135`)을 **공유·전진시키면 안 된다**. 브리프 B 의 "시드 임포터 readOffset 은 움직이지 않는다"가 이 지점이며 §3:94 의 `READ_OFFSET_BEFORE_AWAKE` 구멍 재발 금지와 일치. 세포 읽기는 자기 오프셋(0부터 읽고 밀지 않음)으로 독립해야 한다. 이 분리를 지키는 한 동시 읽기(detached adb child 가 append 중)는 읽기 전용이라 안전. **AGREE.**

---

## 5. 사람 `partial` 이 봇 점수를 이기지 못하는 것 — **AGREE (따름 효과 1개 기록)**

정본과 정확히 일치한다:
- §0-1:26~28 「최초 세포가 아직 없어도 그 행동은 봇이 이미 가진 세포로 계속한다. 세포 01이 없다고 매도를 빼지 않는다.」
- §5:120 「`partial` 세포는 가족 후보에는 두되 … 효율 1등으로 올리지 않는다. 목적 필드가 없는 후보는 순위를 바꾸지 않는다.」

브리프 A("partial 은 점수가 있는 봇 세포보다 위로 올리지 않는다")·Section 2 는 이를 그대로 구현한다. 점수 없는 사람 partial 이 점수 있는 봇 세포를 못 이기므로, 사람 매도 세포(01)가 없거나 partial 뿐이어도 봇은 자기 매도 세포로 매도를 계속한다. **「세포 01이 없어도 매도를 빼지 않는다」와 정합. AGREE.**

**반드시 기록할 따름 효과 — 지금 마커로는 사람 partial 이 아직 아무 선택도 못 바꾼다.**
- `verbOf` 는 depart/combat/land/travel 만 만든다(`memProfileToSessionTrace.ts:34`~`44`) → 사람 로그에서 나오는 세포는 전부 목적 필드(멈춤 개수·연료 쓰임) 없는 partial 이다(정본 §4:102~112). §5:120 대로 목적 없는 후보는 순위를 못 바꾼다.
- 따라서 **마커가 생기기 전까지 사람 플레이는 봇 선택을 갱신하지 못한다** — 루프의 "사람→봇 가르침" 절반은 §4:112 대로 앱 마커 승인 후로 유예된 상태다. 이는 §4 설계상 수용 범위이고, "매도를 빼지 않는다"(이기지 못함)와도 모순 없다. 다만 이것을 "사람 학습이 지금 동작한다"로 오독하지 않도록 구현 보고/핸드오프에 한 줄로 못 박아야 한다. (대표님 의도 = 실기 데이터 먼저 → 지금은 봇 자기세포 유지 + 사람 partial 후보 적재까지만, 효율 갱신은 목적 마커 이후.)

---

## 종합

| 질문 | 판정 | 핵심 근거 |
|---|---|---|
| 1 한 바퀴를 행동까지 닫는가 | **AGREE (조건)** | 적용 지점을 `run-harness.ts:129` 류 캠페인-경계 재로드(또는 in-memory 카드)로 명시해야 재시작 사이에 바퀴가 안 멈춤 |
| 2 전투/교역 평균 효율 | **PARTIAL** | 전투=`actions.ts:172`~`175` 변별 OK · 교역=`actions.ts:61`~`62`,`:509` 평탄상수라 장소 변별 불가 → 보류 또는 `itemBasePrice` 기반, 제3 공식 거절, 가중 되먹임 금지 |
| 3 퀘/격납고/초반 미포함 | **AGREE** | `intent.ts:26`~`30` · `actions.ts:582`~`583` 하드 게이트, 퀘 라우팅 `actions.ts:394`~`396` 보호 |
| 4 하니스만 재시작·owner-auto 생존 | **AGREE** | `watch-owner-playlog-auto.ts:341`·`:251` SIGTERM→closeSession, 하니스 stop `run-harness.ts:93`~`97` 미접촉, readOffset 분리 §3:94 |
| 5 partial<봇점수 | **AGREE (따름 효과)** | §0-1:26~28·§5:120 정합 · 단 `verbOf` `:34` 한계로 사람 partial 이 아직 선택 미갱신, §4:112 유예 명시 필요 |

**착수 전 메모리 판정(정본 §8:142~145 재확인)**: 벽시계 10분·열린 세션 읽기 전용·파일 1장 교체·오프셋 시드 분리 — 이 조건이면 PASS. 단 질문 1의 "카드 읽기 지점"과 질문 2의 "교역 점수 degenerate"를 반영본에서 해소하지 않으면 각각 REDESIGN/보류 사유다.

> 코드 반영은 김팀장이 한다. 김클로드는 이 답만 작성했고 `src/`·`app/`·`tables/`·`logs/`·`kim-claude-handoff-pending.md` 미수정, 프로세스 미중단.
