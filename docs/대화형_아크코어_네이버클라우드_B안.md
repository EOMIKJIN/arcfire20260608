# 대화형 아크코어 — 네이버 클라우드 적용 B안

> **문서 버전**: v0.1  
> **작성**: 2026-08-22  
> **상태**: **설계·예비만** — A안(Bedrock) **사용제한 해제(2026-09-07)** 이후 **구현 우선순위 없음**.  
> 코드 착수·LIVE·NCP 키는 대표님이 **A안이 다시 막히거나 B안을 명시**하기 전 **금지**.  
> **위치**: 적용 B안. A안(AWS Bedrock 본선) 잠금·**재개 우선**  
> **상위 정본**: `docs/대화형_아크코어_구현.md` §12-A · READY=`tools/kim-team-lead/reports/READY_ARC_CORE_CHAT_BEDROCK_GOLIVE.md`  
> **혼동 금지**: 도메인 문서의 「세계 콘트롤 B안」(입 제안·LIVE=false)과 **다른 축**. 본 문서는 **문장 LLM 벤더 홉**만 다룬다.

```text
[pss-pre-dev] hot_path=없음 (설계 문서) · 클라 fetch/틱/부트 변경 없음
[pss-pre-dev] alloc=없음 · cache=기존 팩·검역·JWT 재사용 예정
[pss-pre-dev] verdict=PASS — 문서만. ncloud/ 소스·게이트 vendor 추가는 대표님 구현 지시 후
```

---

## 0. 한 줄

AWS Bedrock 계정 제한이 길어질 때를 대비해, **같은 게임 파이프**(팩 → 서버 1홉 → 검역 → 로컬 F5)에 **네이버 클라우드 CLOVA Studio / HyperCLOVA X** 를 끼울 수 있게 설계한다.  
지금은 문서와 준비 순서만 고정한다. 앱은 계속 로컬 G3다.

---

## 1. 왜 B안이었나 (2026-08-22) · 강등 (2026-09-07)

| 사실 | 의미 |
|------|------|
| (당시) Anthropic FTU / 지원 케이스 | Bedrock Invoke 불가 → 예비 홉 설계 |
| **2026-09-07** | 대표님 확인 — **Bedrock 사용제한 해제** → **A안 재개 우선** |
| 클라 파이프 | 당분간 `CLOUD_LIVE=false` · URL 배포 후 LIVE (READY 체크리스트) |
| 로컬 G3 | 실기. 세계는 멈추지 않음 |

A안을 폐기하지 않는다. B안은 **예비 홉**이다. A안이 풀린 뒤에는 B안 구현보다 **A안 배포·LIVE**를 우선한다.

---

## 2. 잠금 (B안을 켜도 유지)

| # | 잠금 | B안에서 |
|---|------|---------|
| L1 | 입 ≠ 몸 · 월드 write 툴 없음 | CLOVA function calling **사용 안 함** |
| L2 | 클라에 벤더 SDK/키 없음 | NCP API 키는 **서버만**. Git·Expo·앱 env **금지** |
| L3 | 온디바이스 LLM 금지 | 동일 |
| L4 | 스트리밍 없음 | `Accept: application/json` · SSE/`text/event-stream` **금지** |
| L5 | 한 턴 모델 호출 1회 | 분류+생성 2홉 금지 |
| L6 | 인증은 Firebase ID 토큰 | 게임 로그인을 NCP/Cognito로 **바꾸지 않음** |
| L7 | 팩 없이 API만 열지 않음 | 기존 `ArcCoreAgentPack` schema 1 재사용 |
| L8 | 실패 = 로컬 F5 | 키 없음·8초·검역 실패 동일 |
| L9 | 타이틀/부트/틱에 호출 없음 | 동일 |
| L10 | 시작 화면 버튼에 채널 대기 금지 | 동일 |

클로드코드 API · 앱에서 Claude/CLOVA 직결 · Inworld SDK는 B안이 **아니다**.

---

## 3. 벤더 자리 (세 칸)

| 안 | 벤더 | 코드 자리 | 지금 |
|----|------|-----------|------|
| **A안 (본선)** | AWS Bedrock Claude 3 Haiku | `aws/arc-core-chat` | JWT·SAM 있음. **제한 해제 · 배포·LIVE 대기** |
| **확장 옵션** | Firebase Vertex/Gemini | `functions/src/arcCoreChatTurn.ts` | Spark라 export/deploy 안 함 |
| **B안 (본 문서)** | NCP CLOVA Studio HyperCLOVA X | 예정 `ncloud/arc-core-chat` | **폴더 없음 · 설계만** |

클라 게이트(`arcCoreChatCloudGate.ts`)는 구현 턴에 `vendor`에 `ncloud`를 **추가**한다. 지금은 `aws` · LIVE=false 유지.

---

## 4. 대상 상품 (NCP)

공개 문서 기준 (2026-08). 콘솔 단가·상품명은 계정 개설 후 **한 번 더 확인**.

| 항목 | B안 선택 | 하지 않음 |
|------|----------|-----------|
| 상품 | **CLOVA Studio Basic** (토큰 종량) | Exclusive 전용 GPU · Neurocloud 온프렘 |
| 모델 1차 | **HCX-DASH-002** (가벼운 문장, 저지연) | HCX-007 추론(Thinking) — 비용·지연 |
| 모델 대안 | HCX-005 (지시 수행이 약할 때만, 대표님 승인) | 임베딩·RAG·이미지 |
| API | Chat Completions **비스트리밍 JSON** 1회 | Chat Completions v3 Function calling · Structured Outputs |
| 엔드포인트(참고) | `https://clovastudio.stream.ntruss.com` + `/v1/chat-completions/{model}` | 구형 `clovastudio.apigw.ntruss.com` (지원 중단 예정) |
| 인증(서버→NCP) | `Authorization: Bearer {CLOVA API Key}` | 클라에 이 Bearer를 넣지 않음 |
| 구키(레거시) | 쓰지 않음 | `X-NCP-CLOVASTUDIO-API-KEY` + `X-NCP-APIGW-API-KEY` 이중 헤더 |
| 서비스 앱 | **상용 전에 NCP 서비스 앱 신청**이 필요할 수 있음 | 플레이그라운드 키를 앱에 심기 |
| 리전 | NCP **한국** | 미국/싱가포르로 문장 홉을 옮기지 않음 |
| RAG/챗봇 빌더 | 사용 안 함 | CLOVA Chatbot 도메인·엔티티 |

세계·거절·기억은 계속 **게임 로컬**(팩 + 요약 400 + 검역). NCP는 **문장만**.

---

## 5. 아키텍처

```text
플레이어 전송
  → completeArcCoreChatReply
  → 팩 조립 (기존 F2, 변경 없음)
  → LIVE=false 이면 지금처럼 로컬 F5
  → (B안 LIVE 후) POST {NCP_TURN_URL}
        Authorization: Bearer <Firebase ID 토큰>   ← 게임 uid
        body: { data: ArcCoreAgentPack }
      → ncloud/arc-core-chat
        1) Google JWKS RS256 검증 (aws 모듈과 동일 계약)
        2) uid 분당 8 쿼터
        3) pack 검증 · worldWrite=true 거절
        4) buildArcCoreChatPrompt (기존 시스템/유저 문장)
        5) CLOVA Chat Completions 1회 (서버 키, 12초 abort, 비스트림)
        6) 서버 검역
        7) { text, topicIds: pack.topicStack 에코, askedQuestion? }
  → 클라 검역 · 실패 시 F5
```

클라 `cloudConversationalProvider`의 fetch 형태는 **그대로**다. 바뀌는 것은 URL·vendor 스위치와 **서버 구현체**뿐이다.

### 5-1. 서버 홉 위치 (권장 1안만)

| 안 | 홉 | 쓸 때 | 채택 |
|----|-----|--------|------|
| **B-홉1** | NCP Cloud Functions(또는 API Gateway + Function) HTTPS 1개 | AWS 계정 제한과 **완전 분리** | **권장** |
| B-홉2 | 기존 AWS Lambda가 Bedrock 대신 CLOVA를 호출 | Lambda 배포는 되고 Bedrock만 막힐 때 | 예비. AWS 의존이 남음 |
| B-홉3 | Firebase Functions가 CLOVA 호출 | Spark 해제(Blaze) 후 | 쓰지 않음. Spark 잠금 유지 |

B안 목적은 AWS 제한 우회이므로 **B-홉1**만 1차로 설계한다.

### 5-2. 재사용할 것 / 새로 쓸 것

| 재사용 (복제 또는 공유, 계약 동일) | 신규 |
|-----------------------------------|------|
| `pack.ts` schema 1 · `buildArcCoreChatPrompt` | `clovaInvoke.ts` (비스트림, maxTokens 256, 12초) |
| `quarantine.ts` | `ncloud/arc-core-chat` 핸들러·엔트리 |
| `verifyFirebaseJwt.ts` | NCP 배포 템플릿(Functions/Gateway) |
| 클라 게이트·스킵·팩 한도 16k · 8초 | `ARC_CORE_CHAT_NCLOUD_TURN_URL` (빈 값 기본) |

P2에서 공유 패키지로 빼지 말고 **aws 소스를 복제**한다. 성급한 모노레포는 Metro/PSS 리스크다. 동작이 같아진 뒤 대표님 지시로만 추출.

### 5-3. 프롬프트

A안 시스템 문장(관측만 · write 거절 · 섀도우 · 한국어)을 **그대로** 넣는다.  
HyperCLOVA는 톤이 Claude와 다를 수 있다. **LIVE 후 샘플 20턴**을 보고 페르소나 CSV **신규 행만** 보강한다. 기존 7행 문구는 승인 없이 덮지 않는다 (`arcfire-existing-value-change-confirm`).

---

## 6. 클라 게이트 (구현 턴 초안 · 지금 적용 금지)

```text
ARC_CORE_CHAT_CLOUD_LIVE=false          # 유지
ARC_CORE_CHAT_CLOUD_VENDOR=aws          # A안 유지. B안 전환 시에만 ncloud
ARC_CORE_CHAT_AWS_TURN_URL=''
ARC_CORE_CHAT_NCLOUD_TURN_URL=''        # 추가 예정
```

켜는 순서 (A안과 동일 철학):

```text
1) JWT 검증이 들어간 ncloud 홉을 배포
2) Function/Gateway URL을 NCLOUD_TURN_URL에만 기입
3) 대표님 승인 후 VENDOR=ncloud 그리고 CLOUD_LIVE=true
   NCP API 키를 앱에 넣거나, 키를 먼저 공개하지 않음
```

A안과 B안을 **동시에 LIVE** 하지 않는다. 한 턴에 모델 1회.

---

## 7. 계정·키 운영

| 항목 | 규칙 |
|------|------|
| NCP 계정 | 게임 운영 계정 1개. 결제 수단 등록 |
| CLOVA Studio | 이용 신청(Basic) |
| API 키 | 콘솔 발급. **서버 환경변수/시크릿만** |
| 키 회전 | Git·채팅·스크린샷에 키 본문 금지 |
| 쿼터 | 서버 uid당 분당 8 (기존과 동일) |
| 과금 | 플레이어 전송 1 = CLOVA 1. 호출 없으면 토큰비 0 |
| 서비스 앱 | NCP가 상용에 요구하면 신청. 키를 바꾸면 서버만 갱신 |

업체/콘솔에 요청할 것 (체크리스트):

1. NCP 계정 ID · 한국 리전  
2. CLOVA Studio Basic 사용 가능 여부  
3. 모델 `HCX-DASH-002` (또는 콘솔 표기명) 호출 성공 1건 — **서버에서만**, 앱 LIVE 전  
4. 서비스 앱 필요 여부  
5. 토큰 단가 · 예상 월 최소(유휴) / 가정 일 1만 턴  
6. Cloud Functions(또는 HTTPS 홉) 배포 권한  

플레이그라운드에서 대표님이 직접 긴 대화를 칠 필요는 없다. 스모크 1줄이면 충분하다.

---

## 8. 기반 작업 계획 (단계)

대표님 지시 없이 **P2부터 코드 금지**. P0은 본 문서다.

### P0 — 설계 고정 (완료 · 본 문서)

- A안 유지 · B안 범위 · 홉1안 · 모델 · 잠금 · 게이트 순서

### P1 — 계정만 (코드 없음)

- NCP 가입 · 결제 · CLOVA Studio 신청  
- API 키 발급 → **로컬 시크릿 보관**. 저장소에 넣지 않음  
- 콘솔에서 모델 ID·서비스 앱 요건 확인 → 본 문서 §4 표 한 줄 갱신  
- AWS 케이스 `178734081000042`는 **병행 유지**. 해제되면 A안 재개 가능

### P2 — 서버 뼈대 (구현 지시 후)

- `ncloud/arc-core-chat/` 신설 (`handler` · `clovaInvoke` · pack/quarantine/JWT 복제)  
- 유닛 테스트: 위조 Bearer → CLOVA 미호출 · write 팩 거절 · 키 없음 → `no_model`  
- 배포 템플릿 초안. `dist/`·키·URL은 커밋하지 않음

### P3 — 다크 배포

- NCP에 홉 배포 · URL만 확보  
- 클라 `NCLOUD_TURN_URL`은 아직 빈 값 · LIVE=false  
- 운영자 머신에서 JWT+팩 1회 스모크 (앱 스토어 빌드 아님)

### P4 — 전환 (대표님 승인)

- `VENDOR=ncloud` · `CLOUD_LIVE=true` · URL 기입  
- 실기 허브 대화 1세션 · 실패 시 즉시 LIVE=false (로컬 복귀)  
- `mem-post-dev-recheck` (게이트·스토어 만진 경우)

### P5 — 톤 맞춤 (기존 CSV 덮지 않음)

- 샘플 20턴 보고 `kind=tone` **신규 행**만 검토  
- 기존 페르소나 7행은 재확인·승인 후에만 수정

---

## 9. 일정 가정

| 조건 | 동작 |
|------|------|
| AWS 케이스가 P2 전에 해제 | **A안 배포를 우선**. B안 P2는 HOLD |
| AWS가 수일~수주 막힘 · 대표님이 B안 구현 지시 | P1 → P2 순서 |
| AWS와 NCP를 둘 다 상시 LIVE | **금지** |

날짜를 박지 않는다. 게이트는 케이스 회신과 대표님 지시이다.

---

## 10. 하지 않을 것

- 앱/`app.json`/EAS secret에 NCP 키  
- CLOVA RAG · Chatbot 빌더 · Papago를 아크코어 채널에 합치기  
- 스트리밍 타이핑을 네트워크 SSE로 교체 (로컬 글자 타이핑 유지)  
- 클로드코드 API를 B안 대용으로 쓰기  
- 세계 콘트롤 B안(시설 제안)과 이 문서를 한 PR에 섞기  
- Spark Firebase를 CLOVA 중계로 쓰기  
- 기존값(페르소나 문구·레이아웃 상수) 무단 변경  

---

## 11. 완료·착수 게이트

| 게이트 | 기준 |
|--------|------|
| 설계 | 본 문서 v0.1 + 상위 정본 §12-A 포인터 |
| 코드 착수 | 대표님 「B안 P2 구현」 명시 |
| LIVE | P3 스모크 PASS + 대표님 승인 + A안과 동시 LIVE 아님 |
| 롤백 | `CLOUD_LIVE=false` 한 줄. 로컬 G3 |

---

## 12. 공식 링크 (P1용)

| 용도 | URL |
|------|-----|
| NCP 콘솔 | https://console.ncloud.com/ |
| CLOVA Studio 가이드 | https://guide.ncloud-docs.com/docs/clovastudio-overview |
| API 키 | https://guide.ncloud-docs.com/docs/clovastudio-apikey |
| Chat Completions | https://api.ncloud-docs.com/docs/clovastudio-chatcompletions |
| 모델 표 | https://guide.ncloud-docs.com/docs/clovastudio-model |

---

## 13. 교차

- 상위: `docs/대화형_아크코어_구현.md` §0-C F1 · §12-A  
- A안 서버: `aws/arc-core-chat`  
- A안 업체 요청: `aws/arc-core-chat/AWS_VENDOR_REQUIREMENTS.md`  
- 클라 게이트: `src/arcCore/chat/arcCoreChatCloudGate.ts` (지금은 aws · LIVE=false)
