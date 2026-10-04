# 김클로드 재검수 — 학습 프로세스 6단계 협의 답

```text
task_id=playbot-learn-cycle-20261004
kind=CONSULT (코드 변경 0 · 커밋 금지)
답변자=김클로드 · 2026-10-04 KST
대상 브리프=kim-team-lead-playbot-learn-cycle-brief-20261004.md
선행 결론=playbot-human-learn-consult-conclusion-20261004.md (덮어쓰지 않음)
재검수 범위=인용 파일 직접 재독 후 판정. src/·app/·tables/·kim-claude-handoff-pending.md 미수정.
```

브리프를 그대로 받지 않고 인용 코드를 직접 읽었다. 아래는 근거(파일:줄)와 함께 쓴 AGREE / PARTIAL / DISAGREE.

---

## 재검증한 현황 사실 (브리프 §2)

| 브리프 주장 | 코드 확인 | 판정 |
|---|---|---|
| 15초 폴링 | `ownerPlaylogAuto.ts:3` `AUTO_POLL_MS=15_000` | 맞음 |
| 세션 닫힘 = 유휴20분·앱pid·날짜·3시간·기기끊김 | `ownerPlaylogAuto.ts:40-53` `shouldRotateAutoSession` (device_gone/app_pid/day/max_span 3h/idle 20m) | 맞음 |
| 사람 인정 = Awake에서 이동 4마커 ≥3 | `ownerPlaylogAuto.ts:14` `USER_ACTION_RE`(route_focus\|transit_hop_start\|system_change\|planet_change) · `:8` `AUTO_MIN_USER_ACTIONS=3` · 계측은 `watch-owner-playlog-auto.ts:111-131` `absorbNewLog`가 `awake`일 때만 `userActions` 증가 | 맞음 |
| 학습 가중 = 미소비 델타 있을 때만, 새 동사쌍 +0.02, 승패·레벨·퀘 범프 없음 | `policy.ts:278-291`(델타 없으면 `새 실기 없음·학습대기` skip) · `:304-314`(delta.newPairs만 `bump 0.02`) · 승패/레벨/퀘 범프 코드 없음 | 맞음 |
| 승리 도색이 RED·BLUE 모두 중립화 | `actions.ts:200-204` `if (p==='RED'\|\|p==='BLUE'){ occupierClanId=NEUTRAL_CLAN; kind='neutral'; }` | 맞음 |
| `analyzeDay`가 본편 P0–P5·story_022·의뢰33·독립국1과 대조 안 함 | `analyze.ts:12-157` — INSOLVENCY/VAULT_THIN/HOLD/BORDER/QUEST_* 등 당일 위험만. 부모소진·독립국·레벨52 게이트 비교 없음 | 맞음 |
| 하니스가 가상일마다 `adaptPolicy` 호출(학습대기여도 스킵만) | `run-harness.ts:187-199` onDay에서 매일 `adaptPolicy` → skipped면 `성장… 학습대기` 로그만 | 맞음 |

설계 정본도 대조했다. `docs/엔드콘텐츠_개발계획.md:223,285`(라이브 55부모=22+33) · `:374,501,344`(입장 레벨 52–60) · `:65,240,336`(독립국≥1) · `:245`(blue≥red 소프트 관측) · `:319`(`questCleared=96`을 만렙 게이트로 쓰지 말 것). 브리프 §2-2의 설계 대조 전제는 정본과 일치한다.

---

## 1. 6단계가 대표님 의도와 맞는가 — **AGREE**

여섯 단계(원시→행동기반→설계·인간형 실행→총괄분석→봇/게임 자체분류→보고·반영→1로) 분해는 잠긴 의도와 어긋나지 않는다. 메모리 `project_playbot_human_data_first`(사람 원시→봇 학습→인간형 자가플레이)와 선행 결론(`playbot-human-learn-consult-conclusion-20261004.md:13`: "새 실기 원시를 분석했을 때만 다시 열고, 목표에 필요한 기능이 없으면 그 기능을 넣어 같은 목표를 다시 돈다")의 재진술이다.

한 가지만 명시해 둔다. 지금 2단계의 「행동 기반」은 **동사쌍 가중 블렌드뿐**이다(`humanDelta.ts:108-128` 동사쌍 추출 · `policy.ts:306-314` +0.02). 전투 방식·시간 배분·레벨밴드 전략은 기반에 없다. 그래서 6단계 루프 자체는 맞되, 3단계 「전체 플레이 설계」가 현재는 `stepAction`/`earlyFeel`의 고정 분기(`actions.ts:573-608`)이고 레벨밴드·웨이브·엔드보스가 설계에 없는 상태라는 점은 분석(4단계) 입력에 반드시 적어야 한다. 루프 구조 AGREE, 단 "설계 공백"을 gap으로 상시 노출하는 조건.

## 2. A의 벽시계 10분·서명 교체·무재시작이 PSS와 맞는가 — **AGREE**

가상일은 `run-harness.ts:171-173`에서 live일 때 entry마다 `Atomics.wait(liveMs)`로만 느려지고 비-live는 더 빠르다. onDay가 분당 수십 일을 찍는 환경에서 **가상일마다 디스크 기록은 I/O 폭주**다. 서명 변화 또는 벽시계 10분에만 `learn-cycle-latest.json` 한 파일 교체·이력 배열 없음은 올바른 선택이고, 기존 `learnedIo`의 디바운스 기록 철학과 같은 방향이다.

무재시작도 맞다. 재시작하면 캠페인이 `seedWorld`로 월드를 **L1로 다시 깐다**(새 코드 로드의 대가로 고레벨 인메모리 월드 소멸). 학습 상태(`logs/learned`)만 별도 영속이므로, 첫 보고는 상태 JSON 1회 읽기로 만들고 하니스 재시작을 이번에 하지 않는 판단이 맞다.

조건 2개: (1) 벽시계 10분은 **실시각**으로 재야 한다(가상일 환산 아님). (2) learn-cycle 기록은 원자적 쓰기로, `scheduleLearnedWrite`의 policy 디바운스와 **별 키**로 분리해 서로 플러시를 밀어내지 않게 할 것. 이 2개만 지키면 PSS 적합.

## 3. B를 이번 bot_function으로 넣는 것이 맞는가 — **AGREE**

`actions.ts:200-204`에서 승리 시 BLUE까지 중립화하는 것은 설계 위반이 맞다. BLUE는 플레이어 진영이다(`play-bot-console.test.ts:97` arcadia_prime=`BLUE_CLAN` clan_hold). 아군 블루를 스스로 지우면 (a) 편입 접선 기반이 사라지고(`actions.ts:302` `doAnnexPath`가 contested BLUE를 치면 승리 시 아군 영토가 날아감), (b) 소프트 관측 `blue≥red`(`docs:245`)가 봇 스스로 무너진다. 수정 = RED 승리만 중립화, BLUE는 유지. 모든 전투 경로가 `fightHere`로 수렴하므로(`:470 퀘스트`·`:546 수도`·`:596-599 유랑`) 한 조건만 고치면 균일하게 교정된다.

더 작은 수정은 없다. 제안된 한 줄 조건(`p==='RED'`만 남김)이 이미 최소다. 브리프 B의 "P4 전 편입 강제·레벨60 농장 금지"도 엔드 배드케이스(`docs:308,336,344`)와 일치하므로 함께 AGREE — 이번 사이클에 가중을 편입/개척 쪽으로 밀지 않는다.

## 4. C 보고-only가 6번 「게임 기능도 반영」과 충돌하는가 — **PARTIAL**

**프로세스 충돌은 없다.** 6번의 "게임 기능 반영"은 **대표님 지시 후**의 작업이다. 브리프 §2-2(라인 45) "게임 기능 자동 수정은 이번 착수에서 하지 않는다 … 반영 코드는 트윈(Node)만"과 CLAUDE.md의 commit·완료 금지·사인오프 규칙이 그대로 적용된다. 따라서 이번 사이클에서 game_function을 보고로만 남기는 것은 잠긴 범위와 일치한다. 이번 착수에 허용되는 게임 쪽 최소 변경은 **없다** — 앱 틱·CSV·세이브를 빼면 안전하게 넣을 게임 코드가 없다. 억지로 하나를 꼽지 않는 것이 맞다.

**정정 1개(그래서 PARTIAL).** C의 네 항목 중 `readOffset` 구멍은 **게임 기능이 아니라 수집기(트윈) 결함**이다. `watch-owner-playlog-auto.ts:119-127` `absorbNewLog`는 `active.readOffset = size`를 **awake 검사(`if (!awake) return`)보다 먼저** 올린다. 폴링 시점에 화면이 꺼져 있으면 그 15초 증분(그 사이 켜져 있던 조작 포함)이 소비·폐기된다. 이건 `src/`·`app/`·`tables/`가 아닌 트윈 파일이라 **이번 허용 범위 안에서 bot_function으로 고칠 수 있는 것**이다. 다만 선행 결론(`playbot-human-learn-consult-conclusion-20261004.md:36`)이 이 구멍을 "이번 착수 범위에 넣지 않는다"로 이미 보류했다. 그러니 둘 중 하나로 정리하자: 선행 결론대로 **명시 보류**로 두되 game_function 더미에 섞지 말 것. game_function(전투방식 마커·웨이브9·중요 플레이 마커 4종뿐)과 **분류 축이 다르다**(이 셋은 앱/CSV가 있어야 생기는 진짜 게임 기능). readOffset을 같은 칸에 넣으면 "게임 사인오프 대기"로 잘못 묶여 트윈에서 고칠 수 있는 결함이 영구 지연된다.

## 5. 완료 선언은 여전히 금지인가 — **AGREE (강하게)**

금지다. 인간 세션의 전투방식은 구조적으로 **0**이다: 수집기 마커는 이동 4종뿐(`ownerPlaylogAuto.ts:14`)이고, 전투방식 판정은 `range|weapon|approach` 토큰을 봐야 하는데(`humanDelta.ts:30` `COMBAT_METHOD_RE`) 그 토큰을 남기는 경로가 수집에 없다 → `combatMethod`는 항상 `absent`. 독립국도 인간 원시에 마커가 없고 브리프 런(`pb-…mixed_ref`)도 개척 0. 선행 결론(`:27-28` "방식 필드가 실기에 생기기 전에는 완료를 말하지 않는다 · 인간 0건이면 인간 수준 선언 금지")과 CLAUDE.md(완료 선언 금지)에 그대로 묶인다. 레벨 60·퀘 96(`docs:319` 만렙 게이트 아님)은 완료 근거가 못 된다.

---

## 요약 판정

| 질문 | 판정 | 핵심 근거 |
|---|---|---|
| 1. 6단계 분해 | AGREE | 메모리·선행결론·`docs §5`와 일치. 단 3단계 설계공백을 gap으로 상시 노출 |
| 2. A의 PSS 적합 | AGREE | 가상일 기록 폭주 회피 타당 · 재시작=월드 L1 리셋(`seedWorld`). 조건: 실시각 10분·기록 키 분리 |
| 3. B bot_function | AGREE | `actions.ts:200-204` BLUE 자가중립화 설계위반. RED만 중립화가 최소수정 |
| 4. C 보고-only | PARTIAL | 충돌 없음·게임 최소변경 없음 — 단 `readOffset`은 게임 아닌 트윈 결함, 분류 재배치 필요 |
| 5. 완료 금지 | AGREE | 인간 전투방식 구조적 0 · 독립국 0. 레벨·퀘 수는 관문 아님 |

리스크/보류: readOffset 분류 외에, learn-cycle 기록 키가 policy 디바운스와 충돌하지 않는지 구현 시 확인. 실제 착수·커밋은 김팀장 검수 후. 본 답변은 코드 변경 0.
