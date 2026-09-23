# READY — 아크코어 대화 에이전트 기획 공동 검수 (코드 금지)

```text
status=READY
task_id=arc-core-backchannel-joint-review-20260814
assignee=김클로드
kind=DESIGN_REVIEW
code=FORBIDDEN
commit=FORBIDDEN
post_review=김팀장 전수 조사 (메모리·누적·채팅기록) — 구현 아님
```

대표님 지시(2026-08-14): 아크코어 대화 에이전트 **개발 내용(기획·연동 조사)** 을 김클로드가 **김팀장과 공동 검수**한다.  
김팀장 초안을 받아쓰지 말고, 코드·헌법으로 **독립 재검수**한 뒤 AGREE / PARTIAL / DISAGREE 를 handoff에 남긴다.

대표님 추가(같은 날): 검수가 끝나면 김팀장이 **대화채널 전체 전수 조사**(메모리·누적·채팅기록)를 한다. 김클로드는 구현하지 않는다.

---

## 0. 범위

| 할 일 | 하지 말 일 |
|--------|------------|
| 기획 정본·§10·**§11** 충돌/데이터 표를 **코드로 재확인** | `src/` · `app/` · `tables/` **어떤 diff도 금지** |
| 빠진 충돌·잘못된 전제·구현 시 구멍 지적 | 구현 착수 · git commit · 「완료」 선언 |
| handoff `PENDING` + 판정·근거(파일:줄) | 김팀장 문장을 그대로 동의만 하고 끝 |

**정본**: `docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md` **v0.3.1** (§11 포함)

---

## 1. 김팀장이 잡은 전제 (재검수 대상 — 맹신 금지)

1. 허브 **[대화]** → **명단**(아크코어 최상단 → 기존 NPC 우선순위) → NPC는 기존 `NarrativeDialog` · 아크코어만 채팅형 상호 대화.
2. 채널은 **전역 1 API** (`presentArcCoreBackchannel`). 허브·세션 시작·전투 후·퀘스트 등에서 같은 창.
3. 아크코어 **입** = 대화. **몸**(12좌·배치·드론)은 상태 **읽기만**. 대화로 운용 변경 없음.
4. 자리는 13번째 서브코어가 아니라 **본체(`eternal_throne`) 대화면**.
5. 로그 40건·500자·덮어쓰기. STAGE 이탈 시 패널 dismiss. 전투는 Skia dispose 후만.

대표님 확인(2026-08-14): 「입은 대화, 물리는 상태 정보만 연동. 시스템 운용을 대화에서 바꿀 필요는 없다.」

---

## 2. 반드시 직접 읽을 코드

| 축 | 경로 | 검수 질문 |
|----|------|-----------|
| 허브 [대화] | `app/(game)/planet.tsx` `openPlanetHubNpcDialog` · `src/game/planetHubNpcDialog.ts` | 명단으로 바꿔도 스파이 자동오픈·메인스토리 수락·배지 ack가 깨지는가 |
| 스크립트 창 | `src/game/ingameDialog/` · `NarrativeDialogRow` | 채팅과 축 분리 주장이 맞는가. 동시 오픈 시 누가 이기는가 |
| 오버레이 | `src/ui/overlay/arcOverlayStore.ts` `present`/`resolvePendingArcOverlaysForStageExit` · `app/_layout.tsx` Host | 스택 append·STAGE 이탈 가림(7/6) · 신규 kind 2개가 chrome/Host/감사에 필요한가 |
| 미션 체인 | `src/missions/missionPlanetHubSync.ts` · `transitCombatPostFlow.ts` | 클리어 대사·보상·레벨업 사이에 채널이 끼면 유실되는가 |
| 12좌 | `src/arcCore/subcores/registerDefaultArcSubCores.ts` · world nodes CSV | 13좌 금지 주장이 맞는가. 이리스 뉴스보드와 창을 합치면 안 되는가 |
| 명령·배치 | `ArcCoreCommandBus.ts` · `runArcCoreDailyOpsBatch` · `continueSessionPrewarm.ts` | 채팅 write 금지가 충분한가. `session_start`를 prewarm에 두면 타이틀 회귀인가 |
| 섀도우 | `arcCoreShadowReveal.ts` · §16-A | 채팅에 닉네임/스냅샷이 샐 구멍 |
| persist | `localAccountReset.ts` · `gameSaveBackupKeys.ts` · `reloadAllLocalGameSaveStores` | 신규 스토어 누락 시 초기화 잔존·복구 후 메모리 미동기화 |

§10 C1~C20 · **§11 M/A/D** 를 한 줄씩 AGREE/DISAGREE. 빠지거나 틀린 ID가 있으면 추가.

---

## 3. 산출 (handoff PENDING)

`tools/kim-team-lead/reports/kim-claude-handoff-pending.md` **맨 위**에:

```text
status=PENDING
task_id=arc-core-backchannel-joint-review-20260814
kind=DESIGN_REVIEW
code_changes=NO
verdict=AGREE|PARTIAL|DISAGREE
```

필수 본문:

1. **총평** 5줄 이내 — 기획을 구현해도 되는가 / 막아야 하는가  
2. **§10 C1~C20** 표 — 각 ID + AGREE/PARTIAL/DISAGREE + 파일:줄  
3. **§11 메모리·누적·채팅기록** — 빠진 가드가 있으면 문장으로  
4. **김팀장 전제 정정** — 틀렸거나 부분적인 항목만 (근거 필수)  
5. **구현 전 추가 가드** — 문서에 넣을 문장(김팀장이 설계 문서에 흡수)

문서(`docs/ARC_CORE_...`)는 김클로드가 **직접 고치지 않는다**. 수정안은 handoff에만. 김팀장이 흡수한다.

대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내.  
이후 전수 조사·구현은 김팀장 본창이 한다.

---

## 4. 금지

- 게임 코드·CSV 수정
- 온디바이스 LLM / 명령버스 `player_chat` / 13번째 SubCore 제안으로 **구현**
- git commit
- 김팀장 §10·§11을 읽기만 하고 코드 미확인한 채 AGREE

---

## 5. 김클로드 호출 문장 (대표님 · Cursor ✱ / `claude`)

```text
@김클로드 tools/kim-team-lead/reports/kim-claude-ready-arc-core-backchannel-joint-review.md 읽고
docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md v0.3.1 아크코어 대화 에이전트 기획을
김팀장과 공동 검수하라. 코드·CSV 수정 금지. git commit 금지.
§10 C1~C20과 §11 메모리·누적·채팅기록을 코드로 재확인한 뒤
kim-claude-handoff-pending.md 맨 위에
status=PENDING · verdict=AGREE|PARTIAL|DISAGREE 로 올려라.
```
