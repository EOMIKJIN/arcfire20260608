# 플레이어 전투 숙련도 시스템 (Player Combat Proficiency)

"레벨업을 통해 파일럿의 숙련도를 높이고, 전함의 성능을 한계 이상으로 끌어올리세요!"
전투 숙련도: 파일럿의 레벨이 오를수록 '전투 등급'이 상승하며, 전함의 공격력, 방어력, 속도 등 전반적인 '운용 효율'이 레벨당 1%씩 향상됩니다. 
(Lv.1: 101% ~ Lv.60: 160%)  

조선소 성장 상한: 전투 등급이 높을수록 전함의 광물 업그레이드 단계 제한이 해제되어, 더 강력한 장비로 전함을 강화할 수 있습니다. 
레벨업 보상: 레벨업 시마다 스킬 포인트(+1)와 함께 향상된 전투 숙련도 능력치를 즉시 확인하실 수 있습니다.  
참고: 본 숙련도 시스템은 무기의 티어 등급과는 별개로 작동하는 파일럿 고유의 성장 지표입니다.  


> 계정 레벨업과 연동되는 **파일럿(플레이어) 전투 숙련도** 정본 문서.  
> 무기 CSV `tierLabel` «숙련», NPC `combatLevel`과 구분한다.

**최종 갱신:** 2026-05  
**관련 코드:** `src/store/playerStore.ts`, `src/combat/ShipPerformanceCalculator.ts`, `src/components/LevelUpDetailPanel.tsx`

---

## 1. 개념 구분

| 구분 | 데이터 | 역할 |
|------|--------|------|
| **플레이어 전투 숙련도** | `player.combatProficiency` | 계정 `level` 연동, 전함 전투·조선소 상한 |
| **무기 티어 «숙련»** | `weapon_list.csv` `tierLabel` | 레이저 색·드론 웨이브 등 **무기 등급** (파일럿 레벨 무관) |
| **NPC 전투 등급** | `npc_ai_ships.csv` `combatLevel` / `proficiencyMultiplier` | 적·수송함 — 동일 성능 계산기 사용 |

---

## 2. 기획 규칙 (현재 구현)

### 2.1 전투 등급

- `combatLevel = max(1, floor(player.level))`
- 별도 «전투 전용 XP» 없음. **파일럿 레벨 = 전투 등급**.

### 2.2 숙련 계수 · 운용 효율

```
proficiencyMultiplier = 1 + combatLevel × 0.01
operatingEfficiencyPct = round(proficiencyMultiplier × 100)
```

| 플레이어 Lv | 숙련 계수 | 운용 효율 |
|------------|-----------|-----------|
| 1 | 1.010 | 101% |
| 10 | 1.100 | 110% |
| 30 | 1.300 | 130% |
| 60 (상한) | 1.600 | 160% |

- **레벨당 +1%p** 선형 성장.

### 2.3 레벨업 시 동시 반영

| 항목 | 규칙 |
|------|------|
| 스킬 포인트 | 레벨업 1회당 **+1** (`SKILL_POINTS_PER_LEVEL`, `src/data/d20tables.ts`) |
| 경험치 | `tables/content/player_level_exp.csv` → `EXP_TABLE`, 누적 `exp` 기준 |
| 최고 레벨 | CSV 기준 **Lv.60** (`MAX_PLAYER_LEVEL`) |
| 전투 숙련도 | `addExp` 종료 시 `createPlayerCombatProficiency(새 level)`로 재계산 |

### 2.4 UI 고지 (레벨업 모달)

레벨업 시 다음을 표시한다.

- Lv. before → after
- 스킬 포인트 획득 (+N, 레벨당 +1)
- 다음 레벨까지 **남은 경험치** / **누적 임계 경험치**
- 전투 숙련도: 전투 등급, 운용 효율, 숙련 계수 (before → after, Δ)

---

## 3. 데이터 모델

### 3.1 `PlayerCombatProficiency`

저장 위치: `arcfire_player_v1` → `player.combatProficiency`

| 필드 | 설명 |
|------|------|
| `combatLevel` | 전투 등급 (= floor(level)) |
| `proficiencyMultiplier` | 전투 스탯 배율 |
| `operatingEfficiencyPct` | UI용 퍼센트 |
| `updatedAt` | 마지막 갱신 시각(ms) |

타입: `src/types/index.ts`

### 3.2 `LevelUpSummary` (UI 전용, 비영속)

`playerStore.levelUpSummary` — `clearLevelUp()` 시 제거.

| 필드 | 설명 |
|------|------|
| `previousLevel` / `newLevel` | 이번 `addExp` 구간 레벨 변화 |
| `skillPointsGained` | 획득 SP 합계 |
| `expRemainingForNextLevel` | 다음 레벨까지 남은 누적 EXP |
| `nextLevelThresholdExp` | `EXP_TABLE[newLevel+1]` |
| `proficiencyBefore` / `proficiencyAfter` | 숙련도 스냅샷 |

---

## 4. 처리 흐름

```
경험치 유입 (미션 / 궤도 격침 / 레이드 등)
  → playerStore.addExp(amount)
  → gainExp
  → processLevelUp 루프 (연속 레벨업 가능)
  → createPlayerCombatProficiency(최종 level)
  → levelUpSummary 생성 (levelsGained > 0)
  → player 저장 + levelUpPending = true
  → LevelUpModalHost 표시
```

### 4.1 경험치 유입 경로

| 경로 | 모듈 |
|------|------|
| 미션 보상 | `src/store/missionStore.ts` |
| 궤도 전투 | `src/game/orbitCombat/orbitCombatPlayerExpQueue.ts` (전투 중 rAF 배치) |
| 에덴 레이드 등 | `src/combat/edenRaid*.ts`, `edenRaidMatchAdjudication.ts` |

### 4.2 연속 레벨업

- `proficiencyBefore`: `addExp` **시작 시** 스냅샷.
- `proficiencyAfter`: **최종** 레벨 기준 재계산.
- 한 번에 3레벨 오르면 모달에 숙련도 Δ가 3레벨 분량으로 표시됨.

### 4.3 로드·마이그레이션

- `combatProficiency` 누락 시 `normalizePlayerCombatProficiency(raw, player.level)` 보정.
- `ensurePlayerHasDefaultShip`에서도 level 기준 재정규화.

---

## 5. 전투 연동

### 5.1 플레이어 기함

`PlanetEdenRaidTestLayer.resolvePlayerFlagshipCombatBinding()`:

1. 격납고 전함 CSV 스탯 + 장착 무기
2. `calculateShipPerformance(stats, { level, proficiencyMultiplier }, runtimeConfig)`
3. `applyMineralUpgradeToShipPerformance(..., player.mineralUpgrades)`

### 5.2 `ShipPerformanceCalculator` 적용 항목

`proficiencyMultiplier` 기준:

- **maxHp / maxShield**: `round(기본 × 계수)`
- **armor / attackBonus**: 기본 + `floor((계수−1)×10)`
- **damageDice.bonus**: STR 보정과 계수 연동
- **maxMoveSpeed / maxTurnRate** (`runtimeConfig`): DEX 보정과 계수 연동

함장 미배정 NPC 기본값: `UNASSIGNED_CAPTAIN_PROFICIENCY_MULTIPLIER = 0.9`

### 5.3 NPC

- `npc_ai_ships.csv`의 `combatLevel`, `proficiencyMultiplier` 사용.
- 동일 `calculateShipPerformance` 축 (입력만 CSV).

---

## 6. 조선소 연동 (광물 업그레이드 상한)

`tables/content/mineral_upgrade_level_caps.csv`:

| 전투 Lv (`combatLevel`) 이하 | 업그레이드 최대 단계 |
|---------------------------|---------------------|
| ≤14 | 5 |
| ≤30 | 8 |
| ≤50 | 12 |
| 그 외 | 15 |

- `resolveMineralUpgradeMaxLevel(combatLevel)` — `src/game/shipyardMineralUpgrade/mineralUpgradeModel.ts`
- UI: `ShipyardMineralUpgradeTab` — «전투 Lv.N · 상한 Lv.M»

---

## 7. UI

| UI | 경로 | 비고 |
|----|------|------|
| 레벨업 전역 모달 | `LevelUpModalHost` (`app/_layout.tsx`) | `LevelUpDetailPanel` |
| 미션 보상 모달 | `RewardModal` | `levelUpDetail` 지원, **호출부 미연결** |
| 행성 파일럿 패널 | `PilotInfoStatsPanel` | 숙련도 **미표시** |

### 모달 표시 조건 (`LevelUpModalHost`)

- `levelUpPending && levelUpSummary && player`
- **숨김:** `pathname`에 `combat` 포함, 궤도 전투 UI 활성 (`orbitCapitalCombatUiStore.active`)

---

## 8. 되는 것 / 안 되는 것

### 되는 것

- 레벨업 시 SP +1/레벨, `combatProficiency` 갱신·`arcfire_player_v1` 저장
- 레벨업 모달: SP, 다음 레벨 EXP, 숙련도 before→after
- 모든 `addExp` 경로에서 동일 파이프라인
- 궤도 전투 기함 스탯 + 조선소 업그레이드 상한

### 안 되는 것 / 미완

| 항목 | 상태 |
|------|------|
| `showRewardModal` + `levelUpDetail` | 타입·UI만 준비, 호출 없음 |
| 허브 파일럿 패널 상시 숙련도 | 미구현 |
| `PROFICIENCY_BONUS` (`d20tables.ts`) | D&D식 테이블 **미사용** (실제는 Lv×1%) |
| 스킬 트리 ↔ 숙련도 직접 연동 | 없음 (`resolvePlayerCombatSkillModifiers` 별도) |
| 전투 중 레벨업 모달 | 의도적 비표시 (전투 후 표시) |

---

## 9. 코드 인덱스

| 역할 | 파일 |
|------|------|
| 숙련도 생성·정규화 | `src/store/playerStore.ts` — `createPlayerCombatProficiency`, `addExp` |
| 타입 | `src/types/index.ts` |
| 레벨업 UI | `src/components/LevelUpDetailPanel.tsx`, `LevelUpModal.tsx` |
| 전투 성능 | `src/combat/ShipPerformanceCalculator.ts` |
| 플레이어 기함 바인딩 | `src/components/planet/PlanetEdenRaidTestLayer.tsx` |
| EXP 테이블 | `tables/content/player_level_exp.csv` → `src/data/d20tables.ts` |
| 업그레이드 상한 | `tables/content/mineral_upgrade_level_caps.csv` |

---

## 10. 검증 체크리스트

1. Lv.1→2: 운용 효율 100%→102%, SP +1.
2. Lv.14→15: 광물 업그레이드 상한 5→8 구간.
3. 궤도 전투 중 레벨업 → 모달 없음 → 전투 종료 후 모달.
4. 연속 레벨업(대량 EXP) → SP·숙련도 Δ가 최종 레벨 기준으로 일치하는지.

---

## 11. 변경 시 주의

- 숙련도 공식 변경 시 **NPC CSV `proficiencyMultiplier` 정합성**과 **조선소 cap 테이블**을 함께 검토한다.
- `addExp` 외 경로로 `player.level`만 바꾸면 `combatProficiency`가 어긋날 수 있다 — 반드시 `addExp` 또는 load 시 `normalizePlayerCombatProficiency`를 거친다.
- 무기 `tierLabel` «숙련»과 혼동하지 말 것 (별도 무기 밸런스 축).
