# ArcCore chat — ZERO_BILL 설계 재검토 (2026-09-08)

```text
status=ACTIVE
policy_id=arc-core-chat-zero-bill-20260908
date=2026-09-08
owner=김팀장
trigger=대표님 — 1인 테스트에서도 1달러라도 종량 요금 부가 금지 · 제공자 무료 한도는 OK
```

## 0. 대표님 의도 (정본)

| # | 의도 | 설계 반영 |
|---|------|-----------|
| 1 | **요금제 부가 없이** NL을 쓴다 | 종량제 벤더(Bedrock Invoke·Vertex 유료 등) **앱·서버 경로 금지** |
| 2 | 서비스측 **용량/쿼터 제한**이 있으면 그 한도까지 써도 된다 | Gemini / Groq / OpenRouter **무료 티어**만 후보 |
| 3 | **1인 테스트**에서도 NL만 붙였다고 **$1이라도** 나오면 안 된다 | LIVE·URL·배포·Playground 종량 호출을 **감사로 차단** |

> **이전 오해 수정**: 「Bedrock 소액(수십 원)이면 1인 테스트 OK」는 **폐기**.  
> 소액이라도 **종량 청구가 생기면 FAIL**.

## 1. 재검토 결론

| 경로 | 판정 | 이유 |
|------|------|------|
| AWS Bedrock (Haiku Marketplace·Invoke·앱 LIVE) | **금지 (ZERO_BILL)** | 호출 1회부터 종량 청구 가능 |
| Bedrock **Playground 콘솔** 수동 대화 | **테스트 금지 권고** | 콘솔도 계정 종량에 잡힐 수 있음 |
| Firebase/Vertex 유료·과금 프로젝트 | **금지** | 동일 |
| Gemini / Groq / OpenRouter **무료 티어** | **허용 후보** | $0 한도 내 · 한도 초과 시 거절(폴백 G3)이지 과금 전환 없어야 함 |
| 온디바이스 LLM | **보류** | $0이나 STAGE/PSS 예산과 충돌 |
| 로컬 G3 템플릿 | **본선 유지** | 항상 $0 · NL 품질 제한 |

## 2. 목표 아키텍처 (재작업)

```text
앱 (CLOUD_LIVE + TURN_URL)
  → 서버 턴 (Firebase JWT만)
  → billingMode=zero_bill
       ├─ vendor=free_tier → Gemini|Groq|OpenRouter (무료 키·무료 엔드포인트만)
       │     한도 초과/오류 → 로컬 G3
       └─ vendor=aws(Bedrock) → **호출 금지** (감사 FAIL · 런타임 거부)
```

- 클라에 벤더 SDK/키 **금지** (기존 계약 유지).
- 무료 티어 키는 **서버 환경변수만**.
- **유료 플랜·크레딧 충전·Billing account 연결으로 “무료→유료 자동 전환”** 되는 설정은 운영에서 금지.

## 3. 개발 상태 재분류

| 트랙 | status | 내용 |
|------|--------|------|
| **A. ZERO_BILL 정책·감사** | **ACTIVE** | 본 문서 · `audit:arc-core-chat-billing` · 게이트 상수 |
| **B. Bedrock G5 LIVE** | **HOLD / 금지** | `READY_ARC_CORE_CHAT_BEDROCK_GOLIVE.md` — 종량 허용 명시 전 **영구 보류** |
| **C. Free-tier NL 연동** | **READY** | `READY_ARC_CORE_CHAT_FREE_TIER_NL.md` — 서버 1홉 + 무료 벤더 1개 |
| **D. 인게임 NL 품질 고도화** | HOLD→**C 통과 후** | C가 $0 실기 확인된 뒤 |

이전 `ARC_CORE_CHAT_INGAME_NL_HOLD.md`는 **「전면 NL HOLD」→「종량(Bedrock) HOLD + free-tier 재작업」**으로 개정.

## 4. 완료 게이트 (ZERO_BILL)

| 게이트 | 기준 |
|--------|------|
| 정적 | `npm run audit:arc-core-chat-billing` **PASS** |
| 런타임 | `CLOUD_LIVE=false` 이거나, LIVE여도 **free_tier 벤더만** · Bedrock Invoke **0회** |
| 청구 | AWS Cost Explorer / 결제에 ArcCore chat 관련 **$0.00** (Playground 포함 권고) |
| 폴백 | 무료 한도 초과 → 로컬 G3 · **유료로 자동 승격 금지** |

## 5. 교차

- HOLD 개정: `ARC_CORE_CHAT_INGAME_NL_HOLD.md`
- Free-tier READY: `READY_ARC_CORE_CHAT_FREE_TIER_NL.md`
- Bedrock READY: `READY_ARC_CORE_CHAT_BEDROCK_GOLIVE.md` (status=`FORBIDDEN_UNTIL_PAID_OK`)
- 정본 스펙: `docs/대화형_아크코어_구현.md` §12-A
- 게이트: `src/arcCore/chat/arcCoreChatCloudGate.ts`
