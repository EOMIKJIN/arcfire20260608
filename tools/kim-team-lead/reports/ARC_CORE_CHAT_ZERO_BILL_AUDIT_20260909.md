# ArcCore chat ZERO_BILL / Groq Free — 전수 정밀검사 (2026-09-09)

```text
verdict=CONDITIONAL_PASS
scope=Groq Free + Lambda + 클라 LIVE + billing audit
inspector=김팀장
```

## 0. PSS 1차 (재확인)

```text
[pss-pre-dev] hot_path=유저 대화 1턴당 cloud fetch 0~1회 (틱/루프 아님)
[pss-pre-dev] alloc=요청당 body 직렬화 1회 · STAGE dispose 기존 overlay
[pss-pre-dev] verdict=PASS — 신규 상시 루프·persist 없음
```

## 1. 계약·요금 (PASS)

| 항목 | 결과 |
|------|------|
| `BILLING_MODE=zero_bill` | OK |
| Bedrock IAM / `ALLOW_BEDROCK=0` | OK |
| 클라에 `gsk_`·AWS 키 없음 | OK (감사 PASS) |
| `VENDOR=free_tier` · LIVE · TurnUrl | OK |
| `AWS_TURN_URL` 빈 값 | OK |
| 폴백 로컬 G3 | OK (`completeArcCoreChatReply`) |
| `npm run audit:arc-core-chat-billing` | **PASS** |
| aws unit tests | **14 PASS** |
| gate unit test | **PASS** |

## 2. 경로 정합 (PASS)

```text
앱 LIVE → FREE_TIER_TURN_URL
  → Lambda JWT 검증 → quota → pack 검역
  → Groq Free (llama-3.1-8b-instant)
  → 서버 quarantine → { text }
  → 실패/한도 → 로컬 G3
```

## 3. 재점검에서 발견한 이슈 · 조치

| 심각도 | 이슈 | 조치 |
|--------|------|------|
| **P1** | 서버 `fallback: no_model` 이 클라 **10분 hard-skip** → 일시 Groq 실패 시 NL 장시간 단절 | `no_model` 을 hard-fail 목록에서 **제거** (완료) |
| **P1** | 클라 타임아웃 8s vs Groq 기본 12s → 불필요 abort | Groq 기본 타임아웃 **7s** 로 정합 (완료 · 재배포 시 template 반영) |
| **P2** | `sam deploy` 시 template `GROQ_API_KEY: ''` 가 **키를 빈 값으로 덮어씀** | 운영 필수: 배포 후 `set-groq-lambda-key.ps1` **재실행** (문서·template 주석) |
| **P3** | Function URL Auth NONE | 의도적 · JWT는 핸들러에서 검증 · OK |
| **P3** | 인터넷 필수 | 제품 제약 · OK |

## 4. 최적화 판단

- 이벤트 구동(대화 턴)만 · 틱 할당 없음 → **추가 최적화 불필요**
- 서버 쿼터 8/분 · 팩 크기 캡 · 회신 quarantine · Zero-Allocation Skia 무관
- Bedrock 코드 잔존은 `ALLOW_BEDROCK=0` 가드 · 호출 경로 차단 OK (삭제 필수는 아님)

## 5. 남은 실기 DoD (코드 외)

- [ ] 인게임 NL 회신 확인 (대표님 실기)
- [ ] Groq/AWS 결제 콘솔 **$0**
- [ ] 이후 `sam deploy` 할 때마다 **키 스크립트 재실행**

## 6. 결론

**코드·감사 기준으로는 CONDITIONAL_PASS (구조 완료 · P1 수정 반영).**  
실기 NL·$0 확인과, **재배포 시 키 재주입**만 운영으로 남음.
