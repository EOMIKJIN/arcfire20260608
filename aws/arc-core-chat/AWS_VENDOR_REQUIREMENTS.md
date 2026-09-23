# Arcfire Online — AWS 요청 사항 (아크코어 대화 문장 LLM)

**문서 용도:** AWS 파트너/영업/솔루션 담당자에게 전달  
**작성:** 2026-08-17  
**제품:** 모바일 싱글플레이 게임 (React Native). 클라는 AWS SDK·키를 갖지 않음.  
**일정:** **ZERO_BILL (2026-09-08)** — 1인 테스트에서도 종량 $1 부가 금지.  
Bedrock Invoke/앱 LIVE **금지**. Free-tier NL만 후보.  
정본: `tools/kim-team-lead/reports/ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md`

---

## 1. 한 줄

게임 채팅 한 턴마다 **Amazon Bedrock에서 완성 문장 1회**만 호출한다.  
에이전트 플랫폼·스트리밍·지식베이스·음성은 **필요 없다.**

---

## 2. 필요한 것 (필수)

| # | 항목 | 요구 |
|---|------|------|
| 1 | **AWS 계정** | 프로덕션용 계정 1개. 결제(빌링) 사용 가능 상태 |
| 2 | **Amazon Bedrock** | 리전 `ap-northeast-2` (서울). 불가 시 `us-east-1` 대안을 명시 |
| 3 | **모델 사용 허가** | 온디맨드 InvokeModel. 1차 모델: `anthropic.claude-3-haiku-20240307-v1:0` (또는 동급 Haiku/라이트). 고성능 Opus/Sonnet **불필요** |
| 4 | **호출 방식** | `bedrock-runtime` `InvokeModel` (Messages, `anthropic_version: bedrock-2023-05-31`). **Converse 스트림·Bedrock Agents 불필요** |
| 5 | **서버 홉** | HTTPS 엔드포인트 1개. 권장: **Lambda + Function URL** (또는 API Gateway HTTP API + Lambda). Node.js 24 |
| 6 | **IAM** | Lambda 실행 역할에 `bedrock:InvokeModel` (해당 모델 ARN만). 앱/모바일 IAM 사용자 **금지** |
| 7 | **시크릿** | 키는 서버(환경변수 또는 Secrets Manager)만. 클라이언트·Git·Firebase에 키 전달 금지 |
| 8 | **인증** | 요청 헤더 `Authorization: Bearer <Firebase ID 토큰>`. 우리 Lambda가 Google JWKS로 RS256 실서명 검증. 위조 Bearer로는 InvokeModel 없음. Cognito로 게임 로그인을 바꾸지 말 것 |
| 9 | **한도** | 계정/모델 쿼터: 동시성 낮음. 예상 상한 **유저당 분당 8회**, 타임아웃 **8~15초**, `max_tokens` **256**, 응답 **500자 이내** |
| 10 | **전달물** | 아래 §5 체크리스트 |

## 3. 필요 없는 것 (요청하지 말 것)

- Amazon Bedrock **Agents / Knowledge Bases / Guardrails 콘솔 구성**(가드는 앱 로컬)
- **스트리밍** (InvokeModelWithResponseStream)
- SageMaker 학습·파인튜닝·전용 호스팅
- Lex, Q Business, Kendra, OpenSearch RAG
- 음성(Transcribe/Polly), 실시간 WebSocket
- 모바일용 AWS Amplify / Cognito 로그인 교체
- 고가 모델(Claude Opus, 대형 Sonnet) 기본 계약
- 멀티홉 툴 루프, 웹 검색, 장기 메모리 스토어
- RDS / Aurora / pgvector / OpenSearch / Bedrock Knowledge Base (대화 기억은 게임 로컬 400자)
- EventBridge Scheduler + SNS/Pinpoint를 선제 대화 경로로 신설 (선제는 클라 허브 Alert)
- 턴당 분류 모델 + 생성 모델 **2회** Invoke (항상 **1회**)
- Cognito로 게임 로그인 교체 (위 §2-8과 동일)

**나중에만 검토 (지금 요청하지 말 것):** Prompt Caching(시스템+페르소나 고정 접두), Haiku Batch(로컬 요약이 한계일 때 · 유저 전송 경로 밖).

세계 상태·거절·오프라인 폴백은 **게임 로컬**이 한다. AWS는 **문장 생성만** 한다.

---

## 4. 인터페이스 (구현이 이미 맞춰 둔 계약)

```http
POST {TURN_URL}
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{ "data": { /* ArcCoreAgentPack schemaVersion=1 */ } }
```

성공:

```json
{ "text": "플레이어에게 보이는 한 줄" }
```

모델/권한/쿼터 실패(앱이 로컬 폴백):

```json
{ "fallback": true, "reason": "no_model" }
```

- CORS: 모바일 fetch. `Content-Type` + `Authorization` 허용
- 본문 상한 약 16KB
- 스트리밍 응답 금지. 1회 JSON

---

## 5. 업체가 돌려줘야 할 것

1. **계정 ID** (12자리) + 사용할 **리전**
2. Bedrock에서 **Haiku(또는 동급) 모델 액세스 승인 완료** 여부. 서울에서 없으면 대체 리전·모델 ID
3. **InvokeModel 테스트 성공** 스크린샷 또는 CLI 출력 1건 (더미 프롬프트)
4. Lambda(또는 동등) **Function URL** — `https://…` 한 줄. IAM 인증이 아닌 **앱이 Bearer를 넣는 방식**과 충돌 없으면 됨 (Function URL Auth `NONE` + 우리 JWT 검증, 또는 동등)
5. Lambda 실행 역할 ARN, `bedrock:InvokeModel` 허용 리소스
6. 빌링: Bedrock 온디맨드 **단가**(입력/출력 1K 토큰) + 예상 월 최소(유휴) / 가정(일 1만 턴) 견적
7. 쿼터: 분당 Invoke 한도, 상향 필요 시 리드타임
8. 접속 정보: **IAM 사용자 액세스 키를 앱에 주지 말 것.** 운영자가 Lambda에 넣을 실행 역할이면 충분. 로컬 스모크용 키가 필요하면 **개발 전용·최소권한·만료 있는 키**만 별도 채널로

---

## 6. 규모·요금 가정 (견적용)

| 항목 | 값 |
|------|-----|
| 호출 패턴 | 플레이어가 채팅 **보내기 1회 = Bedrock 1회** |
| 입력 | 시스템+팩트 대략 1~2K 토큰 이하 |
| 출력 | 256 토큰 캡, 실제 1~200자 |
| 동시성 | 낮음 (싱글플레이, 채팅 연 유저만) |
| 장애 | 실패 시 게임이 로컬 문장으로 폴백. AWS 장애가 월드를 멈추면 안 됨 |

고성능 모델 견적은 넣지 말 것. **Haiku/라이트 온디맨드**만.

---

## 7. 담당 경계

| 우리 (Arcfire) | AWS 업체 |
|----------------|----------|
| 게임 클라, 팩 조립, 검역, 오프라인 폴백 | 계정·빌링·Bedrock 모델 허용 |
| Firebase Auth (기존, 무료 플랜 유지) | Lambda/URL 인프라 또는 우리가 배포할 권한 |
| 프롬프트·페르소나 | 키/역할이 클라에 노출되지 않게 구성 |
| 토큰 수령 후 URL을 앱 설정에 기입 | §5 전달물 |

문의 시 제품명 **Arcfire Online / ArcCore chat turn (Bedrock InvokeModel, non-streaming)** 으로 지칭하면 된다.
