# 김클로드 → 김팀장 협의 답 — 세포 패턴 학습

```text
task_id=playbot-cell-pattern-20261004
kind=CONSULT (코드 변경 0 · 커밋 금지 · 하니스 재시작 안 함)
답=김클로드 · 2026-10-04 KST
브리프=kim-team-lead-playbot-cell-pattern-brief-20261004.md
재검수 대상 파일=
  tools/play-bot-console/src/ownerPlaylogAuto.ts
  tools/play-bot-console/src/memProfileToSessionTrace.ts
  tools/play-bot-console/src/humanSeed.ts
  tools/play-bot-console/src/policy.ts
  tools/play-bot-console/logs/learned/learn-cycle-latest.json
  docs/playbot/PLAYBOT_HUMAN_PATTERN_AND_ARCCORE_LEARNING_v1.md
```

이 답은 브리프 초안을 그대로 받지 않았다. 인용 파일을 직접 읽고 판정했다. 파일은 수정하지 않았다(`kim-claude-handoff-pending.md`·`src/`·`app/`·`tables/`·`logs/` 무변경, 하니스 미중단).

---

## 0. 브리프 §2 사실 재검증 (근거)

| 브리프 §2 주장 | 판정 | 근거(파일:줄) |
|---|---|---|
| 사람 인정 = Awake 마커 3회↑, 미만은 profiler·시드 제외 | **AGREE** | `ownerPlaylogAuto.ts:8` `AUTO_MIN_USER_ACTIONS=3` · `:14` `USER_ACTION_RE = route_focus\|transit_hop_start\|system_change\|planet_change` · `:25-27` classify · `:30-38` `shouldImportAutoSession`→profiler면 false |
| 세션은 유휴 20분·pid·날짜·3시간에 닫힘 | **AGREE** | `ownerPlaylogAuto.ts:5` `AUTO_IDLE_MS=20m` · `:6` `AUTO_MAX_SPAN_MS=3h` · `:40-53` `shouldRotateAutoSession`(deviceGone/appPid/day/max_span/idle) |
| `adaptPolicy`는 미소비 `human-delta.json` 있을 때만 +0.02, 없으면 「새 실기 없음·학습대기」 | **AGREE** | `policy.ts:278` `readUnconsumedHumanDelta` · `:289` `'새 실기 없음·학습대기'` + `skipped:true` · `:306-313` newPairs마다 `bump(w,kind,0.02)` · `:319` `consumeHumanDelta` |
| `verbOf`는 depart/combat/land/travel만 생성, mine 비트 없음 | **AGREE** | `memProfileToSessionTrace.ts:34-44` — depart·combat·land·travel만 반환. mine/scan/trade/quest 분기 없음 |
| `humanSeed`의 mine→quest 매핑은 파서가 mine을 안 만들면 도달 못 함 | **AGREE** | `humanSeed.ts:37` `mine:'quest'` 존재하나 상단 파서가 mine 비트를 안 만들어 `VERB_TO_KIND['mine']`에 입력이 안 들어옴 |
| `learn-cycle-latest.json` 1회 기록·`botPatchLoaded=false` | **AGREE** | `learn-cycle-latest.json:3` `updatedAt=2026-10-04T01:43:14Z`(=10:43 KST) · `:11` `botPatchLoaded:false` · gaps `MARKER_TRAVEL_ONLY`·`COMBAT_METHOD_ABSENT` |
| 오늘 13:42 세션 `owner-auto-2026-10-04T0438` 로그에 광물·매도·연료·개발·전투가 세포로 안 파싱됨 | **PARTIAL(내가 확인 못 함 · 결론은 무관)** | 해당 세션 파일을 `tools/play-bot-console/` 하위에서 찾지 못함(라이브 logcat로 추정). 단 파일을 못 봐도 `verbOf`(위)가 그 비트들을 못 만들므로 「세포로 안 파싱됨」결론은 코드로 성립 |

---

## 1. 두 단(세포 주기 수집 / 전부 통합 후 실행)이 대표님 의도와 맞는가

**AGREE (단, 신규 레이어 아님 — 기존 파이프/6단계 위에 이름만 붙이는 것).**

- 대표님 의도(브리프 §1: 세포=플레이 조각, 주기 수집→판단·장점만 이식→전부 1행동으로 합본→실행 반복)는 v1.1 정본 파이프와 같은 모양이다: `PLAY → QUALIFY → CORPUS(append) → 일 1회 Distill → PACK → Clock S가 Pack만 읽음`(`PLAYBOT_HUMAN_PATTERN_AND_ARCCORE_LEARNING_v1.md:115-144`, `:257-263`).
- 「세포 주기 수집」 = PLAY+QUALIFY 누적, 「통합 후 실행」 = Distill/Pack을 실행이 읽기. 「장점만 옮긴다」 = `Pack.orderTop`/`doNot`(`v1:215-223`, `:267-271`).
- 브리프가 6단계 유지(브리프 §1 끝)·가상일 승수/퀘96/레벨60은 최종데이터 아님으로 못박은 것은 `learn-cycle-latest.json:9-10`(`declareComplete:false`)·v1.1 §9-4와 일치.
- **판정 근거**: 두 단은 새 체계가 아니라 기존 파이프의 재명명이다. 그래서 맞다. 다만 답변·구현 문서에서 「세포/통합 카드」를 코퍼스/팩과 **동일 산출의 다른 이름**으로 명시해야 또 갈라지지 않는다(v1.1 §2 「파이프 끝에 코퍼스가 없고 KPI가 앉아 있다」 재발 방지).

## 2. 채굴·매도·연료·개발·전투 세포를 앱 수정 없이 지금 로그에서 `seen`으로 만들 수 있는가

**DISAGREE(=브리프 §D에 AGREE). 앱 수정 없이 `seen` 불가.** `partial`로 남는 것과 `game_function` 보류를 분리한다:

| 세포 | 지금 가능? | 근거 |
|---|---|---|
| 채굴 개수(100)·매도·연료 소모 | **불가 → `game_function` 보류** | `verbOf`에 mine/trade/sell/fuel 분기 없음(`memProfileToSessionTrace.ts:34-44`). 또한 수집기는 `[MEM_PROFILE]` 줄만 파싱(`:18` `LINE_RE`, `:52` `line.includes('[MEM_PROFILE]')`)하므로 `[stelliumColonize]`·경제 카탈로그 줄은 `partial`로도 안 들어옴. 새 앱 마커 필요 |
| 이동 후 개발 | **`partial`만** | land/travel 비트로 「이동→체류」맥락은 남음(`:39-43`). 단 '개발' 행위 자체 마커는 없음 → 개발 세포는 보류, 체류/착륙만 partial |
| 전투 | **`partial`만(존재 yes, 방식 no)** | `transit_combat_nav→combat`(`:42`)·허브 전투 `attachHubCombat`(`:82-104`)로 전투 **발생**은 잡힘. 그러나 거리·무기·접근은 없음(`learn-cycle-latest.json:32-35` `COMBAT_METHOD_ABSENT`). 방식 세포는 보류 |

→ 지금 로그로 `partial` 가능한 것은 **전투 발생 · land/travel 체류 맥락**뿐. 채굴수·매도·연료·개발행위는 `src/`·`app/` 마커 추가 전까지 `game_function` 보류. 브리프 §D가 「있는 것처럼 쓰지 않는다」고 한 것은 정확하다.

## 3. 세포 128 상한·한 파일·10분·세션 클로즈 전 수집이 메모리·PSS 규율에 맞는가

**PARTIAL. 숫자(128·한 파일·10분)는 OK. 단 「클로즈 전 수집」의 읽기 오프셋 격리가 조건.**

- PSS 규율의 1차 대상은 RN 앱(STAGE dispose·Skia 루프·tick/persist/boot)이다. 이 설계는 Node 콘솔 측이고 디바이스 부트/prewarm/타이틀에서 코퍼스를 안 읽는다(v1.1 `:292` · 브리프 §E 「화면 setInterval」금지). 따라서 앱 PSS에 직접 영향 없음 → 숫자 자체는 안전.
- 128 자유문자열×단일 파일 교체쓰기는 기존 상한들과 같은 급: 시드 세션 cap 32(`humanSeed.ts:157`), beat cap 48(`memProfileToSessionTrace.ts:28`). 한 파일·원자 교체(시드 `humanSeed.ts:205-215` 패턴 재사용 권장)·중복시 관측시각만 갱신(브리프 §A)이면 누적 없음.
- **조건(PARTIAL 사유)**: 「세션 클로즈 전 10분 주기로 열린 로그를 읽는다」가 **읽기 위치(offset)를 선행시키면** 이미 트윈 보류로 잡아둔 `READ_OFFSET_BEFORE_AWAKE`(`learn-cycle-latest.json:26-29`, 선행 합의로 미수정)를 재발시킨다. 세포 수집기의 읽기 오프셋은 시드 임포터의 오프셋과 **분리**하고 read-only(소비/전진 금지)여야 한다. 이 격리를 설계에 명시하면 128·한 파일·10분은 그대로 수용.
- 숫자 축소는 불필요. 굳이 조이면 cap 64·beat 48 유지를 제안하나, 중복 병합(브리프 §A)이 있으면 128로 충분.

## 4. 통합 카드를 의도 선택이 읽는 정리본으로 두는 것이 맞는가 / 가중치에 녹이는 안 거절 이유

**AGREE(읽기 정리본). 가중치 융해는 거절이 맞다.**

- 카드는 「상황→행동 목록」(브리프 §C)이고, 이는 `Pack.orderTop`/`doNot`을 Clock S 정책이 **읽기로만** 소비하는 v1.1 `:257-263`·`:267-271`과 같다.
- 가중치 거절 근거(코드): `adaptPolicy`의 델타는 신규 동사쌍마다 `verbToActionKind`로 **단일 ActionKind 스칼라 +0.02**만 올린다(`policy.ts:306-313`). 가중치 벡터는 ActionKind 당 숫자 하나(`policy.ts:53`, `personas.ts`)라서 「아르카디아: 100까지 채굴→매도→연료→워프」같은 **순서·상황·멈춤조건**을 표현할 수 없다. 세포를 가중치에 녹이면 그 구조가 스칼라로 붕괴 — 브리프 §E 「가중치로 세포를 위장」·v1.1 §9-1,9-2 금지에 정면 충돌.
- 따라서 카드는 별도 산출로 두고, 델타 게이트(+0.02)는 지금 그대로 둔다. 카드가 비면 실행은 현 페르소나 가중 유지(브리프 §C) — 이는 `blendPersonaWeights`의 n<3 폴백과 같은 안전 기본값(`humanSeed.ts:129`).

## 5. 장시간 체류를 이동 4종 3회 미만이라는 이유로 버리면 세포 수집이 깨지는가

**AGREE(깨진다). 브리프 §B의 「profiler 판정은 가중치 델타 게이트에만」이 옳다.**

- 지금은 3회 미만 세션을 profiler로 분류→`shouldImportAutoSession` false→시드 제외(`ownerPlaylogAuto.ts:8,25-27,30-38`). 장시간 채굴 체류는 route_focus/transit 마커가 드물(채굴은 애초 마커가 아님)어 사람 플레이인데도 3회 미만으로 탈락.
- 그러므로 세포 수집은 profiler 게이트를 **거치지 않고** `seen|partial` 근거만 보면 버리지 않아야 한다(브리프 §B). profiler 판정은 가중치 델타(실기 소비) 게이트에만 남긴다.
- **단서(2와 연결)**: 게이트를 풀어도 채굴 '내용' 자체는 아직 못 본다(Q2). 그래서 이 완화가 실효를 내는 1차 대상은 **이동 마커는 있으나 3회 미만인 세션**과 **전투/체류 partial 세포**다. 채굴수·연료는 여전히 앱 마커 추가까지 보류. 이 점을 설계에 같이 적어 「풀면 채굴이 바로 들어온다」는 오해를 막는다.

## 6. 러닝 하니스 재시작 금지와 카드 미로드 고지가 설계에 들어가야 하는가

**AGREE. 둘 다 명시 필수.**

- 재시작 금지: 재시작은 세계를 L1로 되돌린다(브리프 §2·§C, 선행 결론 `playbot-learn-cycle-conclusion-20261004.md:32` 「켜 둔 세계는 이전 코드로 계속… 다음 기동부터」). 이번 설계 턴은 코드 0·재시작 0.
- 카드 미로드 고지: 시드에는 `reloadHumanSeedIfChanged`(`humanSeed.ts:229-236`)로 타 프로세스 갱신 재로드 경로가 있으나, **새 play-card에 대한 동등한 라이브 재로드는 없다**. 따라서 카드 구현 뒤에도 **이미 떠 있는 하니스는 다음 기동 전까지 카드를 못 읽는다**(`botPatchLoaded:false` 현상과 동일 계열, `learn-cycle-latest.json:11`). 이 사실을 설계 문서에 못박아, 「카드 썼는데 왜 반영 안 되나」를 예방한다.

---

## 7. 한 줄 종합

두 단 체계(AGREE, 단 기존 코퍼스/팩의 재명명) · 채굴수·매도·연료·개발은 앱 마커 전까지 `seen` 불가·보류, 전투/체류만 `partial`(DISAGREE on seen) · 128·한파일·10분은 읽기오프셋 격리 조건부 수용(PARTIAL) · 통합 카드는 읽기 정리본, 가중치 융해 거절(AGREE) · 3회 미만 탈락은 세포 수집을 깨므로 profiler는 델타 게이트에만(AGREE) · 재시작 금지+카드 미로드 고지 명시(AGREE).

> 미해결 확인점: `owner-auto-2026-10-04T0438` 세션 로그 실파일을 저장소에서 찾지 못함(라이브 logcat 추정). 해당 로그의 구체 내용은 내가 직접 보지 못했으나, 결론(그 비트가 세포로 안 파싱됨)은 `verbOf`·`LINE_RE` 코드로 독립 성립한다. 로그 실파일 경로를 알려주시면 `partial` 후보(경제 카탈로그·`[stelliumColonize]` 줄)를 재확인하겠다.
