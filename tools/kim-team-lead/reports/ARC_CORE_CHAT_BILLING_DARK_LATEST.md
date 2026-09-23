# ArcCore chat — ZERO_BILL billing audit

verdict=`PASS`
checkedAt=2026-09-09T17:57:09.446Z
goliveAck=0
meteredAck=0

## Policy
- ZERO_BILL: 종량 $1 부가 금지
- free_tier LIVE + Groq Lambda URL = 허용
- Bedrock/Vertex LIVE = METERED_ACK 없이 금지

## Notes
- OK BILLING_MODE=zero_bill
- OK metered LIVE block helper
- OK AWS_TURN_URL empty
- OK free_tier LIVE + Groq Lambda URL (ZERO_BILL)
- OK live gate before fetch
- OK empty URL abort
- OK node test abort
- OK free tier exhausted status
- OK no AWS/Groq secret-like literals under src/ app/

## Warnings
- free_tier LIVE — Groq Free 한도 내만 · 카드/Developer 전환 금지

## Failures
- (none)
