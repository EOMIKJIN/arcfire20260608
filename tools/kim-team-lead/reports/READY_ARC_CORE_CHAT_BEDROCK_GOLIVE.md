# READY — ArcCore chat AWS Bedrock 실호출 (G5)

```text
status=FORBIDDEN_UNTIL_PAID_OK
task_id=arc-core-chat-bedrock-golive-20260907
date=2026-09-08
trigger=대표님 ZERO_BILL — 1인 테스트에서도 종량 $1 부가 금지
owner=김팀장
commit=금지
canonical_policy=tools/kim-team-lead/reports/ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md
free_tier_path=tools/kim-team-lead/reports/READY_ARC_CORE_CHAT_FREE_TIER_NL.md
```

## 0. 재검토 결론 (ZERO_BILL)

| 항목 | 판정 |
|------|------|
| Bedrock / Haiku Invoke | **금지** — 호출 1회부터 종량 청구 가능 ($1이라도 FAIL) |
| Playground 콘솔 테스트 | **권고 금지** — 콘솔도 청구 가능 |
| **대체** | **Free-tier NL** (`READY_ARC_CORE_CHAT_FREE_TIER_NL.md`) |
| 재개 조건 | 대표님 **「종량 요금 허용」** + `ARC_CORE_CHAT_METERED_ACK=1` |

정본: `ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md` · `docs/대화형_아크코어_구현.md` §12-A

---

## 1. 이미 준비된 것 (재확인)

- [x] 팩·검역·로컬 F5 · `cloudConversationalProvider` 8초 fetch
- [x] `aws/arc-core-chat` JWT JWKS · Bedrock Invoke · 서버 검역 · SAM `template.yaml`
- [x] 게이트 `src/arcCore/chat/arcCoreChatCloudGate.ts` (VENDOR=aws)
- [x] `npm test` in `aws/arc-core-chat` PASS (2026-09-07)
- [x] Bedrock 서울 로그인 · Haiku Marketplace 계약 · Playground 대화 (2026-09-08)
- [x] 요금 dark 감사 `npm run audit:arc-core-chat-billing` PASS

---

## 2. 실호출 켜기 전 체크리스트 (순서 고정 · 2안 전환 시)

### 콘솔·계정
- [x] Bedrock 리전 `ap-northeast-2`
- [x] 모델 `anthropic.claude-3-haiku-20240307-v1:0` **액세스 승인**
- [x] 콘솔 Playground 스모크 1건 성공

### 배포
- [ ] `cd aws/arc-core-chat && npm run build`
- [ ] SAM/배포 → **Function URL** 1줄 확보
- [ ] Lambda 역할에 `bedrock:InvokeModel` (해당 모델 ARN만)

### 앱 (배포 URL 확보 후만)
- [ ] `ARC_CORE_CHAT_AWS_TURN_URL` = Function URL
- [ ] `ARC_CORE_CHAT_CLOUD_LIVE=true`
- [ ] VENDOR 유지 `aws`
- [ ] 실기: 허브 아크코어 채널 1턴 → 클라우드 문장 · 끊김 시 로컬 폴백

### 금지
- [ ] 클라/Expo/Git에 IAM 액세스 키 넣지 않음
- [ ] 스트리밍·Bedrock Agents/KB 사용 안 함
- [ ] 팩 없이 API만 열어 테스트하지 않음
- [ ] 타이틀/부트/틱에 호출 넣지 않음

---

## 3. 다음 구현 턴 (대표님 「배포·LIVE 켜」 지시 시)

1. SAM 배포 → URL 회수  
2. 게이트 상수 2줄만 기입 (`URL` → `LIVE`)  
3. 실기 1턴 + `tsc` + aws `npm test` + `ARC_CORE_CHAT_BILLING_GOLIVE_ACK=1` 감사  
4. 문서 §12-A 「지금」행 LIVE=true · 본 READY `status=DONE`  

NCP B안·Firebase Vertex는 **이번 턴 범위 밖**.

---

## 4. PSS

```text
[pss-pre-dev] hot_path=채팅 보내기 1회(로컬) · 틱/부트 없음 · cloud fetch 게이트 off
[pss-pre-dev] stage=오버레이 채널 · alloc=턴당 로컬 · cache=cloud skip 기존
[pss-pre-dev] verdict=PASS — 1안 잠금. LIVE 기입은 지시 후
```
