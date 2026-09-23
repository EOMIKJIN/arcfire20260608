# HOLD — 종량(Bedrock) 경로 · ZERO_BILL 개정

```text
status=HOLD_METERED_ONLY
task_id=arc-core-chat-ingame-nl-hold-20260908
date=2026-09-08
updated=2026-09-08
owner=김팀장
trigger=대표님 — 1인 테스트에서도 $1 종량 부가 금지 · 제공자 무료 한도는 OK
canonical_policy=tools/kim-team-lead/reports/ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md
```

## 결정 (개정)

| 축 | 상태 |
|----|------|
| **종량제 NL** (Bedrock Invoke · Vertex 유료 · 결제 붙은 클라우드) | **HOLD / 금지** — 대표님이 “종량 허용”을 **명시**하기 전 |
| **무료 티어 NL** (Gemini/Groq/OpenRouter free · $0 · 쿼터 한도) | **재작업 ACTIVE** — `READY_ARC_CORE_CHAT_FREE_TIER_NL.md` |
| **로컬 G3** | 본선 유지 · $0 |
| NCP B안 | 금지 유지 |

> 예전 「인게임 NL 전면 HOLD」는 **폐기**.  
> 전면 홀딩이 아니라 **요금이 붙는 경로만** 홀딩한다.

## 여전히 금지

| 항목 | 이유 |
|------|------|
| `CLOUD_LIVE=true` + Bedrock Function URL | 1회 호출부터 종량 가능 |
| Bedrock Playground로 “테스트” | 콘솔도 청구 가능 → ZERO_BILL 위반 위험 |
| 무료 계정에 **카드/Billing 연결 후** 자동 유료 전환 | $1이라도 FAIL |
| 클라에 API 키 | 계약 위반 |

## 지금 게이트 값 (유지)

| 항목 | 값 |
|------|-----|
| `ARC_CORE_CHAT_CLOUD_LIVE` | `false` |
| `ARC_CORE_CHAT_AWS_TURN_URL` | `''` |
| `ARC_CORE_CHAT_BILLING_MODE` | `zero_bill` |
| 감사 | `npm run audit:arc-core-chat-billing` PASS |

## 재개 (종량 Bedrock만)

대표님 **「종량 요금 허용」** 명시 후에만 `READY_ARC_CORE_CHAT_BEDROCK_GOLIVE.md` 진행.

Free-tier는 위 READY로 **별도 진행**(종량 허용 불필요 · $0 청구 확인 필수).
