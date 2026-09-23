# ArcCore chat — AWS 중계 (ZERO_BILL · Groq Free)

문장 LLM 본선 = **Groq Free** (카드 없이). Lambda는 JWT·검역·중계만. **Bedrock Invoke 기본 금지.**

- 핸들러: `src/handler.ts` → `llmInvoke` → `groqInvoke` (기본)
- 인증: Firebase ID 토큰 JWKS 실서명 검증 후에만 LLM
- Bedrock: `ARC_CORE_CHAT_ALLOW_BEDROCK=1` + provider=bedrock 일 때만 (종량 · ZERO_BILL 위반)
- 배포: `npm run build` → `sam deploy --parameter-overrides GroqApiKey=...`
- 운영 절차: `tools/kim-team-lead/reports/ARC_CORE_CHAT_GROQ_FREE_LAMBDA_OPS.md`
- 클라: `VENDOR=free_tier` · URL=`ARC_CORE_CHAT_FREE_TIER_TURN_URL` · `LIVE`는 URL 확보 후
- 감사: `npm run audit:arc-core-chat-billing`

지금은 레포 기본 `CLOUD_LIVE=false` · URL 빈 값 → **게임→클라우드 호출 0**.  
배포·URL·LIVE 후에만 인게임 NL.
