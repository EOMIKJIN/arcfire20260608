# 김플레이 → 김팀장 · 스텔라 O4 (=D3) · 봇 빈도 검증

status: **REVIEWED**
task: `stella-o4-bot-frequency-20261006`
선행: `kim-play-handoff-stella-o3-20261006.md` — REVIEWED
설계: `docs/playbot/STELLA_KNOWN_COLLEAGUE_DESIGN_v1.md` §C-8 · §C-4
리포트: `tools/play-bot-console/reports/stella-proactive/stella-o4-20261006.md` · 후보 CSV `tools/play-bot-console/out/stella-proactive/stella-o4-20261006-*-candidates.csv`

```text
[pss-pre-dev] hot_path=PC 재생 도구만(앱 미연결) · 게이트는 결정 순간 1회 순수 함수 alloc=결정당 상황 수만큼 소배열 cache=표 모듈 1회 파싱
[pss-pre-dev] stage=앱 화면·STAGE 변화 0 · 상태는 상황 수 × 최근 3회로 상한 risk=P6 없음(persist 미연결) · P1 없음
[pss-pre-dev] verdict=PASS
```

## 0. 한 줄

봇 600일 × 시드 4 재생. **지금 앱 그대로면 스텔라가 플레이일당 10.5번 먼저 말을 건다.** 허브 타이머 대화 요청(8~15분)이 「나야, 스텔라.」 1차 통신이기 때문이다. 타이머를 빼고 판단만 남기면 하루 1.9번 — 합격선 7개 중 4개 PASS, 2개는 근소 FAIL, 1개(침묵일)는 구조 문제.

## 1. 결과

| 지표 | 합격선 | A 지금 앱 | B 판단만 |
|---|---|---|---|
| 플레이일당 선제 | 0.5~3 | **10.52** FAIL | 1.94 PASS |
| ask 2회 이상인 날 | ≤10% | **100%** FAIL | **12.7%** FAIL |
| 한 상황 점유율 | ≤40% | — | 37.3% PASS |
| 연속 3일 같은 상황 | 0 | 0 | **4** FAIL (2,400 플레이일 중) |
| 침묵일 | 20~60% | **0%** FAIL | **0%** FAIL |
| 새 힘든 시기 포착 | ≥80% | **0%** FAIL | 86.3% PASS |
| 고장 방지 상한 | 0 | 0 | 0 |

A 내역: 타이머 대화 요청 10.51 · 관찰 선제 0 (15분 근원체 간격에 전부 막힘) · 일상 질문 0.01.
B 내역: 관찰 1.11 · 일상 질문 0.83.

## 2. 발견 — 「근원체 inbound」는 스텔라다 (설계·잠금과 이름 충돌)

`src/arcCore/chat/arcCoreInboundTalkRequest.ts` — 허브에 있으면 첫 45~90초, 이후 8~15분마다. `speakerId: 'operator'` · 본문 「나야, 스텔라.」 · 초상 operator · 이름 = 스텔라 아리스.
설계 §C-4·잠금 5 는 이것을 「근원체 inbound」로 부르고 15분 간격 양보 대상으로 두었다. 실제로는 **몸체가 없을 때의 타이머형 스텔라 말걸기** — 대표님이 폐지한 그 규칙이다.
§C-9 #37 이 상수 변경을 금지하므로 **손대지 않았다.** 결정 필요(§5).

## 3. 이번에 바꾼 것 (O3 위에)

| 파일 | 내용 |
|---|---|
| `src/arcCore/chat/stellaObserveGate.ts` | 판단 보강 3개 — **새 소식 자제 완화**(마지막 말 뒤 근거 행동이 새로 생기면 자제 최대치 ×0.5) · **무시 기억이 풀림**(반감기 72h) · **자주 한 말은 덜**(72h 안 같은 상황 꺼낸 횟수마다 ×0.4, 최근 3회만 기억). `noteStellaObserveIgnored(state, id, nowMs, policy)` 시그니처 변경 |
| `tables/content/stella_observe_gate_policy.csv` (Fable) | 4행 추가 → 27행: `newsRestraintScale 0.5` · `ignoreHalfLifeHours 72` · `repeatWindowHours 72` · `repeatDamp 0.4` (오늘 신규 키 — 기존값 아님) |
| `tables/content/stella_observe_situations.csv` (Fable) | `sit_quest_stall.anchorVerb` `quest`→빈칸. 막힘은 지금 상태가 이유; 최근 퀘스트 행동은 오히려 진행 신호. O3 값은 제 지시 실수 — 이 수정으로 0회 → 231회 |
| `src/arcCore/chat/stellaObserveSituations.test.ts` | 새 소식 · 무시 풀림 · 사흘 반복 · 상태형 행 앵커 없음 테스트. 정책 키 확인 추가. 전부 PASS |
| `tools/play-bot-console/src/stellaReplay.ts` (신규) | 재생기 — 사람 시계 세션, 결정 순간(세션 시작·착륙·전투 복귀), 앱 타이머 모델, 일상 질문, 반응 50%, 포착 측정 |
| `tools/play-bot-console/stella-verify.ts` (신규) | `npx tsx tools/play-bot-console/stella-verify.ts [days] [seeds] [runId]` → A/B 리포트 + 후보 CSV |
| `tools/play-bot-console/src/simulate.ts` | 하네스처럼 관찰 어휘(obs) 부착 |
| `tools/play-bot-console/play-bot-console.test.ts` | O3 import 테스트가 `recent`·`lifeAskLastAtMs` 사용, `fit` 범위 확인 |

**행은 아직 전부 `enabled=0`.** 앱 연결 0 — 화면 변화 없음.

## 4. 남은 FAIL 해석

- **침묵일 0%** — 일상 질문(§16)이 하루 1회 고정 규칙이라 매일 말한다. 관찰 선제만 보면 침묵일이 있음. 일상 질문도 판단으로 옮겨야 풀림 → 결정 필요.
- **ask 2회 이상 12.7%** — 대부분 일상 질문 + 관찰 ask 가 같은 날. 위와 같은 원인.
- **연속 3일 4건** — 모두 rough_day. 봇이 이틀에 하루꼴로 파괴 2회 이상 → 사흘째 더 심해도 참게 했지만 매우 심한 날은 넘음. 봇 사실성 한계로 보고 추가 조정 안 함 (repeatDamp 0.6/0.5/0.4 비교: 연속 21/8/4).
- **포착 정의 변경 (확인 대상)** — 「파괴 2회 이상 날 전부」가 아니라 「새 힘든 시기」(72h 안에 같은 걱정 안 꺼냄)만 합격선으로 셈. 매일 반복되는 날까지 매번 걱정하면 연속 3일 기준과 정면 충돌. 전체 힘든 날 포착은 18.4% (정보용).

## 5. 결정 필요 (대표님 · 김팀장)

1. **허브 타이머 대화 요청을 스텔라 판단에 합칠지** — 지금은 #37 잠금 상수. 합치면 A → B.
2. **일상 질문(§16 하루 1회)도 판단으로 옮길지** — 침묵일·ask 2회 FAIL 의 원인.
3. **포착 합격선 = 새 힘든 시기** 로 확정할지.

**대표님 결정 (2026-10-06)**: ① 합친다 — 타이머를 없애고 스텔라 판단으로 ② 일상 질문도 판단으로 ③ 포착 합격선 = 새 힘든 시기.
→ 잠금 5·§C-9 #37(타이머 상수 변경 금지)은 이 결정으로 해제 대상. 타이머 호출부는 `planet.tsx` 쪽이라 김플레이가 손대지 않음 — 김팀장 배정 필요. 김플레이 다음 작업: 일상 질문의 판단식 설계 + 재생기 B 를 결정안으로 재측정(침묵일 목표) 후 O5 연결안.

## 5-b. 결정 반영 — 일상 질문을 같은 판단으로 (재측정 `stella-o4b-20261006`)

| 파일 | 내용 |
|---|---|
| `src/arcCore/chat/stellaObserveGate.ts` | `stellaLifeAskHit(motiveId, askId, policy)` — 일상 질문을 관찰 상황과 같은 판단에 후보 하나(`life_<askId>`, ask, 앵커 없음)로 올림. 자제·무시·반복 감쇠 동일. `lifeCooldownHours` 24 (같은 질문 하루 안 재질문 없음). `isStellaLifeHit` |
| `src/arcCore/chat/stellaObserveSituations.ts` | 감지기 타입에 `life_ask` (표 행 아님 · 감지기는 늘 false · 표가 쓰면 index 가 버림) |
| `tables/content/stella_observe_gate_policy.csv` (Fable) | `lifeCooldownHours,24` → 28행 |
| 테스트 | 하루 1회 규칙 없이 물은 뒤 며칠 쉼 · 걱정과 겹치면 하나만 |
| `stellaReplay.ts` · `stella-verify.ts` | `life: daily|judge` · 시나리오 C(지금 켤 수 있는 행만) |

| 지표 | 합격선 | A 지금 앱 | B 결정안 (전 행) | C 결정안 (켤 수 있는 행만) |
|---|---|---|---|---|
| 플레이일당 선제 | 0.5~3 | 10.52 ✗ | 1.41 ✓ | 0.94 ✓ |
| ask 2회 이상인 날 | ≤10% | 100% ✗ | 3.7% ✓ | 2% ✓ |
| 한 상황 점유율 | ≤40% | — | 37.8% ✓ | 53% ✗ (quest_stall) |
| 연속 3일 | 0 | 0 | 5 ✗ (rough_day) | 1 ✗ |
| 침묵일 | 20~60% | 0% ✗ | 14.9% ✗ | 29% ✓ |
| 새 힘든 시기 포착 | ≥80% | 0% ✗ | 88% ✓ | — (rough_day 차단) |

일상 질문 0.29~0.32/플레이일 (사흘에 한 번꼴) — 봇에 기분·기억이 없어 늘 질문거리가 있다고 본 상한 가정.
남은 FAIL 은 봇 사실성: 봇 플레이일 98%(721/738)가 기함 2회 이상 파괴 날, 콘텐츠 끝 목표 정체(A-1). 판단식을 봇에 더 맞추지 않음. 실기 계측(O7)으로 재확인.

**잠금 5 해제에 따른 김팀장 배정 필요**: 허브 타이머 대화 요청(`arcCoreInboundTalkRequest` 스케줄 · `planet.tsx` 호출부)을 끄고, 그 자리를 O5 연결(결정 순간에 `decideStellaObserve` + `stellaLifeAskHit`)로 대체. 일상 질문 하루 1회 경로(`bindStellaLifeAskToPlanetSession` → `resolveStellaHumanAsk` 의 `lastAskDay`)도 O5 에서 이 판단으로 바뀜.

## 5-c. 대표님 지시 — 스텔라 하루 3~4회 (재측정 `stella-o4c-20261006`)

대표님: 「깨어 있는 일상 활동 8시간에 3시간당 1회 → 하루 3~4회」 · 기준 = **스텔라의 하루** (대표님 선택). 대표님이 접속하지 않은 동안에도 스텔라가 자기 쉬는 시간에 메신저로 연락하고, 접속하면 읽는다.

| 파일 | 내용 |
|---|---|
| `src/arcCore/chat/stellaLifeResolve.ts` | `stellaLifeSlotAt(nowMs, uid)` (기존 `resolveStellaLifeAt` 고르기 그대로 꺼냄) · `isStellaLifeFreeSlot` (근무 아님 + `rest` 아님 — 식사·저녁·밤 ≈ 8시간) |
| `src/arcCore/chat/stellaObserveGate.ts` | `stellaReachHit(motiveId)` — 메신저 연락 후보 (id `reach` 하나 · 상태 크기 고정). 내용이 그때그때 자기 하루라 반복 감쇠 제외. ctx `unread` · 정책 `unreadDamp` (안 읽은 연락마다 ×0.85) |
| `src/arcCore/chat/stellaObserveSituations.ts` | 감지기 타입 `reach_out` (표 행 아님) |
| `tables/content/stella_observe_gate_policy.csv` (Fable) | `unreadDamp,0.85` 추가 · `failsafeMaxPerDay` 6→8 (오늘 신규 키 — 목표 빈도가 올라 고장 방지 상한도 같이) → 29행 |
| 테스트 | 메신저 연락: 방금 보냈으면 참음 · 3시간 뒤 다시 · 안 읽은 게 쌓이면 그만 · 일과 칸 판정 |
| `stellaReplay.ts` | `reach` — 접속 사이 스텔라 일과 30분 칸마다 판단. 접속 시 읽음(읽은 것은 무시 아님, 답 50%). 지표 `request_stella_day` (달력 일 기준) 3~4 · 옛 합격선(플레이일 0.5~3 · 침묵일 20~60%)은 대표님 지시로 참고값 |

| 지표 | 합격선 | A 지금 앱 | B 결정안 (전 행) | C 켤 수 있는 행만 |
|---|---|---|---|---|
| 스텔라 하루당 대화 요청 (일상 질문 제외) | 3~4 | 8.66 ✗ | **3.57** ✓ | **3.07** ✓ |
| 그중 접속 안 한 동안 메신저 연락 | — | 0 | 약 2.4 | 약 2.4 |
| ask 2회 이상인 날 | ≤10% | 100% ✗ | 1% ✓ | 1% ✓ |
| 한 상황 점유율 | ≤40% | — | 38% ✓ | 51% ✗ (quest_stall · 봇 정체) |
| 연속 3일 | 0 | 0 | 5 ✗ (rough_day · 봇 파괴율) | 0 ✓ |
| 새 힘든 시기 포착 | ≥80% | 0% | 94% ✓ | — |
| 고장 방지 상한 도달 | 0 | 0 | 1 (약 2,900 달력일 중) | 0 |

**O5 연결 시 앱 쪽 할 일 (김팀장 배정)**: 메신저 연락은 백그라운드 없이 **접속 순간 소급** — 마지막 접속 이후 스텔라 쉬는 칸을 30분 간격으로 같은 판단에 돌려 메신저 큐에 남김 (안 읽은 수만큼 감쇠라 오래 비워도 몇 건으로 끝남). 문장은 그 칸의 스텔라 일과·일상 엔진. 큐는 대화 store 기존 메신저 경로 · 새 persist 필드는 안 읽은 수와 시각 정도.

## 6. 앱 후보 행 (B 재생 기준 · 차단 사유 없는 것)

first_ship · first_develop · level_mark · quest_stall · grind_loop · long_session · trade_run. first_ship/first_develop/long_session 은 표본 3~4회라 약함.
차단: rough_day·advice_ignored(잠금 4·G6) · advice_followed(O6) · risky_launch(봇 내구도 % 없음) · welcome_back(앱 session 방출 없음). first_annex 0회.
행 켜기는 §5 결정 후.

## 7. 게이트

- `npx tsx --test src/arcCore/chat/stellaObserveSituations.test.ts` PASS
- `npm run playbot:test` PASS
- `npx tsc --noEmit -p tsconfig.client.json` PASS
- `npm run audit:memory:all` PASS
- 커밋 안 함. `planet.tsx`·G6 파일 손대지 않음.

## verdict (김팀장)

- **REVIEWED (2026-10-07)** — O4 측정은 수용. 대표님 결정(타이머 제거 · 일상 질문도 판단 · 포착은 새 힘든 시기)을 앱에 반영했다. 커밋은 대표님 요청 후.
- 앱: 허브 8–15분 타이머는 더 이상 켜지 않는다. 허브 진입에서 판단 1회. 질문은 기존 연락 팝업, 물음이 약하면 메신저 보관. 접속 사이 쉬는 칸은 메신저에만 남기고, 메신저를 열면 읽은 것으로 친다.
- 말풍선(remark) 표면은 시안 전이라 만들지 않았다. 상황 13행은 `enabled=0` 유지. 켜면 말할 곳이 없는 말이 된다.
- 게이트: 판단·소급·대화 store 테스트 PASS · `tsc` PASS · `audit:memory:all` PASS (resident-set 리포트 잠김 1회 후 재실행 PASS).
