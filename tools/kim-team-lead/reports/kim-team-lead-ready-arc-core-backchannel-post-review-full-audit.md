# READY — 아크코어 대화채널 검수 직후 전수 조사 (김팀장 · 구현 전)

```text
status=DONE
task_id=arc-core-backchannel-post-review-full-audit-20260814
assignee=김팀장(글록 4.5)
verdict=PASS
reviewed_at=2026-08-14
design_doc=docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md v0.4
code=FORBIDDEN_UNTIL_IMPL_ORDER
```

대표님 지시(2026-08-14): 김클로드 공동 검수 종료 후 대화채널 전체 전수 조사.  
김클로드 `PARTIAL` 흡수 + §11 재확인 완료.

---

## 1. 메모리 (PSS · Views · STAGE)

| # | 확인 | 합격 |
|---|------|------|
| M1 | 명단은 오픈 1회 스냅샷. 궤도 틱/`onWallTick`/rAF에서 `list*` 금지 | PASS |
| M2 | 채팅 트리는 루트 `ArcOverlayHost` 1장. 화면별 복제 금지 | PASS |
| M3 | STAGE 이탈 `dismissAll`이 명단·채팅을 비움 (C5 blanket) | PASS |
| M4 | 전투 시뮬 활성·Skia dispose 전 present 거부. 1차 `combat_end`는 WaveDefense `onClose`만 | PASS |
| M5 | 타이틀/`runContinueSessionPrewarm`에 채널·hydrate 대기 없음 | PASS |
| M6 | 회신 월드 요약은 오픈/전송 1회. 틱 재수집 금지 | PASS |
| M7 | `useMemo` dep는 `planet.id` 등 스칼라 | PASS |
| M8 | 구현 턴 게이트: `tsc` · `audit:ui-overlay` · `audit:memory:all` · 김경제 recheck | PASS (계약) |

## 2. 누적

| # | 확인 | 합격 |
|---|------|------|
| A1 | 고정 id + dismissWhere 후 1장. nearbyPresence append 금지 | PASS |
| A2 | 명단+채팅+narrative 동시 스택 금지 | PASS |
| A3 | messages 읽기·쓰기·복구 40 FIFO | PASS |
| A4 | lastFired 16 FIFO | PASS |
| A5 | 오프너 시스템 줄도 40캡 | PASS |
| A6 | persist에 월드 스냅샷·overlay stack 없음 | PASS |
| A7 | 전송 후 1.5s coalesce. 키입력 persist 금지 | PASS |
| A8 | hydrate 공유 Promise | PASS |

## 3. 채팅기록 데이터

| # | 확인 | 합격 |
|---|------|------|
| D1 | 키 `arcfire_arc_core_chat_v1` · 계정 귀속 | PASS (구현 시 신설) |
| D2 | `purgeLocalAccountData`에 `reset*` | PASS (구현 시 한 세트) |
| D3 | `PLAYER_GAME_SAVE_BACKUP_KEYS` | PASS (구현 시 한 세트) |
| D4 | `reloadAllLocalGameSaveStores` hydrate | PASS (구현 시 한 세트) |
| D5 | 500자 · role 화이트리스트 · schemaVersion · 깨진 JSON 빈 로그 | PASS |
| D6 | `onSnapshot`/RTDB 리스너 없음 | PASS |
| D7 | 섀도우 닉네임·스냅샷 저장 금지 | PASS |
| D8 | 부트 동기 hydrate 금지. 오픈 또는 허브 안착 후 1회 | PASS |
| D9 | 40×500 ≈ 20KB. slim에서 자르지 않음 | PASS |

## 4. 산출

`verdict=PASS`. 설계만. 대표님 구현 지시 전에 `src/`/`app/` 없음.
