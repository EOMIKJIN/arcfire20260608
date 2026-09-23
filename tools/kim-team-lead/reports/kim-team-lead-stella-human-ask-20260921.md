# 스텔라 인간 사고 선제 질문 — 반영 검토

```text
status=REVIEWED
task_id=stella-aris-human-ask-s6-20260921
kind=DESIGN_REVIEW
정본=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md §16
date=2026-09-21
verdict=반영 가능 · S6 operator_life · inbound 타이머 재사용 불가
```

[pss-pre-dev] hot_path=문서 · 코드 미변경
[pss-pre-dev] alloc=0 cache=0
[pss-pre-dev] verdict=PASS

## 실측

- 언제: `arcCoreInboundTalkRequestPolicy` 45–90s / 8–15m `Math.random`
- 내용: `pickArcCoreInboundTalkWhyId` 우선순위 (랜덤 픽 아님). 빈 구간은 idle
- 입: roster는 operator 1차, `shouldHoldOriginMouth('inbound_request')` = 근원체

## 판정

인간 질문 선제 = **S6**. 기존 inbound에 얹으면 C5(적 입이 커피)·K7(시계 재무장).

동기 스택 (2026-09-21 보강): **일상 사고 → 동기 → 연료 → 질문 형태**.  
why 5종은 표현. 점화는 슬롯·drive·mood. 당직+개인공백이면 태그 있어도 침묵.

**END**
