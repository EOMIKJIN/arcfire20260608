# 스텔라 아리스 인앱 LLM 대화 고도화 — 김팀장 판정

```text
status=REVIEWED
task_id=stella-aris-operator-shop-guide-ethical-design-20260913
source=tools/kim-team-lead/reports/STELLA_ARIS_OPERATOR_SHOP_GUIDE_ETHICAL_DESIGN_20260913.md
verdict=PARTIAL
reviewed_at=2026-09-13
reviewed_by=김팀장
```

[pss-pre-dev] hot_path=대화 전송 1회 팩 조립 · 틱/부트 없음
[pss-pre-dev] alloc=CSV 인덱스 1회 Map · persist 신규 키 없음 · 팩 문자열 +3
[pss-pre-dev] verdict=PASS

## 결론

**윤리 전제(§0)는 잠금으로 채택한다.** 가짜 친밀감 → 결제 유도는 게임 안에서도 쓰지 않는다.

**지금 적용하는 것은 캐릭터 깊이(§7-2)뿐이다.** 상점 안내 GM과 친밀도 단계 기계는 넣지 않는다.

## 절별 판정

| 절 | 판정 | 이유 |
|---|---|---|
| §0 로맨스 스캠 배제 | **AGREE · 잠금** | 결제·취약성·죄책감 연출은 대화 축에서 계속 금지 |
| §7-2 persona 3행 | **APPLY** | 09-09 §5-1과 동일 원칙. 기존 8행 문구 미변경. persist/틱 없음 |
| §7-4 memory tags | **ALREADY** | `getArcCoreChatRollingSummary()`가 입과 무관하게 팩에 들어감. 연결 작업 없음 |
| §2–5 shop GM | **HOLD** | `op_persona_forbid`가 크레딧·언락을 거절. 세션/일 쿨다운 persist 신규. 화물·연료 실패 카운트 관측이 대화 GM에 없음. 일상 입에 BM 퍼널을 지금 얹지 않음 |
| §7-3 친밀도 4단계 | **HOLD** | 신규 persist + purge 연동. 이중 입은 안내원이지 공략 루트가 아님. 관점 3행이 깊이를 담당 |
| §7-1/§7-5 미연시 regex 검역 | **HOLD** | 한국어 클리셰 regex는 깨지기 쉬움. humor/boundary 행이 1차 잠금 |

## 적용 내용

- `tables/content/arc_core_chat_operator_persona.csv` — `op_persona_perspective` / `humor` / `boundary` 신규 3행
- `arcCoreAgentPack.ts` — persona pack 상한 8 → 12 (새 3행이 잘리지 않게)
- `aws/arc-core-chat/src/pack.ts` · `functions/src/arcCoreChatTurn.ts` — 수신 상한 8 → 12 (LIVE가 9~11행을 버리지 않게)
- `build:arc-core-chat-tables` 재생성
- 기존 8행·토픽·지식·GM when 집합은 그대로

LIVE Lambda는 **재배포 전**에는 서버가 여전히 8행만 받을 수 있다. 클라 팩은 11행을 실어 보낸다.

## 다음에 해도 되는 조건 (지금 아님)

상점 GM은 아래가 모두 갖춰진 뒤에만 재검토한다.

1. 화물 만적·연료 반복 실패·실제 이벤트 **이미 있는 관측값**만 쓸 수 있을 것
2. 세션 1회·같은 상황 1일 쿨다운을 **기존 persist 키에 붙이지 않고** 대화 세션 스칼라로만 닫을 수 있을 것
3. 대사에 「안 사도 돼」 고정 · 거절 시 톤/빈도 페널티 없음
4. 대표님 재지시

친밀도 FSM은 대화 횟수 카운터가 계정 purge에 이미 묶여 있고, 결제 필드를 코드에서 참조하지 않음을 테스트로 고정할 수 있을 때만.

**END**
