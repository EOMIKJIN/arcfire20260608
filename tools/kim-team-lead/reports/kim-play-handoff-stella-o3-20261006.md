# 김플레이 → 김팀장 · 스텔라 O3 · 관찰 상황 감지기 + 게이트

status: **REVIEWED**
task: `stella-o3-situations-gate-20261006`
선행: `kim-play-handoff-stella-o1o2-20261006.md` — REVIEWED (0단계·O1·O2·잠금 2·D1)
설계: `docs/playbot/STELLA_KNOWN_COLLEAGUE_DESIGN_v1.md` §C-3·§C-4·§D-5 · 잠금 §1-A

## 0. 재작업 (HOLD 이후 · 대표님 지시 2건)

대표님: ① 「하루 질문 1·연락 1·말걸기 3 은 몸체가 없을 때의 규칙. 이제 스텔라가 판단한다. 성능 부족분만 기술 조정」 ② 「얼마나 심한지 외에 **말을 걸 상황인지**를 판단하는 게 중요하다. 능동형이 대전제」.

| 항목 | 내용 |
|---|---|
| 판단식 | **말하고 싶은 마음 × 지금이 말할 때인가** ≥ 0.4 → 말함. ask 행은 0.7 이상일 때만 물음 |
| 마음 | 동기 무게 × 심한 정도 **(1 + 0.25×(intensity−1))** × 자제(반감기 90분, 일상 질문 포함) × 무시 감쇠 × 당직·casualFirst |
| 지금이 때인가 (신규) | `stellaObserveMomentFit` — 상황 표 `anchorVerb` 의 행동이 10분 안이면 1, 반감기 30분, 최저 0.3 · 기록에 없으면 0.3 · 5분 안 행동 6개 이상이면 걱정 외 ×0.5 · 열이 비면(함선 상태·장시간) 늘 1 |
| 침묵 사유 | `restraint`(마음 부족) / `not_now`(마음은 있는데 때가 아님) 분리 — O4 에서 따로 셈 |
| 컨텍스트 | `recent` 추가 (최신순, 결정 순간에 `forEachRecentPlayerObserve` 로 채움) · `lifeAskUsedToday` → `lifeAskLastAtMs` |
| 표 (Fable) | 게이트 정책 23행 (타이밍 6행 추가) · 상황 표 맨 끝 열 `anchorVerb` |

**HOLD 지적 2건**
1. 봇 테스트 `lifeAskUsedToday`·`recent` — **수정.** 봇 링에서 `recent` 를 채워 넘김, speak 면 `fit` 범위 확인.
2. 공감 0.45 × 0.8 < 0.4 — **AGREE, 식을 고침.** 감지 문턱에 막 닿은 상황은 동기 무게 그대로(×1)에서 시작하고 심할수록 최대 1.25배. 「표의 모든 행은 감지 문턱에서 때가 맞으면 말할 수 있다」 테스트로 죽은 행 재발 방지.

**잠금 7 개정 확인 부탁**: 「선 질문 하루 1회 공유」는 대표님 지시로 폐지 — 설계 §1-A 표·§C-4 에 표기. 다른 팝업 침묵·무시 1회는 유지.

## 1. 무엇을 했나

스텔라가 「먼저 말할 상황인가」와 「지금 말해도 되는가」를 판정하는 **순수 모듈 2개 + 표 2개**. 앱 어디에도 아직 연결하지 않았다 — 화면 변화 0. 연결(O5 채널)은 목업·오버레이 감사 후.

| 파일 | 담당 | 내용 |
|---|---|---|
| `tables/content/stella_observe_situations.csv` (신규) | Fable | 13행 · **전 행 `enabled=0`** (잠금 1·4 · O4 합격 행만 후보) |
| `tables/content/stella_observe_gate_policy.csv` (신규) | Fable | 하루 횟수 예산 없음 (대표님 2026-10-06). 마음×시점 · 자제 반감기 90분 · 근원체 간격 15분 · 고장 방지 상한 6 |
| `tools/content-tables/build-arc-core-chat-tables.mjs` | Fable | `writeOut` 2줄 추가 |
| `src/data/generated/csvStellaObserve*.ts` (신규) | 빌드 산출 | `npm run build:arc-core-chat-tables` |
| `src/arcCore/chat/stellaObserveSituations.ts` (신규) | 김플레이 | 감지기 11종 · `detectStellaSituations` · `renderStellaObserveLine` |
| `src/arcCore/chat/stellaObserveGate.ts` (신규) | 김플레이 | `decideStellaObserve` (상태 불변) · `noteStellaObserveShown/Ignored/Accepted` · `nextOriginInboundWindowMs` · `stellaYieldsToOrigin` |
| `src/arcCore/chat/stellaObserveTableIndex.ts` (신규) | 김플레이 | 생성 표 모듈 1회 파싱 · priority 정렬 · 모르는 감지기 행 버림 |
| `src/arcCore/chat/stellaObserveSituations.test.ts` (신규) | 김플레이 | 25건 (판단식·때·죽은 행 없음 포함) |
| `tools/play-bot-console/play-bot-console.test.ts` | 김플레이 | 「O3 … 봇이 그대로 import」 1건 |

## 2. 잠금 반영

| 잠금 | 반영 |
|---|---|
| 1 `repair_due`/함체 | `sit_risky_launch` 문장에 소멸·해제 없음 (테스트 고정) · enabled=0 |
| 4 파괴 방출 전 | `sit_rough_day`·`sit_advice_ignored_hurt` enabled=0. advice 입력은 O6 전 항상 false |
| 5 근원체 | 근원체와 15분 공동 간격 · `nextOriginInboundWindowMs` = 예정 슬롯을 **취소 없이** 다음 창으로 (지연 상수 무변경) · 같은 순간이면 걱정·귀환 인사만 먼저, 나머지 양보 · 문장에 적·전황·숫자 금지 테스트 · `quest_stall` 은 목표 이름 없는 문장 |
| 6 체류 중 판정 없음 | 감지기는 결정 순간 입력만 받음 — 시계·타이머 없음 |
| 7 하루 1회 | **대표님 지시로 제거.** 일상 질문은 횟수 예산이 아니라 `lifeAskLastAtMs` 자제에만 들어감. 다른 팝업이면 침묵. 무시·수락은 마음 감쇠 |
| 8 표면 | 이번 단계에 표면 없음 |

추가로 근거 없는 말 방지(F28): 레벨 축하는 **오늘 레벨업이 관찰됐을 때만**. 접속만 한 레벨 12 계정에 「또 올라섰다며」라고 하지 않음.

## 3. 결정한 것 (검수 확인 부탁)

1. ~~직전 선제와 같은 상황은 다음 날이라도 침묵~~ → 김팀장 수정으로 폐지. 지금은 「한 말은 기억 — cooldownHours 동안 더 나빠졌을 때만 다시」.
2. 첫 업적은 한 행이 아니라 3행(`sit_first_ship/annex/develop`) — 비트별 문장이 달라서. 감지기는 같은 `first_bit`.
3. 새벽 판정 = 현지 `paramB`(2)시~6시 **그리고** 세션 `paramA/2` 분 이상 — 새벽에 막 접속한 사람에게 「오래 했다」 금지.
4. 숫자는 5 이하만 말로(두 번째로·이틀), 넘으면 「또」·「며칠」.

## 4. self-check

```text
[pss-pre-dev] hot_path=결정 순간(허브 진입·복귀)만 · 이번 단계는 앱에서 호출 0 · 타이머 0
[pss-pre-dev] alloc=판정 1회당 후보 ≤13 · recent ≤16개 배열 1개(결정 순간만) · 표는 모듈 1회 파싱 · 게이트 상태는 상황 수만큼만 자람(≤13 키)
[pss-pre-dev] risk=없음(앱 미연결 · STAGE·persist 무관) · verdict=PASS
```

- `npx tsx --test src/arcCore/chat/stellaObserveSituations.test.ts` **25/25** PASS (재작업 후)
- `npm run playbot:test` PASS (D1 2건 + O3 import 1건 포함)
- `npx tsc --noEmit -p tsconfig.client.json` PASS
- `npm run audit:memory:all` PASS

## 5. 대표님 확인 대기 (설계 §11-3 — 화면에 안 나오므로 착수는 했음)

하루 선 질문·선 연락·말걸기 횟수 상한은 대표님 지시로 뺐다. 남은 값은 마음 문턱·자제·고장 방지 상한이며 `stella_observe_gate_policy.csv`에 있다. 대표님 자신의 연속 파괴는 스텔라가 먼저 걱정한다.

## 6. 손대지 않은 것

`app/(game)/planet.tsx` · 기존 CSV · G6 파일 · 근원체 inbound 지연 상수 · 생성 TS 직접 수정.
작업 트리에 보이는 다른 생성 파일 변경(`csvItemDefs`·`csvNpcCapitalShips`·`csvWeapons`·`csvStoryScenes`)은 이번 작업 전부터 있던 타인 변경 — 묶지 말 것.

## 7. 다음

O4(=D3) 봇 빈도 재생 — 저널 `obs` → 앱 sink → 이 감지기·게이트를 그대로 돌려 §C-8 합격선 측정 · 행별 `enabled` 후보 수출 → D2 `botVersion`.

## verdict (김팀장 기입)

- **REVIEWED (2026-10-06)** — O3 수용. 하루 횟수 상한은 대표님 지시대로 없다. 판단은 마음 × 지금이 말할 때인가. 커밋은 대표님 요청 후.
- 재검수에서 확인: 공감 무게는 감지 문턱에서 ×1로 시작한다. 봇 테스트는 `lifeAskLastAtMs`와 최신순 `recent`를 넘긴다. `sit_rough_day`는 오늘 파괴 횟수만 본다.
- 잔여: 앱 미연결 · 전 행 `enabled=0` · 게이트 상태 미저장 · 근원체 창 밀기 함수는 스케줄러에 아직 안 붙음. 행을 켜는 것은 O4 측정 다음.
