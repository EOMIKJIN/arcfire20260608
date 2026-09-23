# AI 에이전트 인격화 기능 — 통합 구현 지시서 (Cursor용)
> 원본: ai_humanlike_features_spec.md 를 검토·통합 / 대상: React Native 클라이언트 + AWS 백엔드 / 조건: 비용 최소화
> 작성일: 2026-08-21
> **Arcfire 정합 (2026-08-21)**: 본 문서는 **인격화 의도·비용 원칙**만 유지한다. 구현 정본은 `docs/대화형_아크코어_구현.md` **§0-F**. 아래 §0 TBD는 코드 스캔으로 채움. §2~§4의 RDS/SQS/EventBridge/SNS/Cognito 그림은 **채택하지 않음**(§7).

---

## 0. 확정 조건 / 미확정(TBD) 사항

**확정**
- 클라이언트: React Native · Expo · 기존 채널 `presentArcCoreBackchannel` 1개
- AI 추론: AWS Bedrock **문장 1홉만** (`aws/arc-core-chat`). `ARC_CORE_CHAT_CLOUD_LIVE=false` 동안 실호출 없음
- 최우선 제약: **비용 최소화** + 헌법(입≠몸 · 오프라인 폴백 · 타이틀 대기 금지 · 클라 키 없음)
- 작업 범위: 원본 Phase 1~3의 **피처**는 `대화형_아크코어_구현.md` §0-F **H1~H6**으로 재구성. 본 문서 Phase를 그대로 코딩하지 말 것

**TBD — 코드베이스 스캔 결과 (2026-08-21 · 추측 아님)**
- [x] 기존 AWS 백엔드: **있음.** Lambda Function URL + `InvokeModel`. API Gateway/ALB **없음**. 인증은 Firebase JWT(핸들러 검증)
- [x] RDS/DynamoDB: **없음.** 대화 persist = 클라 `arcfire_arc_core_chat_v1`. 프로필 = Firestore 단발
- [x] Bedrock 리전: 템플릿 `ap-northeast-2` / 모델 `anthropic.claude-3-haiku-20240307-v1:0` (콘솔 허가는 업체)
- [x] 사용자 인증: **Firebase Auth(익명)**. Cognito **없음 · 도입 금지**
- [x] 트래픽: 싱글플레이 · 채팅 연 유저만. 견적 가정 `AWS_VENDOR_REQUIREMENTS.md` §6
- [x] 푸시: **FCM/APNs 미연동.** 선제는 허브 포그라운드 Alert

> Cursor는 §2 다이어그램을 신규 인프라 지시로 읽지 말 것. 구현 단위는 §7과 정본 §0-F.

---

## 1. 목적

원본 명세서(P0~P2, 5개 피처)를 "실제 개발 가능한 단위"로 재구성합니다. 원본은 백엔드 인프라(스케줄러/Vector DB/LLM 파이프라인)와 클라이언트 UX(타이핑 딜레이, 메신저형 UI)가 섞여 있어, 이 문서에서는 **레이어별 책임**과 **AWS 서비스 매핑**, **비용 최소화 대안**을 명확히 분리했습니다.

---

## 2. 레이어 구조

```
[RN 클라이언트]
   ├─ 메신저형 UI (분할 전송, 타이핑 인디케이터)
   ├─ 푸시 알림 수신 (FCM/APNs)
   └─ API 호출 (REST/WebSocket)
        │
        ▼
[API 계층 — API Gateway (REST or WebSocket)]
        │
        ▼
[Lambda: 대화 처리]
   ├─ Context Classifier 호출 (경량 모델)
   ├─ Memory Retrieval (아래 §3-2)
   ├─ Persona/Tone 프롬프트 조립
   └─ Bedrock LLM 호출 (메인 모델)
        │
        ▼ (비동기, SQS 경유)
[Lambda: Memory Ingestion]
   └─ 대화 종료 후 요약/감정 태그 추출 → 저장

[EventBridge Scheduler]
   └─ 선제적 발화 트리거 → Lambda → SNS/Pinpoint 푸시
```

---

## 3. AWS 서비스 매핑 (비용 최소화 기준)

### 3-1. LLM 호출 (Bedrock)
비용 최소화가 최우선 조건이므로, **단일 모델을 모든 작업에 쓰지 말고 작업 난이도별로 모델을 분리**합니다 (2026-08 기준 가격, 확인 필요 — 실제 청구는 Bedrock 콘솔에서 재확인):

| 용도 | 권장 모델 | 이유 |
|---|---|---|
| Context/Subtext 분류 (반어법·감정 판별) | Amazon Nova Micro 또는 Claude Haiku 4.5 | 단순 분류 작업에 고가 모델 불필요 |
| 메모리 추출/요약 (비동기, 실시간성 불필요) | Claude Haiku 4.5 + **Batch 추론(50% 할인)** | 지연 허용 가능한 작업은 반드시 배치로 |
| 메인 대화 응답 생성 | Claude Sonnet 5 (또는 Haiku 4.5로 시작 후 품질 필요시 업그레이드) | 품질과 비용의 균형점 |
| 페르소나 일관성 가드레일 체크 | Nova Micro | 규칙 기반 체크에 가까움 |

추가 비용 절감 장치:
- **Prompt Caching**: 시스템 프롬프트(페르소나 정의, 가드레일 규칙)는 매 요청 반복되므로 캐싱 필수 적용 (최대 90% 절감)
- **Intelligent Prompt Routing**: Bedrock 네이티브 기능으로 난이도에 따라 자동 라우팅 가능 (설정 검토)
- **Batch 추론**: 메모리 추출/감정 태깅처럼 실시간성이 없는 작업은 무조건 배치로 전환

> ⚠️ 정확한 모델 ID(예: `anthropic.claude-haiku-4-5-...`)와 리전별 가용성은 Bedrock 콘솔에서 반드시 재확인하세요. 모델 카탈로그는 자주 바뀝니다.

### 3-2. Long-term Dynamic Memory
- **Vector DB**: Pinecone/Milvus 같은 별도 유료 서비스 대신, 비용 최소화 조건상 **PostgreSQL + pgvector (RDS 또는 Aurora Serverless v2)** 우선 검토. 이미 관계형 DB가 있다면 확장(extension)만 추가하면 되어 별도 인프라 비용이 없음.
  - 대안: Amazon OpenSearch Serverless는 월 최소 과금(~$345/월 수준, 변동 가능)이 있어 **소규모 트래픽에는 비효율적** → 사용 지양
  - 대안: Bedrock Knowledge Base 사용 시 S3 Vectors 옵션 검토 (OpenSearch 대비 저렴)
- **감정/사건 태그 추출 파이프라인**: SQS(대화 종료 이벤트) → Lambda → Bedrock(배치) → RDS/pgvector 적재
- **감쇠 알고리즘**: 별도 인프라 불필요, Lambda 내 로직 또는 정기 배치(EventBridge Scheduler)로 오래된 기억의 가중치를 낮추는 필드 업데이트

### 3-3. Proactive Trigger Engine
- **스케줄러**: EventBridge Scheduler (Cron) — 상시 서버 불필요, 호출당 과금
- **알림 발송**: Amazon SNS Mobile Push (FCM/APNs 등록) — Pinpoint보다 단순 푸시 용도로는 저렴
- **Rate Limit / 방해 금지 모드**: DynamoDB에 사용자별 마지막 발송 시각 저장 후 Lambda에서 체크 (온디맨드 과금이라 저비용)

### 3-4. RN 클라이언트 (메신저형 UI)
- 타이핑 인디케이터/딜레이/문장 분할 전송은 **순수 클라이언트 로직**이며 AWS 비용과 무관 — 서버는 완결된 응답을 반환하고, RN 단에서 문장 단위로 split 후 setTimeout 기반 순차 렌더링
- 관련 라이브러리는 프로젝트에 이미 채팅 UI 라이브러리(react-native-gifted-chat 등)가 있는지 확인 후 재사용 여부 결정 필요 (TBD)

---

## 4. Phase별 구현 지시서

### Phase 1 — MVP (메모리 파이프라인 + 톤 조정)

**백엔드**
1. RDS/Aurora에 pgvector 확장 활성화 (신규 인프라 여부 TBD에 따라 신규 구축 또는 기존 DB 확장)
2. 대화 종료 이벤트 → SQS → Lambda(Memory Ingestion) 파이프라인 구축
   - Lambda 내부: Bedrock Haiku 배치 호출 → 선호도/사건/감정 태그 JSON 추출 → embedding 생성 → pgvector 적재
3. 대화 요청 처리 Lambda에 Hybrid Retrieval 추가 (키워드 필터 + 벡터 유사도 검색 → 상위 N개 컨텍스트로 프롬프트에 주입)
4. 시스템 프롬프트에 "구어체 톤 규칙" 표준화 (불필요한 불릿/문어체 금지 지시 포함) + Prompt Caching 적용

**RN 클라이언트**
1. 응답 텍스트를 문장 단위로 분할해 순차 렌더링하는 유틸 함수 작성 (`splitIntoTurns`)
2. 각 분할 메시지 사이 타이핑 인디케이터 표시 + 지연 시뮬레이션 (딜레이 값은 문장 길이 비례로 계산, 하드코딩 금지)

**완료 기준**: 이전 대화의 선호도/사건이 다음 세션에 반영되는지, 응답이 보고서형이 아닌 대화형인지 QA

---

### Phase 2 — 확장 (선제적 발화 + 페르소나)

**백엔드**
1. EventBridge Scheduler로 사용자별 선제 발화 후보 시각 계산 Lambda 등록 (아침 안부, 이전 주제 후속 등 템플릿화)
2. Rate Limit 테이블(DynamoDB) 설계: `userId`, `lastNudgeAt`, `dailyCount`, `doNotDisturb` 필드
3. SNS Mobile Push 연동 (RN 앱에 FCM/APNs 토큰 등록 API 추가 필요 — 토큰 발급 상태 TBD)
4. 페르소나 정의 JSON/YAML 스키마 설계 (가치관, 취향, 호불호) → 시스템 프롬프트에 고정 주입 + Prompt Caching

**RN 클라이언트**
1. 푸시 알림 수신 처리 및 알림 → 딥링크 이동 구현
2. 알림 권한 요청 UX, 방해 금지 시간대 설정 UI

**완료 기준**: 알림이 과도하게 오지 않는지(Rate Limit 동작 확인), 페르소나가 대화마다 일관되게 유지되는지 QA

---

### Phase 3 — 고도화 (뉘앙스 인식 + 실시간 리듬 완성)

**백엔드**
1. Context/Subtext Classifier를 별도 경량 모델(Nova Micro) 호출로 분리 — 메인 응답 생성 전 사전 분류 단계 추가 (반어법/농담/은어/감정 상태 라벨링)
2. 분류 결과를 메인 프롬프트에 구조화된 형태로 주입

**RN 클라이언트**
1. 다중 메시지 전송 시 읽음 표시, 순차 알림음 등 세부 리듬 UI 다듬기

**완료 기준**: 반어법/농담 테스트 케이스 셋에 대해 오응답률 감소 확인

---

## 5. 비용 최소화 체크리스트 (Cursor 작업 시 항상 확인)

- [ ] 모든 비동기 가능 작업(메모리 추출, 감정 태깅)은 Batch 추론 사용
- [ ] 시스템 프롬프트/페르소나 정의는 Prompt Caching 적용
- [ ] Vector DB는 신규 유료 서비스 대신 pgvector 우선
- [ ] 분류처럼 단순한 작업에 고가 모델 사용 금지 (Nova Micro/Haiku로 라우팅)
- [ ] Lambda는 상시 실행이 아닌 이벤트 기반으로만 트리거
- [ ] OpenSearch Serverless처럼 월 최소 과금이 있는 서비스는 소규모 트래픽에서 지양

---

## 6. Cursor에게 전달할 때 함께 줄 것

1. 이 문서
2. §0의 TBD 항목에 대한 실제 값 (또는 "코드베이스를 먼저 스캔해서 확인" 지시)
3. 원본 명세서(ai_humanlike_features_spec.md) — 세부 뉘앙스 참고용

Cursor에게는 본 문서 Phase를 **그대로 구현하지 말고**, `docs/대화형_아크코어_구현.md` §0-F **H1→H3→H4→H2→H5→H6** 순으로 지시하는 것을 권장합니다. 각 H 완료 기준은 그 표의 QA 한 줄이다.

---

## 7. Arcfire 정합 — 채택 / 재매핑 / 기각 (2026-08-21 검수)

범용 메신저 스택과 아크파이어 정본이 충돌한다. **중요 기능은 살리되, 새 서버를 열지 않는다.**

### 7-1. 이미 있는 기반 (보강 전에 중복 구축 금지)

| 기반 | 위치 |
|------|------|
| 채널 1 · 오버레이 셸 · 글자 타이핑 | `presentArcCoreBackchannel` · `ArcCoreChatOverlayContent` |
| 턴 팩 · 페르소나 · purpose/mode/stance | `arcCoreAgentPack` · `arc_core_chat_persona.csv` |
| 작업기억 · 일화 압축 | `topicStack` ≤4 · `lastArcQuestion` · `rollingSummary` 400 fold |
| 검역 · 폴백 · inFlight 1 · 8초 | F4/F5/F7 |
| AWS 문장 홉 · uid 분당 8 | `aws/arc-core-chat` · LIVE=false |
| 선제 1차 | `arcCoreInboundTalkRequest` (45–90초 / 8–15분 · 수락 Alert) |

### 7-2. 보강하면 원본 완료 기준에 닿는 것

| 원본 완료 기준 | 정본 단위 |
|----------------|-----------|
| 이전 대화 선호/사건이 다음 세션에 반영 | **H1+H5 장착** (요약 `#tags` 접두. 임베딩 없음) |
| 응답이 보고서형이 아닌 대화형 | **H2 장착** `persona_tone` 신규 행 |
| 분할 렌더 · 타이핑 딜레이 | **H3 장착** 클라 문장 ≤4 · persist 한 줄 |
| 알림이 과도하지 않음 | inbound 쿨다운 + **H4 정책 장착(default off)** |
| 페르소나 일관 | 기존 CSV/팩 + H2 |
| 반어/농담 오응답 감소 | **H6 장착** `nuanceHint`. Nova 없음 |

### 7-3. 기각 (구현 착수 금지)

- PostgreSQL/pgvector · Aurora · OpenSearch · Bedrock Knowledge Base를 대화 기억으로 신설
- 대화 종료 → SQS → Memory Ingestion Lambda
- EventBridge Scheduler로 유저별 선제 시각 계산
- SNS/Pinpoint 푸시를 선제의 **1차 경로**로 삼음 (후속 부가만 검토)
- Cognito 로그인 교체 · gifted-chat · WebSocket 스트리밍
- 메인 응답 전 경량 모델 **필수** 2홉 (턴당 Bedrock 2회)
- 전 NPC LLM화 (`AI에이전트_NPC_CONVERSATION_ARCHITECTURE_REDESIGN_REVIEW_v1.md`와 본 기능을 합치지 말 것)

### 7-4. 비용 체크리스트 재작성 (본 게임)

- [x] 실시간 필요 없는 기억 추출은 **로컬 fold** (Batch 추론은 후속 예약)
- [ ] LIVE 후 시스템/페르소나 Prompt Caching (선택)
- [x] Vector DB **신설하지 않음**
- [x] 분류에 고가 모델 금지 — 로컬 힌트. 문장은 Haiku 1종
- [x] Lambda는 유저 전송 이벤트만 (inbound는 클라 타이머)
- [x] OpenSearch Serverless 등 월 최소 과금 검색 스택 지양
