# 인게임 아크코어 NL 미연동(템플릿만 반복) — 원인 분석 · 수정안 (분석 전용, 코드 미변경)

```text
status=ANALYSIS_ONLY
task_id=arc-core-chat-nl-template-fallback-analysis-20260909
kind=BUG_ANALYSIS
code_changes=NO
author=김클로드
date=2026-09-09
trigger=대표님 — "김팀장 Lambda/Groq 연동 작업 중 버그로 인게임이 계속 템플릿 대화만 반복"
착수조건=김팀장 작업 완료 후에도 재현되거나, 반복 시도에도 김팀장이 못 고칠 때만 아래 수정안 실행. 그 전까지 코드 미변경(중복 작업 방지).
```

## 1. 증상

인게임 아크코어 대화창이 Groq Free + Lambda 연동 이후에도 **자연어(NL) 회신이 아니라 계속 기존 템플릿(G3) 응답만** 나온다.

## 2. 재검수 방법

김팀장의 `ARC_CORE_CHAT_ZERO_BILL_AUDIT_20260909.md`(CONDITIONAL_PASS)를 그대로 받아쓰지 않고, 클라(`src/arcCore/chat/*`)·서버(`aws/arc-core-chat/src/*`)·배포 스크립트(`tools/arc-core-chat/*`·`aws/arc-core-chat/template.yaml`)를 전부 직접 읽고 실제 호출 경로를 코드로 추적했다. 그 결과 **김팀장 감사 문서가 다루지 않은, 배포 스크립트 자체의 결함**을 발견했다 — 이것이 가장 유력한 원인이다.

## 3. 실제 호출 경로 (코드로 확인)

```text
인게임 대화 → arcCoreBackchannelReply.ts:13 completeArcCoreChatReply(turn)
  → arcCoreChatReplyProvider.ts:76 tryCompleteCloudArcCoreChatReply(pack)   ← cloud 시도, 정상 호출됨(아래 §5-3 참고)
    → cloudConversationalProvider.ts:78 fetch(FREE_TIER_TURN_URL, Bearer <Firebase ID token>)
      → handler.ts:136 invokeArcCoreChatLlm → llmInvoke.ts → groqInvoke.ts:65 invokeGroqChat
        → apiKey 없으면 groqInvoke.ts:66 { ok:false, reason:'no_key' }
        → llmInvoke.ts:39 { ok:false, reason:'no_model' } 로 뭉뚱그려짐
        → handler.ts:141 { fallback:true, reason:'no_model' } 반환
  → cloudConversationalProvider.ts:108 { status:'unavailable' } (P1 수정으로 hard-skip 되진 않지만, 매 턴 동일하게 실패)
  → arcCoreChatReplyProvider.ts:113 localConversationalProvider.complete() 로 폴백 = **매번 템플릿**
```

이 경로대로면 "가끔 템플릿"이 아니라 **"항상 템플릿"** 이 되는데, 이게 대표님이 보고한 증상과 정확히 일치한다.

## 4. 원인 후보 — 신뢰도순

### 4-1. (최우선 의심) 배포 스크립트가 Groq 키를 실제로 Lambda에 주입하지 못함

`aws/arc-core-chat/template.yaml:5-7`의 작성자 주석:

```yaml
# GroqApiKey 는 CFN Parameter 로 넣지 않는다 (특수문자 ValidationError).
# 배포 후: aws lambda update-function-configuration 또는
#          tools/arc-core-chat/set-groq-lambda-key.ps1
```

그런데 template.yaml 전체(48줄)에는 **`Parameters:` 섹션 자체가 없다** — `GroqApiKey`라는 CFN 파라미터가 애초에 정의돼 있지 않다. 반면:

- `tools/arc-core-chat/deploy-groq-free-tier.ps1:37` — `sam deploy ... --parameter-overrides "GroqApiKey=$GroqApiKey"`
- `tools/kim-team-lead/reports/ARC_CORE_CHAT_GROQ_FREE_LAMBDA_OPS.md:49-51`(§B, 실제 실행 절차) — 동일하게 `sam deploy --guided --parameter-overrides "GroqApiKey=..."`

**둘 다 템플릿에 없는 파라미터를 넘기고 있다.** 템플릿 작성자 본인이 "CFN Parameter로 넣으면 안 된다"고 주석에 못박아 놓고, 정작 배포 스크립트·운영 문서 두 곳 모두 그 방식 그대로 만들어져 있다 — 자기모순. `sam deploy`는 이 경우 보통 파라미터를 무시하거나 검증 에러를 내는데, 어느 쪽이든 **`ARC_CORE_CHAT_GROQ_API_KEY` 환경변수는 template.yaml:39에 하드코딩된 빈 문자열(`''`)로 배포**된다.

게다가 `deploy-groq-free-tier.ps1`은 배포 후 안내(41-43줄)에서 **`set-groq-lambda-key.ps1` 실행을 아예 언급하지 않는다** — TurnUrl 복사와 클라 게이트 LIVE=true만 안내. OPS 문서는 상단 "재배포 주의" 콜아웃에만 언급하고, 실제 A→B→C→D 실행 순서에는 그 스텝이 없다.

**결론**: 이 스크립트/문서 그대로 따라 배포했다면, 클라 게이트는 이미 LIVE(현재 `arcCoreChatCloudGate.ts` 확인상 `CLOUD_LIVE=true`·`VENDOR=free_tier`·TurnUrl 값 있음 — 즉 §B~C는 수행됨)이지만 **Lambda의 Groq 키는 계속 빈 값**일 가능성이 높다. 이러면 매 턴 `no_key`→`no_model`로 실패 → 매번 로컬 템플릿 폴백 — 증상과 100% 일치.

김팀장 자신의 오늘자 감사(`ARC_CORE_CHAT_ZERO_BILL_AUDIT_20260909.md` §5)도 "인게임 NL 회신 확인"을 **미체크**로 남겨뒀다 — 즉 김팀장도 아직 실기로 NL이 실제로 오는지 확인하지 못한 상태였다는 뜻이고, 이 분석과 모순되지 않는다.

### 4-2. (2순위, 미확인) Firebase 익명 인증 미비

`cloudConversationalProvider.ts:40-57` `getChatIdToken()`이 `ensureFirebaseAnonymousAuth()` 실패 시 `null`을 반환하며, 이 경우 `tryCompleteCloudArcCoreChatReply`는 **fetch 자체를 시도하지 않고** `{status:'unavailable'}`로 끝난다(72-73줄). Firebase 콘솔에서 Anonymous 로그인이 비활성 상태라면 이 경로로도 동일한 증상(항상 템플릿)이 나온다. 콘솔 접근 없이는 코드만으로 확정 불가 — §6-B로 구분 가능.

### 4-3. (원인 아님, 확인 완료) `getArcCoreChatReplyProvider()` 죽은 코드

`arcCoreChatReplyProvider.ts:38-41`:

```ts
/** 외부 훅용. 본선은 로컬. 클라우드는 Spark 기간 게이트 off. */
export function getArcCoreChatReplyProvider(): ArcCoreChatReplyProvider {
  return localConversationalProvider;
}
```

이 함수는 `grep` 결과 **호출부 0건**(정의만 존재). 실제 인게임 경로는 `arcCoreBackchannelReply.ts:13`이 `completeArcCoreChatReply`를 직접 호출하고, 이 함수는 `tryCompleteCloudArcCoreChatReply`를 정상적으로 먼저 시도한다(§3). 따라서 이 오래된 주석·죽은 함수는 **현재 버그의 원인이 아니다** — 다만 "클라우드는 게이트 off"라는 stale 주석이 향후 다른 작업자를 오해시킬 수 있어 정리 후보로만 남겨둔다.

## 5. 수정안 (제안만, 미적용)

### A. 배포 스크립트/문서를 template.yaml의 실제 설계와 일치시킨다

두 가지 중 하나로 통일 (템플릿 작성자의 원래 의도 — "CFN Parameter 쓰지 말 것" — 를 따르면 A-1 권장):

- **A-1 (권장)**: `deploy-groq-free-tier.ps1`에서 `--parameter-overrides "GroqApiKey=$GroqApiKey"` 줄을 제거하고, `sam deploy` 성공 직후 같은 스크립트 안에서 `set-groq-lambda-key.ps1`을 자동으로 이어 호출하도록 합친다. OPS 문서 §B도 동일하게 "배포 → 키 스크립트"가 한 번의 실행으로 끝나도록 절차를 다시 씀(현재처럼 상단 경고문에만 의존하지 않게).
- **A-2 (대안)**: template.yaml에 실제로 `Parameters: GroqApiKey` 섹션을 추가해 `--parameter-overrides`가 실제로 작동하게 만든다. 단 템플릿 주석이 "특수문자 ValidationError"를 이유로 명시적으로 배제한 방식이라 재현 검증 필요 — A-1이 더 안전.

### B. 코드 변경 없이 먼저 확정 진단(관측만, 상태 불변)

실제 수정 전에 4-1/4-2 중 어느 쪽이 진짜 원인인지 아래로 좁힐 수 있다(전부 읽기 전용, 배포 상태 변경 없음):

1. **Lambda 키 길이만 확인**(값 자체는 노출 안 함): `aws lambda get-function-configuration --function-name arcfire-arc-core-chat-turn --region ap-northeast-2 --query "length(Environment.Variables.ARC_CORE_CHAT_GROQ_API_KEY)"` — `0`이면 §4-1 확정.
2. **CloudWatch Logs**: `handler.ts:182-187`가 매 요청마다 `{"arcCoreChatTurn": "no_model"|"unauthenticated"|"ok", "textLen": N}`을 찍는다. 전량 `no_model`이면 §4-1, 전량 `unauthenticated`거나 로그 자체가 안 보이면(=요청이 서버까지 안 옴) §4-2 쪽.
   - 이번 세션 PowerShell 환경에는 `aws` CLI가 설치돼 있지 않아 위 두 확인을 직접 실행하지 못했다 — 김팀장 환경 또는 AWS 콘솔에서 확인 필요.
3. `__DEV__` 빌드라면 `cloudConversationalProvider.ts` 호출부인 `arcCoreChatReplyProvider.ts:79`가 이미 `console.log('[arcCoreChat] cloud', cloud.status)`를 찍는다 — 인게임에서 리로드 후 대화 1턴만 쳐도 Metro 로그에서 `unavailable`/`ok`/`free_tier_exhausted`가 바로 보인다. 가장 빠른 확인 경로.

### C. 부수 정리(원인 아니지만 발견됨, 낮은 우선순위)

`arcCoreChatReplyProvider.ts:38` 죽은 함수 `getArcCoreChatReplyProvider`와 stale 주석("클라우드는 Spark 기간 게이트 off") — 호출부 없음 확인됨, 삭제 또는 주석 정정 대상.

## 6. 지금 하지 않는 것 (라운드 1 시점 기준, 아래 라운드 2로 갱신됨)

이 문서는 분석·수정안 준비까지만이다. 대표님 지시대로 **김팀장이 이 영역을 계속 작업 중이므로 코드는 건드리지 않았다.** 김팀장 작업이 끝났는데도 재현되거나, 여러 차례 시도해도 못 고칠 때 — 그때 §5-A(권장 A-1) + §5-B 진단부터 순서대로 착수한다.

---

# 라운드 2 — 김팀장 수정 완료 후 재검수 (2026-09-09)

```text
status=ANALYSIS_ONLY (라운드 2)
trigger=대표님 — "김팀장 수정 완료. 전수 정밀 검사 + 최종 목표(인앱 NL) 재분석"
code_changes=NO (여전히 제안만 — 이 영역은 김팀장 활성 작업 범위, 임의 구현 안 함)
```

## 7. 라운드 1 판정에 대한 김팀장 재검수 결과 (요약, handoff 참고)

김팀장이 직접 실기(KeyLen=56·CloudWatch)로 확인: §4-1(배포 스크립트 결함)은 **AGREE**(A-1 반영 완료 — `deploy-groq-free-tier.ps1`·`llmInvoke.ts`·`handler.ts` 재확인 결과 실제로 고쳐짐, 아래 §8 재검증), 단 "지금 항상 no_key"라는 내 결론은 **DISAGREE** — 실측상 Lambda 키는 이미 존재(`KeyLen=56`)하고 CloudWatch에 `ok`(textLen 40/48)와 `no_model`이 **혼재**한다고 정정했다. 코드 재확인 결과 이 정정에 동의한다(AGREE) — §5-A/§5-B가 이미 코드에 반영돼 있음을 아래에서 직접 확인했다.

## 8. A-1 반영 여부 — 직접 재확인 (AGREE)

- `template.yaml` — `Parameters:` 섹션 여전히 없음(의도적), `ARC_CORE_CHAT_GROQ_API_KEY: ''` 하드코딩 유지(정상 — 배포 후 키 스크립트로 덮어씀).
- `deploy-groq-free-tier.ps1:33-44` — 이제 `--parameter-overrides` **줄 삭제됨**, `sam deploy` 직후 같은 스크립트 안에서 `set-groq-lambda-key.ps1`을 **자동 호출**하도록 고쳐져 있음(§5-A-1 그대로 반영). `.NOTES` 주석도 "always runs set-groq-lambda-key.ps1"로 갱신됨.
- `llmInvoke.ts:12,39` / `handler.ts:139-146` — `no_key`를 `no_model`과 분리된 별도 reason으로 클라까지 통과시키도록 수정됨. `handler.ts:186-194`에 매 요청마다 `hasKey: boolean` 진단 로그도 추가됨(민감정보 없이 상태만).
- `aws/arc-core-chat` 유닛테스트 `npx tsx --test src/handler.test.ts` **12/12 PASS**(신규 `no_key` 케이스 포함) — 직접 재실행해 확인.

**A-1 관련 판정: AGREE.** 라운드 1에서 지목한 배포 스크립트 결함은 코드 수준에서 정확하게 고쳐졌다.

## 9. 새로 발견 — 남은 간헐 `no_model`의 실제 원인 후보 (라운드 1엔 없던 발견)

김팀장 실측이 맞다면(키 있음 + `ok`/`no_model` 혼재), 원인은 이제 "키 누락"이 아니라 **Groq 호출 자체의 설계 결함**이다. 코드를 다시 정밀히 봤다.

### 9-1. `openai/gpt-oss-20b`는 추론(reasoning) 모델인데, 추론 토큰을 위한 여유가 없다 — 최유력

`groqInvoke.ts:3` `DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b'`, `groqInvoke.ts:24` `max_tokens: 256`. 그런데:

- Groq 공식 문서(console.groq.com/docs/reasoning, 직접 조회 확인) — gpt-oss-20b/120b는 `reasoning_effort`(`low`/`medium`/`high`, **기본값 medium**) 파라미터를 지원하고, **숨은 추론 토큰이 같은 토큰 예산(`max_completion_tokens`)을 그대로 소모한다.** 토큰이 추론 도중 바닥나면 **`content`에는 끊긴 채로 생성되던 내용이 그대로 남는다**(공식 문서 확인 문구).
- `reasoning_format`은 `raw`(추론을 `<think>…</think>`로 content에 포함) / `parsed`(별도 `reasoning` 필드로 분리) / `hidden`(최종 답만) 3가지가 있는데, **지금 코드는 셋 다 지정하지 않는다.** `extractGroqChatText`(`groqInvoke.ts:47`)가 이미 `<think>[\s\S]*?<\/think>` 스트립 정규식을 갖고 있다는 것 자체가 — 실제로 `raw` 형식(또는 그 기본값)으로 추론이 content에 섞여 나온 적이 있었다는 방증이다.
- 현재 파라미터 이름도 `max_tokens`인데 Groq 공식 파라미터명은 **`max_completion_tokens`**다(공식 문서 확인). 구 이름이 무시되는지 별칭 처리되는지는 문서상 불명확 — 어느 쪽이든 의도한 256 토큰 제한이 실제로 걸리는지 자체가 불확실하다.

**정확히 김팀장이 관측한 패턴과 일치하는 실패 시나리오**: 짧은 NPC 대사 하나에 `reasoning_effort=medium`(기본값)이 적용되면, 프롬프트 난이도에 따라 모델이 추론에 쓰는 토큰량이 매번 달라진다. 어떤 턴은 추론이 짧게 끝나고 답변이 나와 `ok`, 어떤 턴은 추론만으로 예산을 다 써버려 `<think>...</think>` 스트립 후 `content`가 완전히 빈 문자열이 되어 `groqInvoke.ts:88` `!text → { ok:false, reason:'upstream' }` → `llmInvoke.ts:40` `'no_model'`. **같은 키, 같은 배포로도 프롬프트마다 결과가 달라지는 게 정확히 "혼재"의 이유다.**

더 나쁜 케이스도 있다: 토큰이 **추론 도중(닫는 `</think>` 전에)** 바닥나면, 정규식이 열린 `<think>`를 못 닫힌 채로는 못 지우므로 **추론 원문(생각 과정 텍스트)이 스트립되지 않고 그대로 `content`로 통과**할 수 있다 — 이 경우 서버 검역(`quarantine.ts`)도 `<think`로 시작하는 문자열은 `SYSTEM_LEAK_RE`(`{`/`[`/toolResults/systemInstruction/백틱만 체크)에 안 걸려 **플레이어 화면에 모델의 생각 과정 원문이 그대로 노출될 위험**이 있다 — 아직 실기로 목격된 적은 없지만(김팀장 로그 확인 범위에선 `ok`/`no_model`만 언급), 코드상 막혀 있지 않다.

### 9-2. 원래 설계 문서와 실제 모델이 다르다 — 확인된 미문서화 변경

`tools/kim-team-lead/reports/READY_ARC_CORE_CHAT_FREE_TIER_NL.md:29` — "**1안 Groq Free** · 모델 `llama-3.1-8b-instant`". 이건 추론 없는 일반 instruct 모델이라 §9-1의 문제 자체가 구조적으로 없다. 그런데 실제 배포 코드(`groqInvoke.ts:3`)는 `openai/gpt-oss-20b`로 되어 있다 — 언제·왜 바뀌었는지 기록된 문서를 못 찾았다(사유 문서화 없음).

### 9-3. 클라 쪽 — `no_key`가 여전히 hard-skip 대상이 아님 (부수, 낮은 우선순위)

`arcCoreChatCloudResult.ts:65-68` `isArcCoreChatCloudHardFailReason`는 여전히 `'not_deployed'`만 hard-skip 처리한다. `'no_key'`는 실제로는 배포자가 고쳐야 하는 영구적 실패인데도 클라는 매 턴 그대로 재시도한다(사용자 경험상 어차피 로컬 폴백이라 무해하지만, 키가 다시 비는 사고가 나도 클라에서 즉시 티가 안 남 — 관측성 공백).

## 10. 수정안 (라운드 2, 제안만 — 미적용)

### D. Groq 호출 파라미터 정정 (최유력 원인 대응)

`groqInvoke.ts` `buildGroqChatBody`/`invokeGroqChat`에:

1. `reasoning_effort: 'low'` 추가 — 인게임 NPC 한두 문장 대사에 `medium`(기본값) 추론은 과함, 추론 토큰 소모를 최소화.
2. `reasoning_format: 'hidden'` 추가 — 최종 답만 받고 `<think>` 자체를 content에서 원천 배제. §9-1의 "빈 content"·"미종결 think 유출" 두 실패 모드를 **구조적으로 제거**하는 가장 확실한 방법(`raw`/`parsed` 후처리보다 안전).
3. `max_tokens` → **`max_completion_tokens`**로 파라미터명 정정(현재 이름이 실제로 적용되는지 불확실하므로 공식 이름으로 교체), 여유를 위해 256 → 320~384 정도로 소폭 상향 검토.

### E. (선택, 대표님/김팀장 판단 필요) 모델을 원래 설계대로 되돌릴지 결정

`llama-3.1-8b-instant`(비추론, 원 설계서 명시)로 되돌리면 §9-1 문제군 자체가 구조적으로 사라진다. `gpt-oss-20b`를 쓰기로 한 이유(답변 품질 등)가 있다면 D안으로 충분할 수 있음 — 어느 쪽이 맞는지는 이 분석만으로는 판단 근거 없음, 결정 필요.

### F. 클라 관측성 보완 (부수, 낮은 우선순위)

`isArcCoreChatCloudHardFailReason`에 `'no_key'`도 추가하거나, 최소한 `__DEV__` 로그에 reason별 카운트를 남겨 "키 사고"와 "추론 예산 소진"을 인게임에서도 구분할 수 있게.

## 11. 검증 방법 (코드 미변경, 관측만)

D안을 적용하기 전이라도, 다음 관측만으로 §9-1 가설을 확정할 수 있다 — 전부 읽기전용:

- CloudWatch에서 `no_model`이 뜬 요청 근처 시간대의 Groq 응답 바디(또는 Lambda 자체 로그에 `finish_reason` 임시 추가)로 `finish_reason: 'length'` 여부 확인 → `length`면 §9-1 확정.
- 또는 로컬에서 `ARC_CORE_CHAT_GROQ_API_KEY` 실 키로 `groqInvoke.invokeGroqChat`을 짧은/긴 프롬프트 여러 개로 반복 호출해 `content` 빈 값 비율 관측(이 세션 환경엔 실제 `gsk_` 키가 없어 직접 실행은 못 함).

## 12. 지금 하지 않는 것 (라운드 2 — 라운드 3에서 해제됨)

~~여전히 코드는 변경하지 않았다~~ → 대표님이 **"직접 해결하라"**로 명시 지시(2026-09-09) — 아래 라운드 3에서 §10-D를 코드로 적용했다.

---

# 라운드 3 — §10-D 구현 완료 (2026-09-09, 대표님 「직접 해결하라」 지시)

```text
status=PENDING (검수 대기 — commit은 김팀장)
code_changes=YES
scope=aws/arc-core-chat/src/groqInvoke.ts, aws/arc-core-chat/src/handler.test.ts
```

## 13. 적용한 변경

`aws/arc-core-chat/src/groqInvoke.ts`:

1. `max_tokens` → **`max_completion_tokens`**(Groq 공식 파라미터명)로 정정, 256 → **384**로 소폭 상향(여유분).
2. 모델명에 `gpt-oss`가 들어갈 때만(정규식 `REASONING_MODEL_RE = /gpt-oss/i`) `reasoning_effort: 'low'` + `reasoning_format: 'hidden'`을 body에 추가 — 최종 답만 받고 `<think>` 자체가 content에 섞이지 않게 함(§9-1의 "빈 응답"·"사고 과정 유출 위험" 둘 다 원천 차단). `llama-3.1-8b-instant`처럼 비추론 모델로 나중에 되돌리더라도 이 필드가 안 붙어 안전(Groq가 미지원 모델에 이 파라미터를 받으면 오류 낼 수 있어 방어적으로 게이팅).
3. `extractGroqChatText`의 `<think>...</think>` 스트립 정규식은 **그대로 유지**(방어적 이중 안전장치 — `reasoning_format` 미지정 상태로 롤백되거나 다른 추론 모델로 바뀌어도 여전히 동작).

`handler.test.ts`에 신규 테스트 2개 추가: gpt-oss만 reasoning 필드가 붙고 다른 모델엔 안 붙는지, `<think>` 스트립이 여전히 동작하는지.

## 14. Self-check

- `npx tsx --test aws/arc-core-chat/src/handler.test.ts` — **14/14 PASS**(신규 2건 포함, 기존 12건 무회귀).
- `npx tsx --test src/arcCore/chat/arcCoreChatCloudGate.test.ts src/arcCore/chat/arcCoreChatCloudResult.test.ts` — **3/3 PASS**(클라 게이트/결과 파서 무회귀).
- `npm run audit:arc-core-chat-billing`(`ARC_CORE_CHAT_BILLING_GOLIVE_ACK=1`·`ARC_CORE_CHAT_FREE_TIER_ACK=1`) — **PASS**(의도된 WARN만, ZERO_BILL 계약 무회귀).
- `npx tsc --noEmit`(aws/arc-core-chat 디렉터리) — `pack.ts:113`에 에러 1건이 있으나 **내 변경과 무관** — `git diff` 확인 결과 이번 변경분에 없던, 김팀장의 기존 미커밋 WIP에 이미 있던 타입 이슈(`worldWrite` 리터럴 `false`/`true` 비교). 내가 만진 `groqInvoke.ts`·`handler.test.ts`는 에러 0건.

## 15. 아직 안 한 것 — 배포 필요(이 세션에서 불가)

코드는 고쳤지만 **Lambda에 반영하려면 재배포가 필요**하다. 이 세션 환경엔 `aws` CLI가 없어 직접 배포 불가 — 김팀장/AWS 접근 권한 보유자가:

```powershell
cd tools/arc-core-chat
.\deploy-groq-free-tier.ps1 -GroqApiKey $env:GROQ_KEY
```

(A-1 반영으로 이 한 줄이 build→deploy→키 재주입까지 자동 처리한다.) 배포 후 CloudWatch에서 `no_model` 비율이 사라지는지, 또는 인게임에서 `[arcCoreChat] cloud ok`가 안정적으로 뜨는지 확인 필요.

---

# 라운드 4 — "여전히 템플릿·로그도 없다" 동시 재검수 (2026-09-09)

```text
status=PENDING (검수 대기 — commit·배포는 김팀장)
trigger=대표님 — "여전히 템플릿 대화고 수정사항 전혀 반영 안 됨 + 연결 확인할 로그 표시도 없음. 동시에 검수하라"
code_changes=YES (관측성 플러밍 — 로직 무변경)
```

## 17. "수정사항이 반영 안 됨" — 원인: 아직 배포가 안 됐다 (재확인, 새 증거)

- `git status` 재확인: `groqInvoke.ts`·`arcCoreChatCloudGate.ts` 모두 여전히 로컬 미커밋(`AM`) 상태 — 라운드 3 이후 아무도 배포하지 않았다.
- Lambda Function URL에 **직접 무인증 진단 요청**을 보내 도달성을 확인했다(과금 없음 — `handler.ts:120-121`이 토큰 없으면 Groq 호출 전에 즉시 반환): `POST https://2m3bcczmjq4u3bp334alda6j6a0drdpq.lambda-url.ap-northeast-2.on.aws/` → `200 {"fallback":true,"reason":"unauthenticated"}`. **Lambda 자체는 살아있고 정상 응답** — 엔드포인트 문제가 아니다. 다만 이 요청만으로는 배포된 코드가 라운드 3 수정 전/후 버전인지까지는 구분 불가(인증 통과해야 그 분기까지 감).
- **결론**: "반영 안 됨"은 새 버그가 아니라 **예상된 상태** — 코드 수정은 로컬에 있을 뿐, `deploy-groq-free-tier.ps1` 재실행 전까지는 Lambda가 예전 코드 그대로 돈다. 배포는 이 세션 권한 밖(아래 §20).

## 18. "로그 표시가 없다" — 원인: 애초에 인게임 UI 어디에도 연결 상태를 보여주는 요소가 없었다

코드를 다시 추적한 결과 **로그가 안 보이는 게 아니라 애초에 로그가 보일 자리가 없었다**:

- 유일한 진단 신호는 `arcCoreChatReplyProvider.ts:77-80`의 `if (__DEV__) console.log('[arcCoreChat] cloud', cloud.status)` — 이건 **Metro/adb 터미널에만** 찍히고, 인게임 대화창 UI(`ArcCoreChatOverlayContent.tsx`) 안에는 그걸 표시하는 요소가 전혀 없었다(`src/components` 전수 grep으로 재확인 — cloud/provider 상태를 그리는 컴포넌트 0건).
- 더 근본적으로: `completeArcCoreChatReply`가 반환하는 `providerId`(`'local'|'cloud'`)·`fallbackUsed` 값이 **UI까지 아예 전달되지도 않고 중간에 버려지고 있었다** — `arcCoreBackchannelReply.ts:14`(수정 전)가 `return result.text`로 문자열만 리턴, `presentArcCoreBackchannel.ts`의 `SubmitArcCoreBackchannelResult`도 `reply: string`만 노출. 즉 UI 컴포넌트 입장에선 애초에 cloud인지 local인지 알 방법이 코드 구조상 없었다 — "로그 표시가 없다"는 지적이 정확했다.

## 19. 적용한 변경 (관측성 플러밍, 로직 무변경)

1. `arcCoreBackchannelReply.ts` — `buildArcCoreBackchannelReply`가 `string` 대신 `{ text, providerId, fallbackUsed }`를 반환하도록 변경(호출부 1곳, `presentArcCoreBackchannel.ts`만 해당 — grep으로 다른 호출부 없음 확인).
2. `presentArcCoreBackchannel.ts` — `SubmitArcCoreBackchannelResult`에 `providerId?`·`fallbackUsed?` 필드 추가, `submitArcCoreBackchannelMessage`가 이 값을 그대로 통과시킴.
3. `ArcCoreChatOverlayContent.tsx` — `onSend` 완료 시 `__DEV__`에서만: (a) `console.log('[arcCoreChat] provider=', ..., 'fallback=', ...)`, (b) 로컬 state `lastDebug`에 저장해 **입력창 바로 위에 `[dev] cloud` / `[dev] local(fallback)` 작은 텍스트 배지**로 렌더. 대화 메시지 저장소(`useArcCoreChatStore`)는 건드리지 않아 저장/영속 상태에 영향 없음, `__DEV__` 게이팅이라 프로덕션 UX·카피 변화 없음.

**효과**: 다음 배포 이후, 개발 빌드에서 대화창 하단에 매 턴마다 실제로 cloud NL이 왔는지 로컬 템플릿 폴백인지 **그 자리에서 바로 보인다** — 더 이상 별도로 Metro 터미널을 지켜볼 필요 없음.

## 20. Self-check

- `npx tsc --noEmit -p tsconfig.client.json` — **0에러**(전체 클라 타입체크, 이번 변경 3개 파일 포함).
- 변경 함수 호출부 전수 grep 재확인 — `buildArcCoreBackchannelReply`·`submitArcCoreBackchannelMessage` 각각 호출부 1곳뿐, 누락 없음.
- 순수 플러밍(값 통과)이라 기존 동작 변경 없음 — 신규 유닛테스트는 생략(반환 타입 확장뿐, 별도 로직 없음).

## 21. 다음 단계 — 이 세션 밖에서 필요한 것

- **배포**: `tools/arc-core-chat/deploy-groq-free-tier.ps1` 실행 — 라운드 3(Groq 파라미터)·라운드 4(관측성)가 **아직 둘 다 로컬에만 있다.** 이 세션엔 `aws` CLI가 없어 못 함.
- 배포 후 개발 빌드로 인게임 대화 1턴 → 입력창 위 `[dev] cloud`/`[dev] local(fallback)` 배지로 즉시 확인 가능. `cloud`가 뜨면 라운드 3 수정이 실제로 효과가 있는지까지 같이 검증됨.

## 16. 지금도 안 한 것 (의도적으로 보류)

- §10-E(모델을 `llama-3.1-8b-instant`로 회귀) — **적용 안 함**. 확인 결과 그 모델은 2026-08-26부로 Groq 무료 등급에서 빠져 Enterprise 전용이 됐다(대표님도 "무료 한도 찾다가 gpt-oss로 바뀐 것"이라 확인) — 지금 `gpt-oss-20b`가 사실상 유일한 실질 대안이라 §10-D(파라미터 수정)만으로 충분하다고 판단.
- §10-F(클라 `no_key` hard-skip 추가) — 이번엔 손대지 않음. 지금 원인과 직접 관련 없는 부수 관측성 개선이라 범위를 벗어남. 필요하면 별도 지시 시 진행.
