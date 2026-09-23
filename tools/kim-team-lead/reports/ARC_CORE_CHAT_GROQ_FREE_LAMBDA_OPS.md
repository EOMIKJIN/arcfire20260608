# ArcCore chat — Groq Free + Lambda 중계 (ZERO_BILL)

```text
status=IMPLEMENTING
date=2026-09-08
policy=ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md
```

## 목표

인게임 아크코어 = **템플릿(G3)이 아닌 Groq Free NL**.  
카드 미등록 · Bedrock 미호출 · 한도 초과 시 로컬 G3.

## 재배포 주의 (필수)

런타임 정본은 **`nodejs24.x`** (Node 20.x는 2026-04-30 Lambda 패치 종료). 런타임만 바꿀 때는 `tools/arc-core-chat/update-lambda-runtime-node24.ps1` — Groq 키를 덮지 않는다.

`sam deploy` 할 때마다 template 의 `ARC_CORE_CHAT_GROQ_API_KEY: ''` 가 키를 **비웁니다.**  
**권장**: `tools/arc-core-chat/deploy-groq-free-tier.ps1` — 배포 직후 `set-groq-lambda-key.ps1`을 **자동** 호출한다.  
수동 `sam deploy`만 했을 때는:

```powershell
$env:GROQ_KEY = 'gsk_본인키'
cd D:\arcfire20260607
.\tools\arc-core-chat\set-groq-lambda-key.ps1
```

## 이미 코드에 반영된 것


| 축 | 내용 |
|----|------|
| Lambda | `ARC_CORE_CHAT_LLM_PROVIDER=groq` · `invokeGroqChat` · Bedrock IAM **제거** |
| 클라 | `VENDOR=free_tier` · `LIVE=true` · TurnUrl 설정 (ZERO_BILL golive) |
| 폴백 | 클라우드 실패/한도 → 기존 `localConversationalProvider` |

## 대표님 할 일 (키·배포 · 필수)

### A. Groq Free 키 (카드 없이)

1. https://console.groq.com 가입 (이메일/Google)
2. **결제 수단·Developer 유료 플랜 등록하지 말 것** (Free 유지)
3. API Keys → Create → 키 복사 (`gsk_…`)

### B. Lambda 배포

PC에 AWS CLI + SAM CLI, 계정에 Lambda 배포 권한 필요.

```powershell
cd D:\arcfire20260607
.\tools\arc-core-chat\deploy-groq-free-tier.ps1 -GroqApiKey 'gsk_본인키'
```

(`sam deploy`만 단독 실행하지 말 것 — CFN에 `GroqApiKey` Parameter 없음. 위 스크립트가 키 주입까지 함.)

Outputs 의 **TurnUrl** 을 복사한다.

### C. 앱 게이트 켜기 (김팀장/에이전트)

`src/arcCore/chat/arcCoreChatCloudGate.ts`:

```ts
export const ARC_CORE_CHAT_CLOUD_LIVE = true;
export const ARC_CORE_CHAT_FREE_TIER_TURN_URL = 'https://….lambda-url….on.aws/';
```

감사 (의도적 free-tier golive):

```powershell
$env:ARC_CORE_CHAT_BILLING_GOLIVE_ACK='1'
$env:ARC_CORE_CHAT_FREE_TIER_ACK='1'
npm run audit:arc-core-chat-billing
```

앱 `r` 리로드 → 허브 `[대화]` → **아크코어** → 자유 입력.

### D. 확인

- 회신이 템플릿 반복이 아닌 **문맥 NL**이면 성공
- Metro `__DEV__`: `[arcCoreChat] cloud ok` / `provider=cloud`
- CloudWatch: `{"arcCoreChatTurn":"ok","textLen":N,"hasKey":true}`
- Groq/AWS 결제 콘솔 **$0.00**
- 한도(429)면 인게임 한도 안내 또는 로컬 G3

## 금지

- Bedrock Playground/Invoke로 “테스트”
- Groq에 카드 넣고 Developer 전환
- 클라에 `gsk_` 키 기입
- `sam deploy --parameter-overrides GroqApiKey=...` (존재하지 않는 CFN Parameter)