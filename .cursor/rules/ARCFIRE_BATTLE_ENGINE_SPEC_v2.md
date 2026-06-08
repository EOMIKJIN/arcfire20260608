# ArcFire — 전투 엔진 통합 스펙 v2
> **이전 스펙(`ARCFIRE_BATTLE_ENGINE_SPEC.md`) 완전 대체**  
> **반영 기준**: `structure.txt` + `README.md` + `SCHEMA.md` 실제 프로젝트 구조  
> **원칙**: StarshipEngine 수학 공식 원형 유지 / 모든 확장은 외부 보너스 인자 전달 방식

---

## ⚠️ 이전 스펙 대비 수정 사항 (Cursor 필독)

| 항목 | 이전 스펙 (잘못됨) | 이번 스펙 (정정) |
|------|------------------|----------------|
| 전함 스탯 출처 | `SHIP_CLASS_BASE` 하드코딩 | `src/data/generated/csvShipTemplates.ts` import |
| 적함 스탯 출처 | `N_M_HP[]` 등 하드코딩 | `src/data/generated/csvNpcCapitalShips.ts` import |
| 무기 데이터 출처 | AffinitySystem 내 하드코딩 | `src/data/generated/csvWeapons.ts` import |
| StarshipEngine 위치 | `src/systems/battle/` (신규) | `src/realtimeBattle/` (기존 폴더 통합) |
| battleStore 위치 | `src/systems/battle/` | `src/store/` (기존 store 폴더) |
| Shield 시스템 | 없음 | `maxShield` 컬럼 → 실드 HP 버퍼 추가 |
| pData 출처 | 임의 정의 | `ship_stats.csv` 컬럼 직접 매핑 |

---

## 📁 실제 프로젝트 파일 구조 (수정 위치만 표시)

```
src/
├── data/
│   └── generated/                    ← CSV 빌드 결과 (수정 금지, 읽기 전용)
│       ├── csvShipTemplates.ts        ← ship_stats.csv → 전함 템플릿
│       ├── csvWeapons.ts              ← weapon_list.csv → 무기 마스터
│       ├── csvNpcCapitalShips.ts      ← npc_ai_ships.csv → 적 함선 스탯
│       └── csvMissions.ts            ← missions.csv → 미션
│
├── realtimeBattle/                   ← [기존 폴더] 여기에 통합
│   ├── battleArchitecture.ts         ← [기존] 구조 정의
│   ├── simClock.ts                   ← [기존] 시뮬 클락
│   ├── useBattleSimLoop.ts           ← [기존] 물리 루프
│   ├── StarshipEngine.ts             ← [신규 추가] D&D 전투 공식
│   ├── BattleManager.ts              ← [신규 추가] 턴 흐름 제어
│   ├── AffinitySystem.ts             ← [신규 추가] 속성 상성
│   ├── EnergySystem.ts               ← [신규 추가] 에너지/스킬
│   └── GrowthSystem.ts               ← [신규 추가] XP/레벨업
│
├── store/                            ← [기존 폴더] 여기에 추가
│   ├── gameStore.ts                  ← [기존]
│   ├── playerStore.ts                ← [기존] ← pData 연동 대상
│   ├── missionStore.ts               ← [기존]
│   ├── worldStore.ts                 ← [기존]
│   ├── userSessionStore.ts           ← [기존]
│   └── battleStore.ts                ← [신규 추가]
│
└── entities/
    ├── PlayerShip.ts                 ← [신규 추가] PData 타입 + CSV 매핑
    └── EnemyFleet.ts                 ← [신규 추가] 적 함대 타입
```

---

## ─────────────────────────────────────────
## STEP 0 | CSV → StarshipEngine 컬럼 매핑표
## ─────────────────────────────────────────

### ship_stats.csv → PData (플레이어 전함)

| CSV 컬럼 | PData 필드 | 변환 방식 |
|----------|-----------|---------|
| `maxHp` | `nPMaxHP`, `nPHP` | 직접 |
| `maxShield` | `nPMaxShield`, `nPShield` | 직접 (신규) |
| `armor` | `nPACBonus` | 직접 |
| `speed` | `nPDex` | 직접 (기동력 프록시) |
| `baseWeaponAttackBonus` | `nPAttackBonus` | 직접 |
| `baseWeaponDiceCount * baseWeaponDiceSides + baseWeaponDiceBonus` | `nPMaxDamage` | 계산 |
| `baseWeaponDiceCount * 1 + baseWeaponDiceBonus` | `nPMinDamage` | 계산 (최소=다이스당 1) |
| `baseWeaponType` | `equippedWeaponType` | `laser\|missile\|railgun\|plasma` |
| `pixelSpriteKey` | 렌더링 전용 | StarshipEngine 외부 처리 |
| `id` | `hullTypeId` | 직접 |
| `weaponSlots` | `nPWeaponSlots` | 직접 (신규) |
| `equipSlots` | `nPEquipSlots` | 직접 (신규) |

> **nPStr (엔진 출력)**: ship_stats.csv에 직접 컬럼 없음.  
> `armor + speed` 조합 또는 별도 `enginePower` 컬럼 추가 권장.  
> 현재는 `DEFAULT_STR = 14` 고정값 사용, 이후 CSV 컬럼 확장 시 교체.

### npc_ai_ships.csv → StarshipEngine N_M_* 배열 (적 함선)

| CSV 컬럼 | StarshipEngine 배열 | 변환 방식 |
|----------|-------------------|---------|
| `maxHp` | `N_M_HP[i]` | 직접 |
| `armor` | `N_M_AC[i]` | 직접 |
| `attackBonus` | `N_M_ATTACK_BONUS[i]` | 직접 |
| `damageDiceCount * damageDiceSides + damageDiceBonus` | `N_M_MAX_DAMAGE[i]` | 계산 |
| `damageDiceCount + damageDiceBonus` | `N_M_MIN_DAMAGE[i]` | 계산 |
| `maxMoveSpeedPxPerMs * 1000` (속도→DEX 프록시) | `N_M_DEX[i]` | 스케일 변환 |
| `maxHp / 10` (체급→STR 프록시) | `N_M_STR[i]` | 스케일 변환 |
| 함급 크기 (별도 enum 필요) | `N_M_SIZE[i]` | CSV 컬럼 `sizeClass` 추가 권장 |
| `name` | `C_M_NAME[i]` | 직접 |

### weapon_list.csv → AffinitySystem + 데미지

| CSV 컬럼 | 사용처 | 방식 |
|----------|-------|------|
| `kind` (laser\|missile) | `AffinitySystem.weaponType` | 직접 |
| `damage` | 데미지 보너스 합산 | `pData.nPMinDamage`, `nPMaxDamage`에 더함 |
| `cooldownMs` | 실시간 전투 쿨다운 | `useBattleSimLoop.ts` 연동 |
| `rangePx` | 교전 거리 판정 | `BattleManager` 거리 체크 |
| `salvoCount` | 연사 처리 | 턴당 공격 횟수 |

---

## ─────────────────────────────────────────
## STEP 1 | StarshipEngine 이식
## 파일: `src/realtimeBattle/StarshipEngine.ts`
## ─────────────────────────────────────────

> ⚠️ `pAttackSuccess`, `getPDamage`, `mAttackSuccess`, `getMDamage` 공식 수정 금지.

```typescript
// src/realtimeBattle/StarshipEngine.ts

import { csvNpcCapitalShips } from '../data/generated/csvNpcCapitalShips';
// csvNpcCapitalShips: Array<{ name, maxHp, armor, attackBonus,
//   damageDiceCount, damageDiceSides, damageDiceBonus,
//   maxMoveSpeedPxPerMs, ... }>

// ── CSV 데이터 → StarshipEngine 배열 변환 ──────────────────────────────
// npc_ai_ships.csv 로드 후 N_M_* 배열에 주입하는 초기화 함수
// 게임 부팅 시 1회 호출 필요
export function initEnemyTablesFromCSV(): void {
  csvNpcCapitalShips.forEach((ship, i) => {
    StarshipEngine.C_M_NAME[i]         = ship.name;
    StarshipEngine.N_M_HP[i]           = ship.maxHp;
    StarshipEngine.N_M_AC[i]           = ship.armor;
    StarshipEngine.N_M_ATTACK_BONUS[i] = ship.attackBonus;
    StarshipEngine.N_M_MAX_DAMAGE[i]   =
      ship.damageDiceCount * ship.damageDiceSides + ship.damageDiceBonus;
    StarshipEngine.N_M_MIN_DAMAGE[i]   =
      ship.damageDiceCount * 1 + ship.damageDiceBonus;
    // DEX 프록시: 속도(px/ms) × 1000 → 10~24 범위 클램프
    StarshipEngine.N_M_DEX[i] = Math.min(24,
      Math.max(10, Math.round(ship.maxMoveSpeedPxPerMs * 1000)));
    // STR 프록시: HP / 10 → 6~24 범위
    StarshipEngine.N_M_STR[i] = Math.min(24,
      Math.max(6, Math.round(ship.maxHp / 10)));
    // SIZE: ship.sizeClass 컬럼 추가 시 교체. 현재 0 고정.
    StarshipEngine.N_M_SIZE[i] = (ship as any).sizeClass ?? 0;
  });
}

export const StarshipEngine = {
  // ── 적 함선 마스터 (initEnemyTablesFromCSV() 호출 전까지 아래 기본값 유지) ──
  // 기본값 = battlesystem.txt 원본 테스트값. 이후 CSV 로드로 덮어씀.
  C_M_NAME: [
    "정찰해적선-α","정찰해적선-β","소형약탈선","약탈해적선","대형약탈선",
    "울프급호위함","울프급구축함","울프급중전함",
    "베어급보급함","베어급전투함","베어급함대함","해적모선-앵크헤그"
  ] as string[],
  N_M_HP:           [8,15,32,44,50,52,54,56,60,65,70,72] as number[],
  N_M_AC:           [10,15,16,13,14,15,15,15,15,16,17,17] as number[],
  N_M_ATTACK_BONUS: [4,4,3,3,3,3,3,4,4,5,6,6] as number[],
  N_M_MAX_DAMAGE:   [4,4,5,6,6,6,7,7,8,9,9,12] as number[],
  N_M_MIN_DAMAGE:   [2,1,1,1,1,1,2,2,3,6,6,2] as number[],
  N_M_STR:          [6,10,13,15,16,18,19,20,21,22,23,24] as number[],
  N_M_DEX:          [15,17,10,10,13,16,15,15,14,13,13,18] as number[],
  N_M_SIZE:         [2,1,0,0,0,0,0,0,0,-1,-1,-2] as number[],
  N_M_EXP:          [5,10,15,20,20,25] as number[],

  getRandom:   (num: number) => Math.floor(Math.random() * num),
  getModifier: (stat: number) => Math.floor(stat / 2) - 5,

  // ── 원형 유지 공식 (수정 금지) ──────────────────────────────────────
  pAttackSuccess(pData: PData, mType: number): 0 | 1 | 2 {
    const nRandom = this.getRandom(20) + 1;
    if (nRandom === 1) return 0;
    const nPTotalAttack = nRandom + pData.nPAttackBonus + pData.nPSize
                        + this.getModifier(pData.nPStr);
    const nMTotalAC     = this.N_M_AC[mType] + this.N_M_SIZE[mType]
                        + this.getModifier(this.N_M_DEX[mType]);
    if (nPTotalAttack < nMTotalAC) return 0;
    if (nRandom >= (pData.nPCritical - 1)) return 2;
    return 1;
  },

  getPDamage(pData: PData, criticalStatus: 0 | 1 | 2): number {
    const range    = pData.nPMaxDamage - pData.nPMinDamage + 1;
    const nRandom  = this.getRandom(range) + pData.nPMinDamage;
    const modifier = this.getModifier(pData.nPStr);
    if (criticalStatus === 2) return nRandom + (modifier * pData.nPCriticalDamage);
    return Math.max(1, nRandom + modifier);
  },

  mAttackSuccess(pData: PData, mType: number): boolean {
    const nRandom = this.getRandom(20) + 1;
    if (nRandom === 1) return false;
    if (nRandom === 20) return true;
    const nMTotalAttack = nRandom + this.N_M_SIZE[mType]
                        + this.N_M_ATTACK_BONUS[mType]
                        + this.getModifier(this.N_M_STR[mType]);
    const nPTotalAC     = 10 + pData.nPSize
                        + this.getModifier(pData.nPDex) + pData.nPACBonus;
    return nMTotalAttack >= nPTotalAC;
  },

  getMDamage(mType: number): number {
    const range    = this.N_M_MAX_DAMAGE[mType] - this.N_M_MIN_DAMAGE[mType] + 1;
    const nRandom  = this.getRandom(range) + this.N_M_MIN_DAMAGE[mType];
    const modifier = this.getModifier(this.N_M_STR[mType]);
    return Math.max(1, nRandom + modifier);
  },
};
```

---

## ─────────────────────────────────────────
## STEP 2 | PData 타입 — CSV 컬럼 직접 매핑
## 파일: `src/entities/PlayerShip.ts`
## ─────────────────────────────────────────

```typescript
// src/entities/PlayerShip.ts

import { csvShipTemplates } from '../data/generated/csvShipTemplates';
// csvShipTemplates: Array<{
//   id, name, description,
//   maxHp, maxShield, armor, speed, cargoCapacity, weaponSlots, equipSlots,
//   baseWeaponId, baseWeaponName, baseWeaponType,
//   baseWeaponAttackBonus, baseWeaponRange,
//   baseWeaponDiceCount, baseWeaponDiceSides, baseWeaponDiceBonus,
//   pixelSpriteKey
// }>

export type WeaponType = 'laser' | 'missile' | 'railgun' | 'plasma';

// ── PData 인터페이스 (ship_stats.csv 컬럼 기준) ─────────────────────────
export interface PData {
  // 식별
  hullTypeId:         string;   // ship_stats.csv id
  nPClass:            number;   // C_CLASS 배열 인덱스 (함종)
  nPLevel:            number;   // 함장/전함 공통 레벨

  // HP / Shield
  nPHP:               number;   // 현재 내구도           ← maxHp
  nPMaxHP:            number;   // 최대 내구도           ← maxHp
  nPShield:           number;   // 현재 실드 HP          ← maxShield [신규]
  nPMaxShield:        number;   // 최대 실드 HP          ← maxShield [신규]

  // 스탯
  nPStr:              number;   // 엔진 출력 (CSV 컬럼 없음 → DEFAULT_STR)
  nPDex:              number;   // 기동력                ← speed
  nPSize:             number;   // 함급 크기 보정

  // 방어
  nPACBonus:          number;   // 방어력 보너스         ← armor

  // 공격
  nPAttackBonus:      number;   // 명중 보너스           ← baseWeaponAttackBonus
  nPMaxDamage:        number;   // 최대 데미지 (diceCount*diceSides+diceBonus)
  nPMinDamage:        number;   // 최소 데미지 (diceCount*1+diceBonus)
  nPCritical:         number;   // 크리티컬 기준 (기본 19)
  nPCriticalDamage:   number;   // 크리티컬 배수 (기본 2)

  // 무기
  equippedWeaponId?:   string;   // weapon_list.csv id   ← baseWeaponId
  equippedWeaponType?: WeaponType; // AffinitySystem 연동 ← baseWeaponType

  // 슬롯 (장착 확장용)
  nPWeaponSlots:      number;   //                       ← weaponSlots [신규]
  nPEquipSlots:       number;   //                       ← equipSlots  [신규]

  // 에너지 시스템 [신규]
  nPEnergy:           number;
  nPMaxEnergy:        number;
  nPEnergyRegen:      number;

  // 성장 시스템 [신규]
  nPXP:               number;
  nPXPToNext:         number;
  nPStatPoints:       number;
}

// ── CSV 행 → PData 변환 함수 ────────────────────────────────────────────
// ship_stats.csv의 한 행을 PData로 변환.
// 게임 시작 시 클래스 선택 → 이 함수로 초기 pData 생성.
const DEFAULT_STR = 14; // CSV에 enginePower 컬럼 추가 전까지 고정값

export function csvRowToPData(
  row: typeof csvShipTemplates[number],
  classIndex: number,
  level: number = 1
): PData {
  const diceMin = row.baseWeaponDiceCount * 1 + row.baseWeaponDiceBonus;
  const diceMax = row.baseWeaponDiceCount * row.baseWeaponDiceSides + row.baseWeaponDiceBonus;

  return {
    hullTypeId:         row.id,
    nPClass:            classIndex,
    nPLevel:            level,
    nPHP:               row.maxHp,
    nPMaxHP:            row.maxHp,
    nPShield:           row.maxShield,
    nPMaxShield:        row.maxShield,
    nPStr:              DEFAULT_STR,
    nPDex:              row.speed,
    nPSize:             0,
    nPACBonus:          row.armor,
    nPAttackBonus:      row.baseWeaponAttackBonus,
    nPMaxDamage:        diceMax,
    nPMinDamage:        Math.max(1, diceMin),
    nPCritical:         19,
    nPCriticalDamage:   2,
    equippedWeaponId:   row.baseWeaponId,
    equippedWeaponType: row.baseWeaponType as WeaponType,
    nPWeaponSlots:      row.weaponSlots,
    nPEquipSlots:       row.equipSlots,
    nPEnergy:           3,
    nPMaxEnergy:        5,
    nPEnergyRegen:      1,
    nPXP:               0,
    nPXPToNext:         100,
    nPStatPoints:       0,
  };
}

// ── 디폴트 전함 (게임 최초 시작, 클래스 미선택 상태) ────────────────────
export function buildDefaultShipPData(): PData {
  // csvShipTemplates에서 id === 'default' 또는 첫 번째 행 사용
  const defaultRow = csvShipTemplates.find(r => r.id === 'default')
                  ?? csvShipTemplates[0];
  return csvRowToPData(defaultRow, -1, 1);
}

// ── 클래스 선택 시 전함 목록 로드 ────────────────────────────────────────
// shipyard.tsx 또는 class-select.tsx에서 호출
export function getAvailableShipClasses(): typeof csvShipTemplates {
  return csvShipTemplates;
}
```

---

## ─────────────────────────────────────────
## STEP 3 | BattleManager — Shield 시스템 반영
## 파일: `src/realtimeBattle/BattleManager.ts`
## ─────────────────────────────────────────

```typescript
// src/realtimeBattle/BattleManager.ts
import { StarshipEngine } from './StarshipEngine';
import { PData } from '../entities/PlayerShip';
import { computeAffinityMultiplier } from './AffinitySystem';
import { regenEnergy, applySkill, getSkillCost, SkillType } from './EnergySystem';
import { addXP } from './GrowthSystem';

export interface EnemyFleet {
  mType:     number;   // StarshipEngine 배열 인덱스 (npc_ai_ships.csv 행 인덱스)
  count:     number;
  currentHP: number;
}

export interface BattleEvent {
  type:       'player_hit' | 'player_miss' | 'player_crit' | 'enemy_hit'
            | 'enemy_miss' | 'shield_hit' | 'ship_destroyed' | 'battle_end';
  message:   string;
  damage?:   number;
  isCritical?: boolean;
}

export interface TurnResult {
  events:       BattleEvent[];
  updatedPData: PData;
  updatedFleet: EnemyFleet;
  isOver:       boolean;
  isVictory:    boolean;
}

export function processTurn(
  pData: PData,
  fleet: EnemyFleet,
  skillThisTurn?: SkillType
): TurnResult {
  const events: BattleEvent[] = [];
  let hp     = pData.nPHP;
  let shield = pData.nPShield;  // [신규] 실드 버퍼
  let { count, currentHP, mType } = fleet;

  // ── 에너지 선충전 ────────────────────────────────────────────────────
  const updatedEnergy = regenEnergy(pData);

  // ── 스킬 또는 기본 공격 ──────────────────────────────────────────────
  let healAmount = 0;
  if (skillThisTurn && (updatedEnergy.nPEnergy ?? 0) >= getSkillCost(skillThisTurn)) {
    const skillResult = applySkill(skillThisTurn, pData, fleet);
    events.push(...skillResult.events);
    currentHP   = skillResult.updatedHP;
    count       = skillResult.updatedCount;
    healAmount  = skillResult.healAmount ?? 0;
    updatedEnergy.nPEnergy! -= getSkillCost(skillThisTurn);
  } else {
    const hitResult = StarshipEngine.pAttackSuccess(pData, mType);
    if (hitResult > 0) {
      let dmg = StarshipEngine.getPDamage(pData, hitResult);

      // 속성 상성 (weapon_list.kind 기반)
      const affinity = computeAffinityMultiplier(pData.equippedWeaponType, mType);
      dmg = Math.floor(dmg * affinity);

      currentHP -= dmg;
      events.push({
        type: hitResult === 2 ? 'player_crit' : 'player_hit',
        message: hitResult === 2
          ? `!!정밀타격!! 적선에 ${dmg} 치명 손상.`
          : `공격 명중: 적선에 ${dmg} 타격.`,
        damage: dmg, isCritical: hitResult === 2,
      });

      if (currentHP <= 0) {
        count--;
        const xpGain = StarshipEngine.N_M_EXP[Math.min(mType, StarshipEngine.N_M_EXP.length - 1)];
        addXP(pData, xpGain);
        events.push({ type: 'ship_destroyed', message: `[격침] 적함 파괴. 잔존: ${count}척.` });
        currentHP = StarshipEngine.N_M_HP[mType];
      }
    } else {
      events.push({ type: 'player_miss', message: '공격이 빗나갔습니다.' });
    }
  }

  // ── 적 반격 — Shield 우선 흡수 ──────────────────────────────────────
  for (let i = 0; i < count && (hp > 0 || shield > 0); i++) {
    if (StarshipEngine.mAttackSuccess(pData, mType)) {
      const mDmg = StarshipEngine.getMDamage(mType);

      if (shield > 0) {
        // 실드가 있으면 먼저 흡수
        const absorbed = Math.min(shield, mDmg);
        const overflow = mDmg - absorbed;
        shield -= absorbed;
        hp     -= overflow;
        events.push({
          type: 'shield_hit',
          message: `적함 ${i+1}: 실드 ${absorbed} 흡수${overflow > 0 ? `, 선체 ${overflow} 손상` : ''}.`,
          damage: mDmg,
        });
      } else {
        hp -= mDmg;
        events.push({ type: 'enemy_hit', message: `적함 ${i+1} 피격: 내구도 ${mDmg} 손상.`, damage: mDmg });
      }
    } else {
      events.push({ type: 'enemy_miss', message: `적함 ${i+1} 공격 회피.` });
    }
  }

  hp = Math.max(0, hp + healAmount);  // repair 스킬 치유 적용

  const isOver    = count <= 0 || hp <= 0;
  const isVictory = count <= 0 && hp > 0;
  if (isOver) {
    events.push({
      type: 'battle_end',
      message: isVictory
        ? `[승리] 잔존 내구도 ${hp}로 작전 성공.`
        : `[패배] 선체 파괴. 작전 실패.`,
    });
  }

  return {
    events,
    updatedPData: { ...pData, ...updatedEnergy, nPHP: hp, nPShield: Math.max(0, shield) },
    updatedFleet: { mType, count, currentHP },
    isOver,
    isVictory,
  };
}
```

---

## ─────────────────────────────────────────
## STEP 4 | AffinitySystem — weapon_list.csv 연동
## 파일: `src/realtimeBattle/AffinitySystem.ts`
## ─────────────────────────────────────────

```typescript
// src/realtimeBattle/AffinitySystem.ts
// weapon_list.csv의 kind 컬럼(laser|missile)이 WeaponType의 기준.
// railgun, plasma는 weapon_list.csv에 kind 추가 시 확장.

import type { WeaponType } from '../entities/PlayerShip';

// npc_ai_ships.csv에 armorType 컬럼 추가 권장.
// 현재는 mType 인덱스 범위로 추정.
const ENEMY_ARMOR_TYPE: Record<number, 'light' | 'shielded' | 'heavy'> = {
  0: 'light',    1: 'light',    2: 'light',    3: 'light',    4: 'light',
  5: 'shielded', 6: 'shielded', 7: 'shielded',
  8: 'heavy',    9: 'heavy',   10: 'heavy',   11: 'heavy',
};

// laser: 실드 특화 / missile: 장갑 특화
const AFFINITY_TABLE: Record<WeaponType, Record<'light' | 'shielded' | 'heavy', number>> = {
  laser:   { light: 1.0, shielded: 1.5, heavy: 0.7 },
  missile: { light: 1.0, shielded: 0.7, heavy: 1.5 },
  railgun: { light: 1.1, shielded: 1.0, heavy: 1.2 },
  plasma:  { light: 1.4, shielded: 0.8, heavy: 0.9 },
};

export function computeAffinityMultiplier(
  weaponType: WeaponType | undefined,
  mType: number
): number {
  if (!weaponType) return 1.0;
  const armorType = ENEMY_ARMOR_TYPE[mType] ?? 'light';
  return AFFINITY_TABLE[weaponType][armorType];
}
```

---

## ─────────────────────────────────────────
## STEP 5 | EnergySystem (변경 없음, 위치만 수정)
## 파일: `src/realtimeBattle/EnergySystem.ts`
## ─────────────────────────────────────────

이전 스펙과 동일. 파일 위치만 `src/realtimeBattle/` 로 수정.

`applySkill`의 `repair` 케이스에 `healAmount` 반환값 추가:
```typescript
case 'repair': {
  const healAmount = Math.floor(pData.nPMaxHP * 0.15);
  events.push({ type: 'player_hit', message: `[스킬] 긴급 수리: 내구도 ${healAmount} 회복.` });
  return { events, updatedHP: currentHP, updatedCount: count, healAmount };  // ← healAmount 추가
}
```

---

## ─────────────────────────────────────────
## STEP 6 | GrowthSystem (변경 없음, 위치만 수정)
## 파일: `src/realtimeBattle/GrowthSystem.ts`
## ─────────────────────────────────────────

이전 스펙과 동일. 파일 위치만 `src/realtimeBattle/` 로 수정.

---

## ─────────────────────────────────────────
## STEP 7 | battleStore — playerStore 연동
## 파일: `src/store/battleStore.ts`
## ─────────────────────────────────────────

```typescript
// src/store/battleStore.ts
// 기존 playerStore.ts의 레벨/XP 상태와 전투 결과를 동기화.

import { create } from 'zustand';
import { PData, buildDefaultShipPData } from '../entities/PlayerShip';
import { EnemyFleet, BattleEvent, processTurn } from '../realtimeBattle/BattleManager';
import { SkillType } from '../realtimeBattle/EnergySystem';
// 기존 playerStore에서 레벨 동기화 필요 시 import
// import { usePlayerStore } from './playerStore';

interface BattleState {
  pData:      PData;
  fleet:      EnemyFleet | null;
  log:        BattleEvent[];
  isOver:     boolean;
  isVictory:  boolean;

  initBattle: (pData: PData, mType: number, count: number) => void;
  executeTurn: (skill?: SkillType) => void;
  resetBattle: () => void;
  setPData:    (pData: PData) => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
  pData:     buildDefaultShipPData(),
  fleet:     null,
  log:       [],
  isOver:    false,
  isVictory: false,

  initBattle: (pData, mType, count) => {
    const { StarshipEngine } = require('../realtimeBattle/StarshipEngine');
    set({
      pData,
      fleet:     { mType, count, currentHP: StarshipEngine.N_M_HP[mType] },
      log:       [],
      isOver:    false,
      isVictory: false,
    });
  },

  executeTurn: (skill) => {
    const { pData, fleet, isOver } = get();
    if (!fleet || isOver) return;
    const result = processTurn(pData, fleet, skill);
    set({
      pData:     result.updatedPData,
      fleet:     result.updatedFleet,
      log:       [...get().log, ...result.events],
      isOver:    result.isOver,
      isVictory: result.isVictory,
    });
    // playerStore 레벨 동기화 (레벨업 이벤트 감지)
    // usePlayerStore.getState().syncFromBattle(result.updatedPData);
  },

  resetBattle: () => set({ fleet: null, log: [], isOver: false, isVictory: false }),
  setPData:    (pData) => set({ pData }),
}));
```

---

## ─────────────────────────────────────────
## STEP 8 | 부팅 초기화 (앱 시작 시 1회 실행)
## 위치: 앱 엔트리 또는 gameStore 초기화 블록
## ─────────────────────────────────────────

```typescript
// app/_layout.tsx 또는 gameStore.ts 초기화 블록에 추가

import { initEnemyTablesFromCSV } from '../src/realtimeBattle/StarshipEngine';

// 앱 시작 시 CSV 데이터를 StarshipEngine 배열에 주입
// csvNpcCapitalShips가 로드된 이후 실행되어야 함
initEnemyTablesFromCSV();
```

---

## ✅ 전체 체크리스트

### CSV 연동 검증
- [ ] `npm run build:content-tables` 실행 → `csvShipTemplates.ts`, `csvWeapons.ts` 생성 확인
- [ ] `csvShipTemplates[0]`에 `maxHp`, `maxShield`, `armor`, `speed` 등 컬럼 존재 확인
- [ ] `csvNpcCapitalShips` 배열 존재 확인 (없으면 `npm run build:content-tables` 재실행)
- [ ] `initEnemyTablesFromCSV()` 호출 후 `StarshipEngine.N_M_HP[0]` 값이 CSV 값과 일치 확인

### PData 생성 검증
- [ ] `csvRowToPData(csvShipTemplates[0], 0)` 호출 시 nPMinDamage ≥ 1 확인
- [ ] `nPShield > 0` 함선 선택 시 BattleManager에서 실드 흡수 이벤트 발생 확인
- [ ] `buildDefaultShipPData()`: `csvShipTemplates` 첫 행 또는 id='default' 행 로드 확인

### 전투 흐름 검증
- [ ] `initBattle()` 호출 시 `fleet.currentHP`가 CSV의 `maxHp` 값으로 초기화 확인
- [ ] laser 무기 + shielded 적: 데미지 × 1.5 적용 확인
- [ ] missile 무기 + heavy 적: 데미지 × 1.5 적용 확인
- [ ] 실드 0 이후 HP 감소 전환 확인

### 기존 코드 충돌 확인
- [ ] `src/realtimeBattle/battleArchitecture.ts` — StarshipEngine 추가 후 타입 충돌 없음 확인
- [ ] `src/store/playerStore.ts` — battleStore와 XP/레벨 중복 관리 없음 확인
- [ ] `src/sim/capitalShipKinematics.ts` — PData 타입 참조 시 필드명 불일치 없음 확인

---

## ⚠️ 미결 사항 (CSV 컬럼 추가 필요)

| 필요 데이터 | 현재 처리 | 권장 해결 |
|------------|---------|---------|
| 전함 엔진 출력(STR) | `DEFAULT_STR = 14` 고정 | `ship_stats.csv`에 `enginePower` 컬럼 추가 |
| 적함 크기 등급(SIZE) | `sizeClass = 0` 고정 | `npc_ai_ships.csv`에 `sizeClass` int 컬럼 추가 |
| 적함 방어 타입 | mType 인덱스 범위로 추정 | `npc_ai_ships.csv`에 `armorType` enum 컬럼 추가 |
| 크리티컬 기준 | `nPCritical = 19` 고정 | `ship_stats.csv`에 `criticalThreshold` 컬럼 추가 |
