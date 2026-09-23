# 「세축 — 반응·잔상·세계 변화」설계 v1.0 — 김클로드 독립 검토

```text
status=REPORT
task_id=three-axis-world-change-design-review-20260917
kind=DESIGN_REVIEW
code_changes=NO
commit=FORBIDDEN
target=docs/세축_반응_잔상_세계변화_설계.md (v1.0, 2026-09-17, 김팀장)
[pss-pre-dev] hot_path=검토 대상 문서 자체가 설계안(코드 미착수) alloc=없음 cache=없음
[pss-pre-dev] stage=N/A(문서 검수) risk=N/A
[pss-pre-dev] verdict=PASS — 본 리포트는 분석·검수만, src/tables 미변경
```

> **대표님 지시**: "김팀장이 지금 작성한 세계변화 설계 안을 검토하고 피드백을 작성하라."
> **재검수 원칙(CLAUDE.md)**: 문서의 "이미 있는 코드" 주장을 받아쓰지 않고 직접 대조. AGREE/PARTIAL/DISAGREE + 파일:줄.

---

## 0. 총평 — AGREE (착수 가능한 수준)

투자자용 8종 장치 카탈로그를 「반응·잔상·세계 변화」 3축으로 좁히고, **신규 서브코어·신규 틱 없이 기존 통신 판정·궤도 인덱스·일일 배치·바 보드 위에 메모리 스토어 1개만 얹는** 구조다. 잠금 16개(L1~L16)가 이 저장소의 기존 헌법(2게이트·ZERO_BILL·Table-First·일 1회 배치·허브 캡 8·13좌·입≠몸)을 정확히 겨냥하고 있고, 쓰기 시점을 4곳(W1~W4)으로 못박고 읽기를 O(1)로 못박은 점, 캡(함장 64·이벤트 4·방문 16·명단 8)을 전부 숫자로 명시한 점은 이 저장소의 PSS 우선 원칙과 잘 맞는다. **아래 검증 결과 문서가 "이미 있다"고 주장한 코드 근거는 스팟체크한 13건 전부 정확했다.** 구조적 결함은 발견하지 못했고, 실제 피드백은 몇 가지 확인·질문 수준이다.

---

## 1. 독립 재검수 — "이미 있는 코드" 주장 대조 (13건)

| # | 문서 주장 | 판정 | 근거 |
|---|---|---|---|
| 1 | `decideOrbitCommForCaptain` — `orbitCommPolicy.ts`/`resolveOrbitCommPolicy.ts` | **AGREE** | `src/npc/orbitCommPolicy.ts:66` 정의, `resolveOrbitCommPolicy.ts:12,20`에서 `resolveOrbitCommDecision`으로 래핑 |
| 2 | `requestNearbyOrbitComm.ts` → `presentIngameDialogScene(..., { skipSeenCheck: true })` | **AGREE** | `requestNearbyOrbitComm.ts:29-32` 정확히 일치 |
| 3 | `NearbyOrbitPresenceRow.captainId`/`linkedCapitalShipId`, UI는 `slotIndex`만 씀 | **AGREE** | `nearbyOrbitPresenceSystem.ts:78-89` — `slotIndex` 주석 "UI 키·애니메이션 안정용" |
| 4 | `buildCaptainPresenceWorldIndex.ts` + 3시간 로테이션 | **AGREE(경미한 부정확)** | 상수 `CAPTAIN_ORBIT_ASSIGNMENT_ROTATION_MS = 3*60*60*1000`는 실제로 형제 파일 `captainOrbitPlanetAssignment.ts:59`에 정의돼 있고 `buildCaptainPresenceWorldIndex.ts`는 그걸 소비만 함 — 문서가 파일 위치를 살짝 뭉뚱그렸을 뿐 설계에는 영향 없음 |
| 5 | `player.flags.seenStorySceneIds` | **AGREE** | `src/types/index.ts:126` |
| 6 | `arcCoreInboundTalkWhy.ts` spy/combat/story/observe/idle | **AGREE** | `arcCoreInboundTalkWhy.ts:3-9` 정확히 일치 |
| 7 | `IngameDialogCompletionAction`에 `record_orbit_comm` 없음(신규 제안) | **AGREE** | `ingameDialogTypes.ts:12-24` 확인. **추가 검증**: 이미 있는 `complete_talk_npc`(captainId+planetId, 23행)가 얼핏 중복처럼 보여 핸들러(`ingameDialogCompletion.ts:101-103`)까지 확인했으나 `applyTalkNpcMissionObjectives`(미션 목표용)만 호출 — **세계변화 메모리 스토어와 무관한 별개 기능**. 신규 액션 타입 추가가 맞는 판단, 재사용 제안 기각 |
| 8 | `createFactionVaultStore` 1.5초 코얼레스 persist 전례 | **AGREE** | `createFactionVaultStore.ts:57` `VAULT_PERSIST_COALESCE_MS = 1500`, `setTimeout` 디바운스 |
| 9 | `PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX = 8` | **AGREE** | `planetHubOrbitRenderBudget.ts:10` |
| 10 | `ingameDialogStore.lastPlanetLandedId` 착륙 1회 가드 | **AGREE** | `ingameDialogStore.ts:32,85,135-136` |
| 11 | 4대 국호 — §2 L9 "Valoria/Solaris/Oiron/Terrania" vs §8-5 "스텔리움/머큐리움/크림슨/아우렐리움" | **AGREE(표 오독 주의)** | `megaFactionNationPolicy.ts:19-49` 실제 국호는 §8-5와 정확히 일치. §2 L9의 영문명은 표의 "금지하는 일" 칸 — 즉 **쓰면 안 되는 예시**이지 현재값 주장이 아님. 문서 자체는 모순 아니지만, 표만 훑으면 "국호가 두 가지"로 오독하기 쉬운 레이아웃 — 대표님/Fable이 훑어볼 때 헷갈릴 수 있어 언급 |
| 12 | `localAccountReset.ts`의 개별 `resetXxx()` 패턴 | **AGREE** | `localAccountReset.ts` 내 `resetLocal*`/`reset*ForAccountPurge` 약 20개, 동일 패턴으로 신규 함수 추가 자연스러움 |
| 13 | 신규 파일(`orbitPresenceMemory.ts`, `orbitPresenceMemoryStore.ts`) 아직 없음("코드 미착수") | **AGREE** | 두 경로 모두 `src/` 전수 검색 결과 없음 — 문서 상태 표기와 일치 |

**결론**: 스팟체크 13건 중 진짜 오류는 0건. #4·#11은 사소한 표기/레이아웃 이슈일 뿐 설계 자체엔 영향 없음.

---

## 2. 구조적으로 잘된 점 (특별히 짚을 것)

1. **쓰기 중복 방지가 명시적으로 설계돼 있다** — §5-3: "W1을 정본으로 한다. 팝업 확인 시 W1 accept / 거부 판정 즉시 W1 refuse", W2는 "대화 중 이탈 시 수락 미완료를 걸러야 할 때만" 쓰는 idempotent 보조 경로로 한정. `commCount`처럼 카운트 기반 메모리에서 흔한 이중 카운팅 버그를 설계 단계에서 미리 막아뒀다.
2. **잠금 표(L1~L16)가 추상적 원칙이 아니라 전부 구체적 파일/상수를 가리킨다** — 재검수 관점에서 이 자체가 검증 가능하다는 뜻이라 높이 평가.
3. **"소비자만 추가, 생산자는 불변"** 원칙(§8-4: `runArcCoreDailyOpsBatch`에 패스 추가 금지·`price_elasticity` 불변·점유 write는 기존 경로만)이 일관되게 지켜짐 — 세계변화 축이 새 시뮬레이션이 아니라 기존 배치 결과의 "읽기+비교"로만 구성된다는 걸 코드 계약 수준에서 못박았다.

---

## 3. 질문·확인 필요 (블로커 아님)

### 3-1. `__revisit` 씬이 "같은 행성 재방문"과 "다른 행성에서 재조우"를 문장 분기가 아니라 토큰으로만 구분함 (§6-4)

표 4번째 행: `commCount≥1, lastPlanetId≠now → __revisit + lastPlanet 토큰` — 잔상 축과 겹친다는 이유로 **하나의 씬**으로 처리한다. UI 배너 쪽(§7-2)은 `connectedRevisit`/`connectedRevisitFrom`으로 2개 키를 나누면서, 대화 씬 쪽은 1개(`__revisit`)에 토큰만 다르게 넣는 비대칭 구조다.

CSV 신규 행 부담을 최소화하려는 의도로 보이나(§9의 "Phase 2 CSV는 소량 추가"와 일관), 실제 카피(Fable) 작성 시 "같은 곳에서 또 만남"과 "다른 곳에서 다시 만남"이 정말 같은 문장 골격에 토큰만 바꿔서 자연스러운지는 실제 카피를 봐야 판단 가능하다. **의도적 단순화인지, 후속 확장 여지를 열어둔 것인지 확인 부탁**.

### 3-2. 방문 스냅 캡 16 — 대규모 보유 시 "세계 변화" 체감이 조용히 꺼질 수 있음

`visits`는 최대 16, LRU 축출(§5-2). L10 기준 코어 21행성 + synth 규모에서 플레이어가 최근 방문하지 않은(16위 밖으로 밀린) 행성에 재착륙하면 `prev`가 없어 **첫 방문 취급**(§8-2 "첫 방문(prev 없음)은 digest 없음") — 즉 디제스트가 조용히 사라진다. 이건 버그가 아니라 **캡 설계의 자연스러운 트레이드오프**지만, 그 결과가 "체류 위주 소수 행성에서만 세계변화가 체감되고, 넓게 벌린 플레이만 하는 유저는 거의 못 느낀다"는 방향으로 흐를 수 있다. 16이라는 숫자가 실측(평균 세션당 재방문 행성 수)에 근거한 건지, 보수적으로 잡은 상한인지 확인하면 좋겠다 — 낮다고 판단되면 캡을 올리는 건 저비용(스키마 상수 하나)이라 이번 리뷰에서 막을 이유는 아니다.

### 3-3. §2 L9 표 레이아웃 (사소)

위 §1-11 참고 — 표의 "금지하는 일" 칸에 영문 가상 국호를 넣은 의도(실제 값과 혼동 방지용 대조 예시)는 이해하나, 훑어보는 사람 입장에선 "국호가 두 세트"로 오독하기 쉽다. 실질 영향 없음, 수정은 선택.

---

## 4. 페이즈 진행에 대한 의견

§15 "다음 착수" 1안(Phase 1: 스토어+W1+purge+테스트만, CSV/카피/inbound 제외)에 **동의**. Phase 1은 순수 함수+zustand 스토어+테스트뿐이라 위 §3의 두 질문(카피 분기, 캡 16)에 대한 답이 늦어져도 착수를 막을 이유가 없다 — 두 질문 모두 Phase 2(카피)·Phase 4(digest 체감) 시점에 결정해도 늦지 않다.

---

## 5. 종합 판정

**AGREE.** 코드 근거 13건 전수 확인 결과 오류 없음, 구조적 리스크 없음, PSS/캡 설계 견고. §3의 두 질문은 착수 자체를 막는 블로커가 아니라 Phase 2/4 시점에 확인하면 되는 수준. Phase 1부터 순서대로 진행하는 현재 계획 그대로 진행 가능하다고 판단.

---

---

## 6. 김팀장 후속 (2026-09-17)

대표님 지시로 피드백을 정본에 반영했다. `docs/세축_반응_잔상_세계변화_설계.md` **v1.1** · §16.  
handoff `REVIEWED` / `AGREE_WITH_AMENDMENTS`.

*작성: 김클로드 · 2026-09-17 · 독립 재검수(코드 직접 대조). 원 설계 본문은 김팀장이 v1.1에서 개정.*
