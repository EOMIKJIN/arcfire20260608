# 김플레이 → 김팀장 인계 — 스텔라 0단계 · O1·O2 관찰 입력

- **status**: REVIEWED
- **task_id**: `stella-known-colleague-o1o2-20261006`
- **근거**: 대표님 결정 2026-10-06 — 1안(김플레이 주도 · 범위 개방 · 단계마다 김팀장 검수·커밋), 라이프 전달 (가) 읽기 도구, 우선순위 병행(O1·O2 먼저)
- **설계 정본**: `docs/playbot/STELLA_KNOWN_COLLEAGUE_DESIGN_v1.md` Part B · `docs/playbot/STELLA_IMPL_FEASIBILITY_20261006.md`
- **커밋 안 함** — 검수 후 김팀장 커밋
- **일괄 검수 목차**: `tools/kim-team-lead/reports/kim-play-review-request-all-designs-20261006.md` (8번 건)

## 1. 무엇을 했나

| 단계 | 내용 |
|---|---|
| 0 | 스텔라 라이프(지금·기분·어제·이야기·기억)가 LLM 에 한 번도 안 갔다. 서버 `pack.ts` 와 로컬 경로 모두 `lifeBlock` 을 읽지 않는다. 같은 재료를 읽기 도구 결과 `get_stella_now` 로 실어 보낸다 (≤6키 · 값 ≤80자 · 도구 4개 상한 안에서만). 서버 재배포 없음. |
| O1 | 플레이어 행동 관찰 sink `src/game/playerObserve/playerObserveSink.ts` — import 없음 · 링 64칸 사전 할당 · 하루 요약(동사별 횟수, 연패, 같은 행성 연전, 파괴 횟수, 첫 경험 비트, 눈에 띄는 사건 ≤4, 지난 2일). `emitPlayVerb` 가 출시 빌드 포함 항상 sink 에 기록한다. console 출력은 기존처럼 `__DEV__` 만. |
| O2 | 요약을 대화 store 같은 저장 키의 새 필드 `observe` 로 저장 (자기 상한 512B, 스텔라 life 3KB 클램프와 분리). 새 AsyncStorage 키 없음. 눈에 띄는 사건(함선·편입·퀘스트 완료·파괴·레벨·첫 개발)과 착륙 때만 기존 1.5s 코얼레싱 persist. 계정 초기화 시 `resetLocal` 에서 같이 비운다. |
| 방출 | `playerStore.landOnPlanet` → `land`(행성이 바뀔 때만) · `addExp` → `level`(레벨업 때만). |

## 2. 변경 파일

| 파일 | 종류 |
|---|---|
| `src/game/playerObserve/playerObserveSink.ts` | 신규 |
| `src/game/playerObserve/playerObserveSink.test.ts` | 신규 (8건) |
| `src/game/devPlayVerbLog.ts` | sink 기록 추가 · `PlayVerb` = 관찰 동사 16종 |
| `src/store/arcCoreChatStore.ts` | `observe` 필드 · normalize · persist · 빈값 판정 · hydrate 병합 · reset · flush 연결 |
| `src/store/playerStore.ts` | `land` · `level` 방출 2줄 |
| `src/arcCore/chat/bindStellaLifeAskToPlanetSession.ts` | §3 결함 수정 |
| `src/arcCore/chat/stellaLifePack.ts` · `arcCoreAgentPack.ts` · `stellaLifePack.test.ts` | 0단계 |

## 3. 같이 고친 기존 결함 — 검수 시 판단 부탁

대화 store 는 대화창을 열 때(`presentArcCoreBackchannel`)에만 hydrate 된다. 허브 진입 라이프 선제(`bindStellaLifeAskToPlanetSession`)는 그 전에 판정하므로 `operatorIntroPlayed=false` 로 읽혀 **앱을 켤 때마다 대화창을 한 번 열기 전엔 스텔라가 먼저 묻지 않는다**. 허브 진입 때 `ensureHydrated()` 후 판정하도록 바꿨다. 타이틀 화면 경로가 아니고, 대화창 첫 오픈 때 하던 같은 읽기를 앞당긴 것이다.

**체감 변화**: 앱 재시작 후 첫 허브 진입에서도 스텔라 하루 1회 질문이 설계대로 나올 수 있다.

같은 원인으로 남은 위험 (이번에 안 고침):
- 대화 store `persist` 는 hydrate 여부를 확인하지 않는다. 다른 경로가 hydrate 전에 `touchPersist` 를 부르면 디스크 대화가 빈 값으로 덮일 수 있다. 관찰 flush 는 hydrate 후에만 연결해 이 경로를 피했다.

## 4. self-check

```text
[pss-pre-dev] hot_path=플레이어 행동 1회당 O(1) · 허브 진입 1회 hydrate · 틱 0
[pss-pre-dev] alloc=이벤트당 짧은 부분 문자열 ≤2 · 링 64 사전 할당 · persist=기존 1.5s 코얼레싱 · 새 키 0
[pss-pre-dev] risk=P1·P4(sink 무의존)·P6 · verdict=PASS
```

- `npx tsc --noEmit -p tsconfig.client.json` PASS
- `npx tsx --test src/game/playerObserve/playerObserveSink.test.ts src/arcCore/chat/stellaLifePack.test.ts` 12/12 PASS
- `npm run audit:memory:all` PASS
- 실기 미확인 — 확인 경로: 앱 시작 → 행성 착륙 → 무역·전투 몇 번 → 앱 종료·재시작 → 허브 진입 (스텔라 질문 여부 · 대화 기록 유지)

## 5. 손대지 않은 것

- `app/(game)/planet.tsx`
- `playerSurvivalPod.ts` · `durabilityModel.ts` · `shipyard.tsx` — 김팀장 G6 작업 중. `destroy`·`repair`·`equip` 방출은 G6 커밋 후.
- 플레이봇 수집기 — 모르는 동사는 무시하므로 `land`·`level` 이 logcat 에 나와도 안전. 착륙은 이미 `[MEM_PROFILE]` 에서 뽑으므로 중복을 피해 추가하지 않음.

## 5-A. 김팀장 검수 후 추가분 (2026-10-06 · 잠금 2 · D1)

**잠금 2 — hydrate 전 persist 금지**

- `src/store/arcCoreChatPersistGuard.ts` `canPersistArcCoreChat(hydrated, …)` + 테스트 1건. `arcCoreChatStore.persist()` 첫 줄 가드.

**D1 — 봇과 앱이 같은 행동 문자열**

| 파일 | 내용 |
|---|---|
| `src/game/playerObserve/playerObserveDetail.ts` (신규) | detail 형식 정본 — 순수 함수. 앱 방출 지점은 **안 바꿈** (missionStore 등 타인 미커밋 변경과 섞지 않으려고). 대신 소스 스캔 테스트가 앱 17곳 형식을 이 정본과 대조 |
| `tools/play-bot-console/src/observeVocab.ts` (신규) | `BOT_OBSERVE_COVERAGE` (동사 16종 전부 — 봇이 만드는지 / 안 만드는 이유, 새 동사 추가 시 컴파일 실패) · `noteObs` · `takeObs` |
| `types.ts` | `JournalEntry.obs?` · `WorldState.obsPending?` (상한 8) · `obsLand?` |
| `actions.ts` · `progress.ts` · `world.ts` · `combatEfficiency.ts` | 행동 순간 `noteObs` — 전투 (`transit`/`hub_orbit` : `win`/`lose`, 패배면 `destroy` 이어서) · 착륙 (행성 바뀔 때만, 앱과 같음) · 레벨 · 퀘스트 수락/세부/완료 · 매매 6곳 · 채굴 · 위성·개발 착공 (`install`/`upgrade`) · 편입 · 스킬 · 장비 · 함선 |
| `run-harness.ts` | `emit()` 에서 `takeObs` → 저널 줄에 `obs` 첨부. 포장된 줄(조우·퀘스트 격파)도 행동 순간에 쌓으므로 유실 없음 |
| `play-bot-console.test.ts` | D1 테스트 2건 (아래) |

- 봇이 만들지 않는 동사: `scan` · `talk` · `repair` · `session` — 커버리지 표에 이유 기록.
- `destroy` 형식(`cause`)은 G6 앱 방출 전 선확정. 김팀장 G6 방출 시 `playerObserveDetail.destroy('combat')` 사용 권장.

```text
[pss-pre-dev] hot_path=봇 행동 1회당 push 1~2 · 앱 런타임 0 (playerObserveDetail 은 앱이 아직 import 안 함)
[pss-pre-dev] alloc=Node 트윈 전용 · 저널 줄당 obs 배열 ≤8
[pss-pre-dev] risk=없음(앱 STAGE·persist 무관) · verdict=PASS
```

- `npm run playbot:test` PASS — 신규 「D1 앱 emitPlayVerb 방출 형식 = 봇 obsDetail 형식」(앱 소스 스캔 ≥15곳) · 「D1 봇 행동 문자열이 앱 관찰 다이제스트를 그대로 움직인다」(봇 600걸음 → 앱 `recordPlayerObserve` → 동사별 카운트·`lastLand` 일치, 패배 뒤 `destroy`)
- `npx tsc --noEmit -p tsconfig.client.json` PASS · sink·persistGuard 테스트 10/10 PASS
- 참고: 봇 새 월드에서 초반 서사 잠금(`earlyFeelClosed=false`)이면 600걸음 중 596이 같은 대기 줄 — 하네스는 따로 풀므로 실제 실행엔 영향 없음. 테스트는 잠금을 풀고 시작.

## 6. 다음 (검수 후)

O3 상황 CSV·감지기·게이트 (전부 `enabled=0`, 잠금 1~8 준수) → O4(=D3) 봇 빈도 재생 — 저널 `obs` 로 앱 sink 를 그대로 돌림 → D2 `botVersion` → O5 (목업 후) · 병행 A-9.

## verdict (김팀장 기입)

- **REVIEWED (2026-10-06)** — 0단계 · O1 · O2 · 잠금 2 · D1 수용. 커밋은 대표님 요청 후.
- 수정 1건: 연패(`loss`)가 날짜가 바뀌어도 남던 것. `rollDay`에서 0으로 지우고, 디스크 병합도 같은 날만 더한다. 테스트 1건 추가. sink·persistGuard·life pack 15/15 PASS.
- 잔여 (이번 단계 밖): 오프라인 템플릿은 `get_stella_now`를 문장에 아직 안 씀(클라우드 프롬프트에는 들어감). 봇은 패배마다 `destroy`를 붙이지만 앱 방출은 G6 커밋 후. O3의 걱정 상황은 그 방출 전 `enabled=0`. 도구 4칸이 차면 라이프는 그 턴에 빠진다.
