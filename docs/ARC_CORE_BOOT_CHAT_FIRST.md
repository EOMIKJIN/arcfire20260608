# 아크코어 선실행(부트 채팅) — 구현 대기 정본

> **상태**: **예약 · 플래그 OFF** (2026-08-21) — `ARC_CORE_BOOT_CHAT_FIRST=false`. 타이틀 버튼 즉시. 선제 실기동은 허브 `inbound_request` (`대화형_아크코어_구현.md` §0-D·§0-F)  
> **작성**: 2026-08-18 · 김팀장 세션 합의 · **정합**: 2026-08-21  
> **채널 정본**: `docs/대화형_아크코어_구현.md` (충돌 시 그쪽 우선. 본 문서는 **선실행 게이트만**)

구현 지시: `@김팀장 docs/ARC_CORE_BOOT_CHAT_FIRST.md 대로 선실행 게이트만 넣어. 타이틀/시작/이어하기 본체는 건드리지 마.`

```text
[pss-pre-dev] hot_path=부트 1회 present + 전송 1회 + 진입어 1회
[pss-pre-dev] alloc=기존 채팅 세션 1 · 플래그 상수 1 · setTimeout 없음
[pss-pre-dev] cache=chat persist 기존 1.5s · 허브/Skia 선마운트 금지
[pss-pre-dev] stage=타이틀 앞 pre-STAGE · dispose=채팅 dismiss 후 기존 타이틀
[pss-pre-dev] verdict=PASS — 플래그 OFF면 현행 경로만
```

---

## 0. 한 줄

앱 얼굴은 **아크코어 입**. 세상 진입·진행은 **지금 타이틀/시작하기/이어하기 몸**.  
플래그로 켜고, 끄면 **현재 프로세스 그대로**.

---

## 1. 잠금 (구현 시 변경 금지)

| # | 잠금 |
|---|---|
| 1 | 입≠몸. 채팅이 계정·크레딧·언락·점유·배치를 쓰지 않음 |
| 2 | 입구 1개 `presentArcCoreBackchannel`. 타이틀용 채팅 창 복제 금지 |
| 3 | 시작화면 최소 활성. 선실행 대기에 일일배치·catch-up·prewarm·풀 CSV 금지 |
| 4 | 무거운 합류는 계속 `runContinueSessionPrewarm` / `continue-warp` |
| 5 | NPC는 스크립트. 선실행은 아크코어만 |
| 6 | 자연어 = 유료 LLM 토큰(후속). 선실행·「시작한다」는 **로컬**로도 성립 |
| 7 | AWS는 문장 벤더 선택. 선실행 게이트의 전제 아님 |

---

## 2. 플래그 (원복 스위치)

권장 위치: `src/arcCore/chat/arcCoreBootChatFirstGate.ts` (신설, 이 파일만 OFF)

```ts
/** false = 현행 타이틀 프로세스만. true = 선실행 채팅 후 타이틀 */
export const ARC_CORE_BOOT_CHAT_FIRST = true;
```

| 값 | 동작 |
|---|---|
| `false` | `app/index.tsx` 지금과 동일. 선실행 코드는 dead path |
| `true` | JS 첫 프레임에서 아크코어 전면 채팅(부트 대기 없음) → 「시작한다」→ 지금 타이틀 |

원격 설정·CSV는 1차에 넣지 않음. 상수 1개면 원복 가능.

---

## 3. 프로세스

### 3-1. 현행 (플래그 OFF · 바꾸지 말 것)

```text
스플래시 → bootReady+hydrate → 타이틀(이어하기/시작하기)
  → 시작하기: intro → 닉네임 → 허브
  → 이어하기: continue-warp prewarm → 허브
```

### 3-2. 선실행 (플래그 ON)

```text
JS 첫 프레임
  → presentArcCoreBackchannel({ reason: 'session_start', immediate: true, dismissOnBackdrop: false })
  → 전면 채팅(자판·커서). 타이틀 크롬 숨김. dismissOnBackdrop=false
  → 백그라운드: 기존 _layout 부트 → titleInteractive (버튼은 채팅에 묶지 않음)
  → 로컬 진입어 「시작한다」(시작해/start 등)
  → 채팅 dismiss → 지금 타이틀 (이미 titleInteractive면 대기 없음)
  → 이후 3-1 그대로
```

선실행 중 부트/hydrate/일일배치는 **타이틀 게이트 뒤에서만**. 타이틀 버튼을 채팅·배치 완료에 묶지 않음.  
허브·Skia·행성 STAGE를 선실행 밑에 깔지 않음.  
차원항로 prewarm은 이어하기 때만.

---

## 4. 「시작한다」 계약

- **선실행 화면에서만** 가로챔. 허브/전투 채팅에서 타이틀로 돌아가면 안 됨
- 클라 로컬 검사. LLM·월드 write 아님
- 하는 일: 채팅 닫고 **시작화면 표시**. 계정 생성은 타이틀의 시작하기/이어하기
- 신규/기존 분기는 타이틀이 이미 함

---

## 5. LLM 이후 (이 작업에서 하지 말 것)

같은 `completeArcCoreChatReply` + 팩 + 검역 + 폴백.  
게임 시스템·진행은 로컬 유지. 선실행 게이트를 재설계하지 않음.  
`ARC_CORE_CHAT_CLOUD_LIVE`·AWS URL은 **별도 토큰 지시** 때.

---

## 6. 구현 체크리스트 (지시 시)

1. `arcCoreBootChatFirstGate.ts` — 상수 기본 **`true`** (원복은 이 파일만 false)
2. `app/index.tsx` — JS 마운트 즉시 present 1회(부트당). `titleInteractive`를 기다리지 않음. OFF면 early return
3. 선실행 중 `dismissOnBackdrop=false` (present 옵션 또는 해당 present만)
4. `submit` 경로 앞단: 선실행 세션일 때만 진입어 → dismiss → 타이틀 크롬 복귀
5. `reason: 'session_start'` 재사용. 타이틀 버튼·prewarm 게이트 **미수정**
6. `npx tsc --noEmit -p tsconfig.client.json`
7. 검수: OFF=현행 타이틀 · ON=채팅→시작한다→타이틀 버튼 즉시

---

## 7. 금지 (지시 시에도)

- `index.tsx` 부트/titleInteractive 의미를 채팅 대기로 바꿈
- 시작하기/이어하기/intro/continue-warp 로직을 채팅 안으로 흡수
- 선실행용 두 번째 채팅 UI
- 모델 툴로 createPlayer / replace 허브
- 플래그 기본값을 true로 몰래 켜기 (대표님 지시 전)

---

## 8. 수락 문장 (검수)

- OFF: 지금과 같이 타이틀부터
- ON: 채팅(자판) → `시작한다` → 타이틀 이어하기/시작하기
- ON이어도 일일배치 때문에 채팅·타이틀이 잠기지 않음
- 허브에서 `시작한다`를 쳐도 타이틀로 안 감
