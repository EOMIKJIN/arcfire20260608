# 김플레이 → 김팀장 · 2026-10-06 전체 설계안 정리 · 일괄 검수 요청

- status: **PENDING**
- **요청자**: 김플레이 (대표님 지시 2026-10-06 19:59 「현재까지 모든 설계안을 정리하고 김팀장 검수를 요청하라」)
- **커밋**: 전부 미커밋. 검수 후 김팀장이 커밋 (아래 §6 권장 묶음)
- **기존 인계 파일은 그대로 유효** — 본 파일은 목차·질문 모음이다. 상세는 각 링크.

---

## 1. 한눈에

| # | 건 | 종류 | 정본 | 상태 | 김팀장이 할 일 |
|---|----|------|------|------|----------------|
| 1 | 플레이봇 전수 감사 + 개선 A-1~A-8 + 실기 학습 로그 B-1 | 코드(봇) · 코드(src 학습 로그) | `docs/playbot/PLAYBOT_FULL_AUDIT_20261006.md` · `kim-play-report-playbot-audit-20261006.md` | **PENDING_REVIEW** (오전부터) | B-1 diff 검수 · A 항목은 참고만 |
| 2 | 플레이봇 3단 개선 프로세스 (+ §5-B 스텔라 칸) | 운영 설계 · 봇 코드 | `docs/playbot/PLAYBOT_THREE_LANE_PROCESS.md` | 가동 중 · 검수 기록 없음 | 김팀장 역할(3단) 정의 확인 |
| 3 | PB-G 2차 (G4~G7) | 게임 개선 요청 | `kim-play-handoff-pbg-2nd-20261006.md` | **REVIEWED** (G5 보류) | 없음 — 목록용. G6 커밋 시 김플레이에게 알림 필요(§4-6) |
| 4 | 인게임 오토모드 검토안 | 기획 검토 | `docs/playbot/인게임오토모드_기획설계_보고서.md` | 검토안 · 코드 0 | 방향 확인만 (0단계 = 스텔라 조언과 같은 자산) |
| 5 | 스텔라 「아는 동료」 설계 v2 (Part A 조언 · B 관찰 · C 능동 · D 봇→스텔라 연결) | 기획·런타임 설계 | `docs/playbot/STELLA_KNOWN_COLLEAGUE_DESIGN_v1.md` | 대표님 방향 승인 · 세부값 일부 대표님 결정 대기 | **런타임 계약 검수** (§3) |
| 6 | 스텔라 구현 실현성 전수 조사 + 대표님 결정 (1안 등) | 조사 · 범위 결정 | `docs/playbot/STELLA_IMPL_FEASIBILITY_20261006.md` §6-1 | 대표님 결정 완료 | **김플레이 수정 범위 개방 확인** (§4-1) |
| 7 | 스텔라 캐릭터 정본 개정 (§17 재작성 · D6(c) · §16-2) | 정본 문서 | `docs/character/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md` | 대표님 방향 승인 | 대화 정본과 충돌 없는지 확인 |
| 8 | 스텔라 0단계 (라이프 전달) + O1·O2 (관찰 입력) | **코드 (src)** | `kim-play-handoff-stella-o1o2-20261006.md` | **PENDING** | **diff 검수 · 커밋** |

---

## 2. 건별 요약

### 1 · 플레이봇 전수 감사 (오전)
- 봇 벽은 「콘텐츠 끝」이 아니라 첫 함선 25만cr 자금. 봇 개선 후 1,200일 평균 L27→30 · 본편 11→13 · 연료 −85%.
- B-1: 대표님 지시(직접 로그 수집 · 출시 제외) 미이행분 — 채굴·스캔·퀘스트 완료·대화·시설 개발 `[PLAY_VERB]` 방출 5종. 파일: `devPlayVerbLog.ts` · `systems/mining/service.ts` · `tryPresentScanToMainQuestDialog.ts` · `missionStore.ts` · `ingameDialogCompletion.ts` · `planetDevelopment*` 3개 · `planetDefenseSatelliteDevelopment.ts`.
- **주의**: `devPlayVerbLog.ts` 는 8번(O1)에서 다시 바뀌었다. 검수는 최신본으로 한 번에 — console 은 여전히 `__DEV__` 만, 대신 관찰 sink 기록은 출시 포함 항상.

### 2 · 3단 프로세스
- 1단 김플레이(봇) · 2단 플레이봇 자체 학습 · 3단 대표님·김팀장(게임). 감시판 30분 · 벤치 일 1회 · 상태 변화 시 채팅 알림.
- 오늘 추가 §5-B: 봇 벤치 통과 → 스텔라 재검증 → 통과 후보만 `PB-S` 항목으로 3단에 올림.

### 4 · 인게임 오토모드
- 결론: 0단계 조언 → 1단계 자동 태세 → 2단계 반복 루틴(상한). 3단계 완전 자동은 비권장. 착수 전제: 봇 챕터1 안정 완주 · A-10 · PB-G2.
- 0단계는 스텔라 Part A 의 `resolvePlayAdvice` 와 같은 판정기를 버튼으로 보여 주는 것 — 두 기능이 판정기 하나를 공유.

### 5 · 스텔라 「아는 동료」 v2
- **Part A 조언**: 봇이 수천 일로 검증한 판단 규칙을 CSV 로, 대표님이 물으면 대표님 상태에 대어 한 가지만 말함. 숫자·가격 금지. 근원체 입은 조언 없음.
- **Part B 관찰**: 봇이 `[PLAY_VERB]` 로 읽는 행동을 출시 앱에서도 받음 — 메모리 링 + 하루 요약만, 내보내기 없음.
- **Part C 능동**: 결정 순간(허브 진입·복귀·세션 시작·대화 닫힘)에만 상황 판정 → 선 질문 / 선 연락(미읽음) / 말걸기(허브 한 줄). 하루 방해 예산을 근원체 inbound 와 공유.
- **Part D 연결**: 봇 성능을 충실도·판단력·사람다움 셋으로 나눔. 능동 빈도는 사람다운 세션으로만 잼. 후보는 지금 표보다 나을 때만 올림. 봇과 앱이 같은 detail 문자열·같은 파서·같은 순수 모듈 사용.
- 단계: O1·O2(완료) → D1 → O3 → O4/D3 → D2 → O5 → O6 → O7·D5 · Part A 는 K1(봇 정합, A-9 선행) 이후.

### 6 · 실현성 조사 · 대표님 결정
- 1안: 김플레이 주도, §4-1 파일 범위 개방, 단계마다 김팀장 검수·커밋.
- 라이프 미전달 결함 → (가) 읽기 도구로 수정 (서버 재배포 없음).
- 우선순위: 관찰 입력 먼저, 이어 A-9 병행.

### 8 · 코드 (상세는 handoff)
- 0단계: 스텔라 라이프가 LLM 에 한 번도 안 가던 결함 — 서버·로컬 모두 `lifeBlock` 을 읽지 않음 → 같은 재료를 읽기 도구 `get_stella_now` 결과로 전달.
- O1·O2: `src/game/playerObserve/playerObserveSink.ts` (import 없음 · 링 64 · 하루 요약 512B) · 대화 store 같은 키 별도 필드 `observe` · `land`/`level` 방출.
- 같이 고친 결함: 대화 store 지연 hydrate 탓에 허브 진입 라이프 선제가 대화창을 열기 전엔 항상 막힘 → 허브 진입 시 `ensureHydrated()` 후 판정.
- 게이트: tsc PASS · 테스트 12/12 · `audit:memory:all` PASS · 실기 미확인.

---

## 3. 런타임 계약 — 김팀장 검수 포인트 (설계 5·코드 8)

| # | 계약 | 위치 | 확인 부탁 |
|---|------|------|-----------|
| C1 | 읽기 도구 상한 (도구 ≤4 · 키 ≤6 · 값 ≤80자) 안에서 `get_stella_now` 가 기존 도구를 밀어내지 않음 | `arcCoreAgentPack.ts` | 4개 꽉 찬 주제에서 라이프가 빠지는 쪽이 맞는지 |
| C2 | 대화 store 저장 형태 확장 (`observe`) · 스키마 버전 그대로 | `arcCoreChatStore.ts` | 구세이브 normalize · 빈값 판정 · purge 경로 |
| C3 | 관찰 flush 는 hydrate 뒤에만 연결 | 같은 파일 `connectPlayerObserveFlush` | 아래 R1 위험과 함께 |
| C4 | 허브 진입마다 대화 store hydrate (1회/프로세스, 이후 즉시 resolve) | `bindStellaLifeAskToPlanetSession.ts` | 타이틀·부트 경로 아님 확인 · STAGE 1 진입 비용 |
| C5 | 봇이 import 할 앱 모듈은 RN·store 없는 순수 모듈 · 시간은 인자 | Part D D-5 | O3·K2 검수 기준으로 채택 여부 |
| C6 | 말걸기(remark) = `ArcOverlayHost` 경유 **신규 비차단 kind** | Part C C-5 | 오버레이 계약상 허용 여부 · 시안은 O5 때 |
| C7 | 새 백채널 이유 `operator_observe` · 근원체 inbound 와 하루 예산 공유 · 15분 간격 | Part C C-4 | 근원체 상수(45–90초·8–15분)는 안 건드림 |

---

## 4. 김팀장 결정·확인 질문

1. **범위 개방 확인** — 대표님 1안에 따라 김플레이가 `src/arcCore/chat/**`(스텔라 관련) · `src/store/arcCoreChatStore.ts` · `src/game/playerObserve/**` · 방출 지점 1~2줄 · 스텔라 CSV 빌드 연결을 직접 고친다. 각 단계 PENDING → 김팀장 검수·커밋. 이의 있으면 범위 지정 부탁.
2. **R1 대화 store persist 위험 (기존 결함)** — `persist()` 가 hydrate 여부를 보지 않는다. 다른 경로가 hydrate 전에 `touchPersist` 를 부르면 디스크 대화가 빈 값으로 덮인다. 고치는 쪽: 김팀장 직접 / 김플레이 범위 포함 중 선택.
3. **C4 체감 변화 확인** — 앱 재시작 후 첫 허브 진입에서도 스텔라 하루 1회 질문이 설계대로 나온다. 미커밋 `presentStellaLifeAskComm.ts` 변경(김플레이 것 아님 — 팝업 열리는 순간 오늘 질문 소진)과 같이 보면 하루 1회가 지켜지는지 확인 부탁.
4. **B-1 + O1 학습 로그** — release logcat `[PLAY_VERB]` 0건 확인은 출시 전 1회. 관찰 sink 는 출시 포함(대표님 v2 승인)이며 외부로 나가는 경로 없음.
5. **커밋 묶음** — §6 제안대로 나눠도 되는지.
6. **G6 커밋 알림** — `playerSurvivalPod.ts` · `durabilityModel.ts` 커밋되면 김플레이가 `destroy`·`repair` 방출을 붙인다(`shipyard.tsx` `equip` 포함). 그 전엔 손대지 않음.

## 5. 대표님 결정 대기 (김팀장 몫 아님 · 참고)

- 스텔라 §11-3: 방해 예산 초기값 · remark 시안 · §16-2 개정 · 침묵일 20–60% — O3·O5 착수 전.
- PB-G2 교역 차익 · PB-G3 챕터1 레벨 — 기존값.
- PB-G5 함선 등급 곡선 수치.

## 6. 커밋 권장 묶음

| 묶음 | 파일 |
|------|------|
| ① 실기 학습 로그 B-1 | `src/systems/mining/service.ts` · `src/game/ingameDialog/tryPresentScanToMainQuestDialog.ts` · `src/game/ingameDialog/ingameDialogCompletion.ts` · `src/store/missionStore.ts`(동사 방출분) · `src/game/planetDevelopment/planetDevelopmentActionOptions.ts` · `planetGenericFacilityDevelopment.ts` · `planetOrbitShipyardDevelopment.ts` · `src/systems/planetaryDefense/planetDefenseSatelliteDevelopment.ts` |
| ② 스텔라 0단계 + O1·O2 | `src/game/devPlayVerbLog.ts` · `src/game/playerObserve/*` · `src/store/arcCoreChatStore.ts` · `src/store/playerStore.ts`(2줄) · `src/arcCore/chat/bindStellaLifeAskToPlanetSession.ts` · `stellaLifePack.ts` · `stellaLifePack.test.ts` · `arcCoreAgentPack.ts` |
| ③ 플레이봇 | `tools/play-bot-console/**` |
| ④ 문서 | `docs/playbot/*` (감사·3단·오토모드·스텔라 설계·실현성·README) · `docs/character/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md` · `docs/ops/차기_업무_목록.md` · 규칙 3곳 김플레이 역할(`AGENTS.md` · `gemini-code-agent-routing.mdc` · `arcfire-main-lead-agent.mdc`) |

**김플레이 것이 아닌 미커밋 (묶음에 넣지 말 것)**: `src/arcCore/chat/presentStellaLifeAskComm.ts` · `src/game/ingameDialog/firstStellaContact*` · 그 밖의 전투·경제·웨이브·CSV 변경. `missionStore.ts` 는 동사 방출 외 변경이 섞였는지 diff 로 갈라 주시길.

## 7. 메모리 1차 검수 (합본)

```text
[pss-pre-dev] hot_path=플레이어 행동 1회당 O(1) 관찰 기록 · 허브 진입 1회 hydrate · 봇은 Node(앱 무관) · 틱 0
[pss-pre-dev] alloc=이벤트당 짧은 문자열 ≤2 · 링 64 사전 할당 · persist=기존 1.5s 코얼레싱 · 새 저장 키 0 · 새 STAGE·Canvas 0
[pss-pre-dev] risk=P1·P4(sink 무의존)·P6 · verdict=PASS
```

## 검수 후 추가 구현 (2026-10-06)

잠금 2 가드 · D1 (봇과 앱이 같은 행동 문자열) — 상세·self-check 는 `kim-play-handoff-stella-o1o2-20261006.md` §5-A. 커밋 묶음 ① 에 함께 넣으면 된다 (`src/game/playerObserve/playerObserveDetail.ts` · `src/store/arcCoreChatPersistGuard*.ts` 추가).

## verdict (김팀장 기입)

| # | 판정 | 메모 |
|---|------|------|
| 1 | | |
| 2 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
