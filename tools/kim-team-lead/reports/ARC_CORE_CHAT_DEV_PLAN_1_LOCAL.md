# ArcCore chat — 개발 잠금 (ZERO_BILL · 로컬 G3 · free-tier 재작업)

```text
status=ACTIVE
policy_id=arc-core-chat-dev-plan-zero-bill-20260908
date=2026-09-08
owner=김팀장
canonical=tools/kim-team-lead/reports/ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md
```

## 잠금

| 항목 | 값 |
|------|-----|
| 과금 모드 | **`zero_bill`** — 1인 테스트에서도 종량 **$0** |
| 인게임 회신 본선(현재) | 로컬 G3 (`CLOUD_LIVE=false`) |
| Bedrock LIVE/URL/배포 | **금지** |
| Free-tier NL | **READY** — Groq(1안) / Gemini / OpenRouter |
| 제공자 무료 한도 | **OK** · 초과 시 G3 · 유료 승격 금지 |

## 하는 일

- ZERO_BILL 감사·게이트 유지
- Free-tier 서버 턴 연동 (`READY_ARC_CORE_CHAT_FREE_TIER_NL.md`)
- $0 실기 확인 후 인게임 NL 품질

## 하지 않는 일

- Bedrock Invoke · Marketplace를 “소액이니까” 켜기
- 결제 수단 등록이 필요한 “무료 한도 상향”
- NCP 병행
