# 김클로드 착수 — 허브 10초 리스폰 전술 삭제 · 대기후 교전재개 범용 적용

> **배정**: 김팀장 (Cursor 본창) · **2026-07-27** · 대표님 지시: **김클로드에게 개발 지시**  
> **배경**: 드라코 성운 등에서 전투 종료 직후(~10초) 리스폰 재교전 — 개발테스트용 단순 전술로 판정.  
> **기획 의도**: **최소 30분 대기 후** 교전 재개 여부를 결정하는 기존 전술 규칙 범용 적용.  
> **완료 후**: `kim-claude-handoff-pending.md` 상단 **PENDING** · **git commit 금지**  
> **task_id**: `hub-combat-cooldown-universal-20260727`

---

## [pss-pre-dev] (코딩 전 필수)

```text
[pss-pre-dev] hot_path=교전종료1회·쿨다운조회sync · alloc=틱당리스폰예약금지 · cache=waveCombatCooldown_O1_Map
[pss-pre-dev] stage=planet_hub_combat·account_purge연동유지 · risk=P1(틱할당금지)·P6(persist저빈도)
[pss-pre-dev] verdict=PASS — 10초 리스폰 루프 제거·쿨다운은 이벤트1회 mark만
```

---

## 0. 김팀장 검토 요약 (이미 완료 · 재분석 최소)

### 현행 두 축

| 축 | 경로 | 대기 |
|----|------|------|
| **A. 허브 메인스테이지 교전** | `mainStageCombatEnabled` + 적 NPC → Battle Ready → `PlanetEdenRaidTestLayer` | **없음** — 격침 후 `RESPAWN_DELAY_MS=10_000` 자동 리스폰 |
| **B. 웨이브 디펜스** | `resolvePlanetWaveCombatTrigger` → `useWaveDefenseController` | **있음** — 승리 시 `markWaveCombatVictoryCooldown` · 30분 (`WAVE_COMBAT_VICTORY_COOLDOWN_MS`) |

### 드라코(`draco_haven`) 특이점

- CSV: `mainStageCombatEnabled=true`, `mainStageCombatVariant=draco_boss`
- 웨이브 트리거 허용 variant는 `draco_wave`·`endgame_boss`만 → **B축 미사용**
- 적 NPC 3척 `operationalState=combat` 상시 → `hasEnemyFleetEnteredPlanetOrbit` 항상 true
- 체감 버그 = **A축 10초 리스폰**

### 기존 재개 대기 정본 (재사용 · 고도화는 후속)

- `src/game/waveDefense/waveCombatCooldownStore.ts`
- 소비: `resolvePlanetWaveCombatTrigger` (`isWaveCombatCooldownActive`)
- 마킹: `planet.tsx` `handleWaveDefenseRunEnded` (승리만)
- purge: `localAccountReset` 연동 유지

---

## 1. 범위 / 비범위

### ✅ 이번 구현 (김클로드)

| # | 축 | 요약 |
|---|-----|------|
| M0 | 삭제 | 허브 비웨이브 경로의 **10초 자동 리스폰 재교전** 전술 제거(전성계 공통) |
| M1 | 범용 쿨다운 | 기존 `waveCombatCooldownStore`를 **허브 메인스테이지 교전 종료(블루 승)** 에도 마킹 |
| M2 | 게이트 | 쿨다운 활성 시 **새 허브 교전 진입 차단** (`enemyFleetEntered` / Battle Ready / capitalCombatOrbit) |
| M3 | 웨이브 정합 | 웨이브 모드 동작·승리 30분 규칙 **유지**. 웨이브 간 2.6초 전환은 **유지**(런 내부) |
| M4 | 문서 | 짧은 계약 메모 1페이지(선택: `docs/strategy/` 또는 waveDefense README 주석 강화) |

### ❌ 이번 금지

- 행성/성계 id 하드코딩 분기 (`if (planetId==='draco_haven')`)
- FrontPressure / territorial pass / `draco_front` CSV 기존값 무단 변경
- STAGE `useWaveDefenseController` 주기·9웨이브 구조 개편
- 쿨다운 시간을 임의 변경(30분 상수 **유지** — 고도화는 후속)
- Skia 루프 내 `Make()`/`Paint()` · 틱당 신규 할당
- git commit / 「완료」선언

### ⭕ 선택 (시간 되면 · 없으면 handoff에 명시)

| M5 | 패배(레드 승) 시에도 동일 30분 쿨다운 여부 — **기본은 승리만**(기존 계약). 패배 확장 원하면 handoff에 제안만 |
| M6 | `draco_boss`를 웨이브 트리거에 넣는 것 — **이번 범위 밖**(대표님 범용 쿨다운 우선) |

---

## 2. M0 — 10초 리스폰 전술 삭제

**파일**: `src/components/planet/PlanetEdenRaidTestLayer.tsx`

| 현재 | 목표 |
|------|------|
| `RESPAWN_DELAY_MS = 10_000` | 비웨이브 경로에서 **스케줄·호출 제거** |
| `!waveDefense.active`일 때 격침 → 10초 후 `respawnDestroyedAgents` | **자동 리스폰 금지** |
| 웨이브 모드 | 기존대로 자동 리스폰 이미 금지 — 유지 |

구현 1안(권장):

1. 비웨이브에서 `respawnAtWallRef` 예약 블록 **삭제 또는 영구 no-op**
2. `respawnDestroyedAgents` 호출 경로가 비웨이브에서 도달하지 않게
3. 상수 `RESPAWN_DELAY_MS`는 dead code면 제거하거나 `DEPRECATED_DEV_TEST` 주석 후 미사용 확인
4. 교전 한쪽 전멸 후: 기존 보상/`recordMatchSummary`/섀도우 리빌 로직은 **유지** · 함대만 자동 부활하지 않음

**플레이어 격침 → 생존포드 귀환** 경로는 손대지 말 것.

---

## 3. M1 — 쿨다운 마킹 범용화

**정본 유지**: `waveCombatCooldownStore` (이름·STORAGE_KEY·30분 상수 유지 가능).  
주석만 「웨이브 전용」→ 「**허브 교전·웨이브 공통 재개 대기**」로 갱신.

마킹 시점(비웨이브):

- `PlanetEdenRaidTestLayer` 루프에서 이미 `winnerTeam === 'blue'` + `hadPlayerCombat` 판정이 있는 **교전 종료 1회 블록**(`waveOutcomeAwardedRef`)에서  
  `markWaveCombatVictoryCooldown(combatPlanetId)` 호출
- **플레이어가 참전한 블루 승**에만 (NPC만의 블루 승은 쿨다운 불필요 — handoff에 선택한 규칙 명시)
- 웨이브 활성 중에는 **기존처럼** `planet.tsx` `handleWaveDefenseRunEnded`만 마킹(중복 mark 허용 — 동일 planet·동일 시각대 OK)

---

## 4. M2 — 쿨다운 시 허브 교전 진입 게이트

`app/(game)/planet.tsx`의 `enemyFleetEntered` 계산:

```ts
// 개념 (구현은 기존 스타일 맞춤)
hasEnemyFleetEnteredPlanetOrbit(...) && resolveMainStageCombatEnabled(...)
  && !isWaveCombatCooldownActive(planet.id)   // ← 추가
  || waveDefenseActiveHere
```

또는 `usePlanetHubBattleReady` 입력 전에 동일 게이트.  
**효과**: 쿨다운 중이면 Battle Ready/capitalCombatOrbit 꺼짐 → Skia 교전 레이어 미활성.

`resolvePlanetWaveCombatTrigger`의 기존 쿨다운 선행 판정은 **유지**.

---

## 5. M3 — 웨이브 정합 체크리스트

- [ ] 웨이브 런 중 자동 리스폰 여전히 없음
- [ ] 웨이브 승리 → 30분 → 재착륙해도 웨이브 미시작
- [ ] 웨이브 간 cleared→next (2.6초) 정상
- [ ] `draco_haven` 등 mainStage 전용 행성: 한 판 블루 승 후 30분 재교전 없음

---

## 6. Self-check

```bash
npx tsc --noEmit -p tsconfig.client.json
npm run audit:memory:all
# Skia 파일 수정 시
npm run audit:skia-memory
```

handoff에 기록:

- 변경 파일 · RESPAWN 제거 방식
- 쿨다운 mark/gate 호출 지점
- `[pss-pre-dev]` 3줄
- 패배 쿨다운 여부(기본: 승리만)
- planetId 하드코딩 없음 확인

---

## 7. 완료 시 김클로드

1. `kim-claude-handoff-pending.md` 맨 위 **PENDING**
2. `task_id=hub-combat-cooldown-universal-20260727` · ready = 본 파일
3. 대표님께 **김팀장 검수 요청**(자동 검수 훅 가동)
4. **commit 금지**

---

## 8. 김팀장 검수 포인트

- 전성계에서 10초 리스폰 재교전 **잔존 없음**
- 블루 승(플레이어 참전) 후 30분 허브 교전·웨이브 모두 차단
- 웨이브 내부 전환·플레이어 격침 귀환 회귀 없음
- tsc · audit:memory:all · (Skia) audit:skia-memory PASS

---

## 9. 복사용 — 김클로드 프롬프트

```text
@김클로드 tools/kim-team-lead/reports/kim-claude-ready-hub-combat-cooldown-universal.md 를 읽고
task_id=hub-combat-cooldown-universal-20260727 M0~M4 구현해.
(1) PlanetEdenRaidTestLayer 비웨이브 10초 자동 리스폰 재교전 삭제(전성계)
(2) waveCombatCooldownStore 30분 규칙을 허브 메인스테이지 블루 승(플레이어 참전)에도 마킹
(3) isWaveCombatCooldownActive면 enemyFleetEntered/허브 교전 진입 차단
웨이브 9웨이브·territorial CSV·planetId 하드코딩 금지. commit 금지.
완료 후 kim-claude-handoff-pending.md 상단 PENDING + 김팀장 검수 요청.
```
