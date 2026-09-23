# 구글 플레이 IAP 설계 v1.0 — 김클로드 초안 검수

```text
status=REVIEWED
task_id=google-play-billing-iap-foundation-design-20260923
verdict=PARTIAL
date=2026-09-23
owner=김팀장
code=0
정본=docs/GOOGLE_PLAY_BILLING_IAP_FOUNDATION_DESIGN.md v1.0
```

김클로드: 결제 0% · UI/CSV 성숙 · 더미 증서 · 제출 게이트 선행 — AGREE.  
DISAGREE: `purchaseHistory`/`gems.balance`는 미구현·스키마 다름. `addGems` 직결 금지.  
PARTIAL: 검증은 B만이 아님(A2 Lambda 가능). VIP는 별 CSV·구독 타입.

관련실은 §3 SKU·§4 R1–R12를 지금 진행 가능. 클라는 §10 결정 후.
