# READY — ArcCore chat Free-tier NL ($0 · Groq Free + Lambda)

```text
status=LIVE_PENDING_GROQ_KEY
task_id=arc-core-chat-free-tier-nl-20260908
date=2026-09-09
TurnUrl=https://2m3bcczmjq4u3bp334alda6j6a0drdpq.lambda-url.ap-northeast-2.on.aws/
FunctionName=arcfire-arc-core-chat-turn
client=CLOUD_LIVE=true · FREE_TIER_TURN_URL set
next=set-groq-lambda-key.ps1 후 앱 r 리로드 · 허브 아크코어 NL 테스트
```

## 0. 목표

인게임 아크코어 **자연어**(템플릿 아님) · **종량 $0** · 제공자 **무료 한도** OK.

## 1. 구현 상태

| 항목 | 상태 |
|------|------|
| `groqInvoke` · `llmInvoke` (기본 groq) | **코드 완료** |
| SAM `template.yaml` Bedrock IAM 제거 · GroqApiKey | **완료** |
| 클라 `VENDOR=free_tier` | **완료** |
| `CLOUD_LIVE` + Function URL | **배포 후** (대표님 키·sam deploy) |
| 실기 $0 · NL 확인 | **대기** |

## 2. 벤더

**1안 Groq Free** · 모델 `llama-3.1-8b-instant` · 카드 미등록.

## 3. DoD

- [x] 클라에 벤더 키 없음
- [x] Bedrock Invoke IAM/기본 경로 차단 (`ALLOW_BEDROCK=0`)
- [ ] sam deploy + TurnUrl → LIVE=true
- [ ] 1인 NL 실기 · 결제 $0.00
- [ ] 한도 초과 시 G3 폴백
- [ ] 대표님 승인 후 커밋

교차: `ARC_CORE_CHAT_GROQ_FREE_LAMBDA_OPS.md`
