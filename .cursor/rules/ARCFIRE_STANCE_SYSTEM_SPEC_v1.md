# ArcFire — 전투 태세 시스템 스펙 v1
> **기반 문서**: `ARCFIRE_BATTLE_ENGINE_SPEC_v2.md` 완전 호환  
> **원칙**: StarshipEngine 원형 수식 수정 금지 / 태세는 "외부 수정자(modifier)"로 PData 임시 변환 후 엔진 전달  
> **플레이어 행동**: 전투 중 언제든 3가지 태세 중 하나를 활성화 → 즉시 다음 턴부터 모든 수치에 반영

---

## 1. 태세 시스템 개요

### 1-1. 3가지 전투 태세 정의

| 태세 | ID | 한줄 요약 | 운용 목적 |
|------|-----|---------|---------|
| 공격 태세 | `AGGRESSIVE` | 화력 극대화, 방어 희생 | 적을 빠르게 격파, 단기결전 |
| 방어 태세 | `DEFENSIVE` | 피해 최소화, 화력 억제 | 장기전 생존, 실드 회복 |
| 중립 태세 | `NEUTRAL` | 기본 밸런스 유지 | 상황 판단 중, 기본 상태 |

### 1-2. 태세 전환 규칙

- 플레이어는 전투 중 **매 턴마다 태세를 변경 가능**
- 태세 변경은 **즉각 적용** (전환 딜레이 없음, 쿨다운 없음)
- 태세는 **EnergySystem(스킬)**과 독립적으로 작동 — 에너지 소모 없음
- 단, **연속 공격 태세 사용 시 실드 자연 재생 정지** (아래 트리 참조)

---

## 2. 태세 연결 트리 구조 (전체)

태세는 3개의 하위 노드(무기·방어·이동)로 구성되며,
각 노드의 수정값이 StarshipEngine에 전달되는 PData를 임시 변환합니다.

```
STANCE_ROOT
│
├─── [AGGRESSIVE] 공격 태세 ───────────────────────────────────────────┐
│    │                                                                  │
│    ├── WeaponNode (무기 속성)                                         │
│    │   ├── nPAttackBonus    : +2          (명중률 강화)               │
│    │   ├── nPMinDamage      : × 1.2 ceil  (최소 피해 증가)           │
│    │   ├── nPMaxDamage      : × 1.3 ceil  (최대 피해 증가)           │
│    │   ├── nPCritical       : -1          (17~20 크리티컬, 기본 19)  │
│    │   ├── nPCriticalDamage : × 1.5       (치명타 배율 상승)         │
│    │   └── affinityBonus   : +0.1         (속성 상성 배율 추가)      │
│    │                                                                  │
│    ├── DefenseNode (방어 속성)                                        │
│    │   ├── nPACBonus        : -2          (방어력 감소)              │
│    │   ├── shieldRegenDelta : 0           (실드 자연 재생 정지)      │
│    │   └── damageReduction  : 1.0         (피해 감소 없음)           │
│    │                                                                  │
│    └── MovementNode (이동 속성)                                       │
│        ├── approachSpeedMult : 1.5        (적 접근 속도 증가)        │
│        ├── retreatSpeedMult  : 0.6        (후퇴 속도 감소)           │
│        ├── evadeChanceDelta  : -0.10      (회피율 감소)              │
│        └── salvoCountDelta   : +1         (연사 횟수 증가)           │
│                                                                       │
│    효과 요약: 화력+30%, 크리율 상승, 방어-2, 실드 재생 정지           │
│                                                                  [END]│
│
├─── [DEFENSIVE] 방어 태세 ────────────────────────────────────────────┐
│    │                                                                  │
│    ├── WeaponNode (무기 속성)                                         │
│    │   ├── nPAttackBonus    : -1          (명중률 소폭 감소)         │
│    │   ├── nPMinDamage      : × 0.8 floor (최소 피해 감소)           │
│    │   ├── nPMaxDamage      : × 0.85 floor(최대 피해 감소)           │
│    │   ├── nPCritical       : +1          (20만 크리티컬, 더 어려움) │
│    │   ├── nPCriticalDamage : 변경 없음                              │
│    │   └── affinityBonus   : 0            (속성 상성 변화 없음)      │
│    │                                                                  │
│    ├── DefenseNode (방어 속성)                                        │
│    │   ├── nPACBonus        : +3          (방어력 증가)              │
│    │   ├── shieldRegenDelta : +1/턴       (실드 1 회복/턴)           │
│    │   └── damageReduction  : 0.85        (수신 피해 15% 감소)       │
│    │                                                                  │
│    └── MovementNode (이동 속성)                                       │
│        ├── approachSpeedMult : 0.6        (적 접근 속도 감소)        │
│        ├── retreatSpeedMult  : 1.4        (후퇴/회피 이동 증가)      │
│        ├── evadeChanceDelta  : +0.15      (회피율 증가)              │
│        └── salvoCountDelta   : -1 (min 1) (연사 횟수 감소)           │
│                                                                       │
│    효과 요약: 방어+3, 피해감소15%, 실드재생, 화력-15%                 │
│                                                                  [END]│
│
└─── [NEUTRAL] 중립 태세 ──────────────────────────────────────────────┐
     │                                                                  │
     ├── WeaponNode (무기 속성)  → 모든 값 기본 PData 그대로            │
     ├── DefenseNode (방어 속성) → 모든 값 기본 PData 그대로            │
     └── MovementNode (이동 속성)→ 모든 값 기본 PData 그대로            │
                                                                        │
     효과 요약: 수정 없음. 기본 엔진 수치 그대로 작동                   │
                                                                   [END]│
```

### 태세 ↔ 속성 매핑 요약표

| 속성 | AGGRESSIVE | DEFENSIVE | NEUTRAL |
|------|-----------|-----------|---------|
| **공격 보너스** | +2 | -1 | ±0 |
| **최소 데미지** | ×1.2 | ×0.8 | ×1.0 |
| **최대 데미지** | ×1.3 | ×0.85 | ×1.0 |
| **크리티컬 기준** | -1 (쉬움) | +1 (어려움) | ±0 |
| **크리티컬 배수** | ×1.5 | ×1.0 | ×1.0 |
| **속성 상성 배율** | +0.1 | ±0 | ±0 |
| **방어 보너스** | -2 | +3 | ±0 |
| **실드 재생/턴** | 0 | +1 | 기본값 |
| **피해 감소율** | 100% | 85% | 100% |
| **접근 속도** | ×1.5 | ×0.6 | ×1.0 |
| **후퇴 속도** | ×0.6 | ×1.4 | ×1.0 |
| **회피율** | -10% | +15% | ±0 |
| **연사 수** | +1 | -1(최소1) | ±0 |

---

## 3. 신규 파일 구조

```
src/
└── realtimeBattle/
    ├── StarshipEngine.ts     ← [기존, 수정 금지]
    ├── BattleManager.ts      ← [수정] stance 파라미터 추가
    ├── AffinitySystem.ts     ← [수정] affinityBonus 인자 추가
    ├── EnergySystem.ts       ← [수정 없음]
    ├── GrowthSystem.ts       ← [수정 없음]
    ├── useBattleSimLoop.ts   ← [수정] MovementNode 연동
    └── StanceSystem.ts       ← [신규] 태세 시스템 핵심

src/
└── store/
    └── battleStore.ts        ← [수정] activeStance 상태 + setStance()
```

---

## STEP 9 | StanceSystem — 태세 시스템 핵심
## 파일: `src/realtimeBattle/StanceSystem.ts`

> ⚠️ 이 파일은 PData를 직접 수정하지 않고 **임시 복사본**을 반환합니다.
> StarshipEngine 원본 공식에 전달되는 PData는 항상 이 함수로 변환된 값입니다.

```typescript
// src/realtimeBattle/StanceSystem.ts

import type { PData } from '../entities/PlayerShip';

// ── 태세 타입 정의 ─────────────────────────────────────────────────────────
export type StanceType = 'AGGRESSIVE' | 'DEFENSIVE' | 'NEUTRAL';

// ── 이동 수정자 인터페이스 (useBattleSimLoop에 전달) ───────────────────────
export interface MovementModifiers {
  approachSpeedMult: number;   // 접근 속도 배율
  retreatSpeedMult:  number;   // 후퇴 속도 배율
  evadeChanceDelta:  number;   // 회피율 변화량 (0.0 ~ 1.0 기준)
  salvoCountDelta:   number;   // 연사 횟수 변화량 (정수)
}

// ── 태세별 트리 노드 정의 ──────────────────────────────────────────────────
interface StanceNode {
  // WeaponNode
  attackBonusDelta:   number;
  minDamageMult:      number;
  maxDamageMult:      number;
  criticalDelta:      number;   // nPCritical에 더하는 값 (음수=크리 쉬움)
  criticalDamageMult: number;
  affinityBonus:      number;   // computeAffinityMultiplier 결과에 추가

  // DefenseNode
  acBonusDelta:       number;
  shieldRegenDelta:   number;   // 턴당 실드 회복량
  damageReduction:    number;   // 수신 피해 배율 (0.85 = 15% 감소)

  // MovementNode
  movement: MovementModifiers;
}

// ── 태세 트리 상수 ─────────────────────────────────────────────────────────
const STANCE_TREE: Record<StanceType, StanceNode> = {

  AGGRESSIVE: {
    // WeaponNode
    attackBonusDelta:   +2,
    minDamageMult:       1.2,
    maxDamageMult:       1.3,
    criticalDelta:       -1,    // nPCritical 기본 19 → 18 (18,19,20 크리티컬)
    criticalDamageMult:  1.5,
    affinityBonus:       0.1,

    // DefenseNode
    acBonusDelta:        -2,
    shieldRegenDelta:    0,     // 실드 재생 없음
    damageReduction:     1.0,   // 피해 감소 없음

    // MovementNode
    movement: {
      approachSpeedMult: 1.5,
      retreatSpeedMult:  0.6,
      evadeChanceDelta:  -0.10,
      salvoCountDelta:   +1,
    },
  },

  DEFENSIVE: {
    // WeaponNode
    attackBonusDelta:   -1,
    minDamageMult:       0.8,
    maxDamageMult:       0.85,
    criticalDelta:       +1,    // nPCritical 기본 19 → 20 (20만 크리티컬)
    criticalDamageMult:  1.0,   // 변화 없음
    affinityBonus:       0.0,

    // DefenseNode
    acBonusDelta:        +3,
    shieldRegenDelta:    +1,    // 턴당 실드 1 회복
    damageReduction:     0.85,  // 수신 피해 15% 감소

    // MovementNode
    movement: {
      approachSpeedMult: 0.6,
      retreatSpeedMult:  1.4,
      evadeChanceDelta:  +0.15,
      salvoCountDelta:   -1,    // BattleManager에서 최소 1 클램프
    },
  },

  NEUTRAL: {
    // WeaponNode
    attackBonusDelta:   0,
    minDamageMult:       1.0,
    maxDamageMult:       1.0,
    criticalDelta:       0,
    criticalDamageMult:  1.0,
    affinityBonus:       0.0,

    // DefenseNode
    acBonusDelta:        0,
    shieldRegenDelta:    0,
    damageReduction:     1.0,

    // MovementNode
    movement: {
      approachSpeedMult: 1.0,
      retreatSpeedMult:  1.0,
      evadeChanceDelta:  0,
      salvoCountDelta:   0,
    },
  },
};

// ── 핵심 함수: 태세 수정자 적용 → 임시 PData 반환 ─────────────────────────
// ⚠️ 원본 pData를 변경하지 않음. StarshipEngine에 전달용 임시 복사본만 반환.
export function applyStanceModifiers(pData: PData, stance: StanceType): PData {
  const node = STANCE_TREE[stance];

  return {
    ...pData,

    // WeaponNode 적용
    nPAttackBonus:    pData.nPAttackBonus + node.attackBonusDelta,
    nPMinDamage:      Math.max(1, Math.ceil(pData.nPMinDamage * node.minDamageMult)),
    nPMaxDamage:      Math.max(1, Math.ceil(pData.nPMaxDamage * node.maxDamageMult)),
    nPCritical:       Math.min(20, Math.max(2, pData.nPCritical + node.criticalDelta)),
    nPCriticalDamage: pData.nPCriticalDamage * node.criticalDamageMult,

    // DefenseNode 적용
    nPACBonus:        pData.nPACBonus + node.acBonusDelta,
    // nPShield 재생은 BattleManager에서 직접 처리 (shieldRegenDelta)
  };
}

// ── 태세별 실드 재생량 조회 ────────────────────────────────────────────────
export function getShieldRegen(stance: StanceType): number {
  return STANCE_TREE[stance].shieldRegenDelta;
}

// ── 태세별 피해 감소 배율 조회 ────────────────────────────────────────────
export function getDamageReduction(stance: StanceType): number {
  return STANCE_TREE[stance].damageReduction;
}

// ── 태세별 속성 상성 보너스 조회 ──────────────────────────────────────────
export function getAffinityBonus(stance: StanceType): number {
  return STANCE_TREE[stance].affinityBonus;
}

// ── 태세별 이동 수정자 조회 (useBattleSimLoop 연동) ───────────────────────
export function getMovementModifiers(stance: StanceType): MovementModifiers {
  return STANCE_TREE[stance].movement;
}

// ── 태세 표시용 메타데이터 ────────────────────────────────────────────────
export const STANCE_META: Record<StanceType, { label: string; color: string; icon: string }> = {
  AGGRESSIVE: { label: '공격 태세', color: '#FF4444', icon: '⚔️' },
  DEFENSIVE:  { label: '방어 태세', color: '#4488FF', icon: '🛡️' },
  NEUTRAL:    { label: '중립 태세', color: '#AAAAAA', icon: '⚖️' },
};
```

---

## STEP 10 | BattleManager — 태세 연동
## 파일: `src/realtimeBattle/BattleManager.ts` (수정)

> 변경 범위: `processTurn` 함수 시그니처 + 내부 태세 적용 로직만 추가.
> StarshipEngine 호출 전 `applyStanceModifiers()`로 PData를 임시 변환.

```typescript
// src/realtimeBattle/BattleManager.ts
// [수정] import 추가
import {
  StanceType,
  applyStanceModifiers,
  getShieldRegen,
  getDamageReduction,
  getAffinityBonus,
} from './StanceSystem';

// [수정] BattleEvent type에 stance 이벤트 추가
export interface BattleEvent {
  type: 'player_hit' | 'player_miss' | 'player_crit' | 'enemy_hit'
      | 'enemy_miss' | 'shield_hit' | 'ship_destroyed' | 'battle_end'
      | 'stance_change';  // ← 신규
  message:    string;
  damage?:    number;
  isCritical?: boolean;
  stance?:    StanceType;  // ← 신규: 태세 변경 이벤트용
}

// [수정] processTurn 시그니처: stance 파라미터 추가
export function processTurn(
  pData:          PData,
  fleet:          EnemyFleet,
  skillThisTurn?: SkillType,
  stance:         StanceType = 'NEUTRAL',  // ← 신규 (기본값 NEUTRAL)
): TurnResult {
  const events: BattleEvent[] = [];
  let hp     = pData.nPHP;
  let shield = pData.nPShield;
  let { count, currentHP, mType } = fleet;

  // ── [신규] 태세 수정자 적용 → 임시 modifiedPData 생성 ─────────────────
  // ⚠️ 원본 pData는 건드리지 않음. StarshipEngine 호출에만 사용.
  const modifiedPData = applyStanceModifiers(pData, stance);

  // ── [신규] 태세별 실드 선재생 (DEFENSIVE: +1/턴) ──────────────────────
  const shieldRegen = getShieldRegen(stance);
  if (shieldRegen > 0) {
    shield = Math.min(pData.nPMaxShield, shield + shieldRegen);
  }

  // ── 에너지 선충전 ──────────────────────────────────────────────────────
  const updatedEnergy = regenEnergy(pData);

  // ── 스킬 또는 기본 공격 ────────────────────────────────────────────────
  let healAmount = 0;
  if (skillThisTurn && (updatedEnergy.nPEnergy ?? 0) >= getSkillCost(skillThisTurn)) {
    const skillResult = applySkill(skillThisTurn, pData, fleet);
    events.push(...skillResult.events);
    currentHP   = skillResult.updatedHP;
    count       = skillResult.updatedCount;
    healAmount  = skillResult.healAmount ?? 0;
    updatedEnergy.nPEnergy! -= getSkillCost(skillThisTurn);
  } else {
    // ── [수정] modifiedPData를 StarshipEngine에 전달 ──────────────────
    const hitResult = StarshipEngine.pAttackSuccess(modifiedPData, mType);

    if (hitResult > 0) {
      let dmg = StarshipEngine.getPDamage(modifiedPData, hitResult);

      // ── [수정] 속성 상성 + 태세 affinityBonus 합산 ───────────────────
      const baseAffinity  = computeAffinityMultiplier(pData.equippedWeaponType, mType);
      const affinityBonus = getAffinityBonus(stance);
      dmg = Math.floor(dmg * (baseAffinity + affinityBonus));

      currentHP -= dmg;
      events.push({
        type: hitResult === 2 ? 'player_crit' : 'player_hit',
        message: hitResult === 2
          ? `!!정밀타격!! 적선에 ${dmg} 치명 손상. [${stance}]`
          : `공격 명중: 적선에 ${dmg} 타격. [${stance}]`,
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

  // ── 적 반격 — Shield 우선 흡수 + [신규] 태세 피해 감소 적용 ───────────
  const dmgReduction = getDamageReduction(stance);  // ← 신규

  for (let i = 0; i < count && (hp > 0 || shield > 0); i++) {
    // ── [수정] 적 명중 판정도 modifiedPData로 (방어 수치 반영) ──────────
    if (StarshipEngine.mAttackSuccess(modifiedPData, mType)) {
      let mDmg = StarshipEngine.getMDamage(mType);

      // ── [신규] 태세 피해 감소 배율 적용 ──────────────────────────────
      mDmg = Math.ceil(mDmg * dmgReduction);

      if (shield > 0) {
        const absorbed = Math.min(shield, mDmg);
        const overflow = mDmg - absorbed;
        shield -= absorbed;
        hp     -= overflow;
        events.push({
          type: 'shield_hit',
          message: `적함 ${i+1}: 실드 ${absorbed} 흡수${overflow > 0 ? `, 선체 ${overflow} 손상` : ''}. [${stance}]`,
          damage: mDmg,
        });
      } else {
        hp -= mDmg;
        events.push({ type: 'enemy_hit', message: `적함 ${i+1} 피격: 내구도 ${mDmg} 손상. [${stance}]`, damage: mDmg });
      }
    } else {
      events.push({ type: 'enemy_miss', message: `적함 ${i+1} 공격 회피.` });
    }
  }

  hp = Math.max(0, hp + healAmount);

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

  // ── [수정] updatedPData: shield 재생 반영 (원본 pData는 불변) ──────────
  return {
    events,
    updatedPData: {
      ...pData,
      ...updatedEnergy,
      nPHP:     hp,
      nPShield: Math.max(0, shield),
    },
    updatedFleet: { mType, count, currentHP },
    isOver,
    isVictory,
  };
}
```

---

## STEP 11 | battleStore — 태세 상태 관리
## 파일: `src/store/battleStore.ts` (수정)

```typescript
// src/store/battleStore.ts
// [수정] StanceType import 추가
import { StanceType, STANCE_META } from '../realtimeBattle/StanceSystem';

interface BattleState {
  pData:        PData;
  fleet:        EnemyFleet | null;
  log:          BattleEvent[];
  isOver:       boolean;
  isVictory:    boolean;
  activeStance: StanceType;  // ← [신규] 현재 활성 태세

  initBattle:   (pData: PData, mType: number, count: number) => void;
  executeTurn:  (skill?: SkillType) => void;
  resetBattle:  () => void;
  setPData:     (pData: PData) => void;
  setStance:    (stance: StanceType) => void;  // ← [신규] 태세 변경
}

export const useBattleStore = create<BattleState>((set, get) => ({
  pData:        buildDefaultShipPData(),
  fleet:        null,
  log:          [],
  isOver:       false,
  isVictory:    false,
  activeStance: 'NEUTRAL',  // ← [신규] 기본값 중립 태세

  initBattle: (pData, mType, count) => {
    const { StarshipEngine } = require('../realtimeBattle/StarshipEngine');
    set({
      pData,
      fleet:        { mType, count, currentHP: StarshipEngine.N_M_HP[mType] },
      log:          [],
      isOver:       false,
      isVictory:    false,
      activeStance: 'NEUTRAL',  // 전투 시작 시 중립으로 초기화
    });
  },

  // [수정] executeTurn: activeStance를 processTurn에 전달
  executeTurn: (skill) => {
    const { pData, fleet, isOver, activeStance } = get();
    if (!fleet || isOver) return;
    const result = processTurn(pData, fleet, skill, activeStance);  // ← stance 추가
    set({
      pData:     result.updatedPData,
      fleet:     result.updatedFleet,
      log:       [...get().log, ...result.events],
      isOver:    result.isOver,
      isVictory: result.isVictory,
    });
  },

  // [신규] setStance: 태세 전환, 전환 이벤트 로그에 기록
  setStance: (stance) => {
    const { activeStance, log } = get();
    if (activeStance === stance) return;
    const meta = STANCE_META[stance];
    set({
      activeStance: stance,
      log: [
        ...log,
        {
          type:    'stance_change',
          message: `${meta.icon} 태세 전환: ${STANCE_META[activeStance].label} → ${meta.label}`,
          stance,
        },
      ],
    });
  },

  resetBattle: () => set({
    fleet:        null,
    log:          [],
    isOver:       false,
    isVictory:    false,
    activeStance: 'NEUTRAL',
  }),
  setPData: (pData) => set({ pData }),
}));
```

---

## STEP 12 | useBattleSimLoop — 이동 속성 태세 연동
## 파일: `src/realtimeBattle/useBattleSimLoop.ts` (수정)

> 물리 루프에 MovementNode 수정자를 주입하는 방식.
> 기존 속도 계산 로직에 배율(multiplier)만 곱하는 형태로 최소 침습 수정.

```typescript
// src/realtimeBattle/useBattleSimLoop.ts
// [수정] import 추가
import { getMovementModifiers, StanceType } from './StanceSystem';

// ── [신규] 태세 이동 수정자를 물리 루프에 주입하는 훅 파라미터 추가 ───────
// useBattleSimLoop 훅 시그니처에 activeStance 파라미터 추가 필요.
// 기존 훅이 어떤 형태인지에 따라 조정. 아래는 예시 패턴.

// 기존: useBattleSimLoop(config)
// 변경: useBattleSimLoop(config, activeStance)

export function useBattleSimLoop(
  config:       BattleSimConfig,
  activeStance: StanceType = 'NEUTRAL',  // ← [신규]
) {
  // [신규] 태세 이동 수정자 조회
  const movMod = getMovementModifiers(activeStance);

  // ── 기존 물리 루프 내 속도 적용 시 배율 주입 ─────────────────────────
  // 예시: 기존에 `ship.approachSpeed` 를 사용하는 부분에서:
  //   before: const effectiveSpeed = ship.maxMoveSpeedPxPerMs;
  //   after:  const effectiveSpeed = ship.maxMoveSpeedPxPerMs * movMod.approachSpeedMult;

  // 예시: 회피 판정 부분에서:
  //   before: const evadeChance = baseEvadeChance;
  //   after:  const evadeChance = Math.min(0.9, Math.max(0, baseEvadeChance + movMod.evadeChanceDelta));

  // 예시: 연사 처리 부분에서:
  //   before: const salvoCount = weapon.salvoCount;
  //   after:  const salvoCount = Math.max(1, weapon.salvoCount + movMod.salvoCountDelta);

  // ── [주의] useBattleSimLoop 실제 구현 코드는 기존 파일을 확인 후 수정 ──
  // 위 예시 패턴만 제시. 실제 변수명·로직은 기존 코드 기준으로 적용.
}
```

> ⚠️ **구현 주의**: `useBattleSimLoop.ts`의 실제 내부 구조를 확인하지 않았으므로
> 위 STEP 12는 패턴(가이드)만 제시합니다. 기존 코드의 변수명을 확인 후 적용하세요.

---

## 4. 태세 전환 흐름 (플레이어 UI → 전투 엔진 전달 경로)

```
[UI 버튼: 공격/방어/중립]
        │
        ▼
battleStore.setStance(stance)
        │  ─ activeStance 상태 업데이트
        │  ─ 전환 이벤트 log 기록
        ▼
battleStore.executeTurn(skill?)
        │  ─ activeStance 읽기
        ▼
BattleManager.processTurn(pData, fleet, skill, activeStance)
        │
        ├─► StanceSystem.applyStanceModifiers(pData, stance)
        │         └─► 임시 modifiedPData 생성 (PData 불변)
        │
        ├─► StarshipEngine.pAttackSuccess(modifiedPData, mType)
        │         └─► 태세 반영된 명중 판정
        │
        ├─► StarshipEngine.getPDamage(modifiedPData, hitResult)
        │         └─► 태세 반영된 데미지 계산
        │
        ├─► computeAffinityMultiplier() + getAffinityBonus(stance)
        │         └─► 태세 공격 태세 시 속성 상성 +0.1 추가
        │
        ├─► StarshipEngine.mAttackSuccess(modifiedPData, mType)
        │         └─► 태세 반영된 적 명중 판정 (AC 수정 포함)
        │
        ├─► getDamageReduction(stance)
        │         └─► 적 피해에 배율 적용 (방어 태세: ×0.85)
        │
        └─► getShieldRegen(stance)
                  └─► 방어 태세 시 실드 +1/턴 회복

        ▼
useBattleSimLoop (물리 루프)
        │
        └─► getMovementModifiers(activeStance)
                  ├─► approachSpeedMult → 접근 속도 조정
                  ├─► retreatSpeedMult  → 후퇴 속도 조정
                  ├─► evadeChanceDelta  → 회피율 조정
                  └─► salvoCountDelta   → 연사 횟수 조정
```

---

## 5. 태세별 전술 시나리오 가이드

### 시나리오 A: 단기격파 (공격 → 중립)
```
적함 등장 → [AGGRESSIVE] 전환 → 화력 집중 → 적 격침 → [NEUTRAL] 복귀
```
- 크리티컬 기준이 낮아져 빠른 격파 가능
- 실드 재생 없으므로 전투가 길어지면 위험

### 시나리오 B: 장기생존 (방어 → 공격 → 방어 반복)
```
피해 누적 → [DEFENSIVE] 전환 → 실드 회복 → [AGGRESSIVE] 전환 → 반격
```
- 방어 태세로 실드를 적극 관리하며 HP 손실 최소화
- 실드 회복 후 공격 태세로 전환해 화력 집중

### 시나리오 C: 속성 상성 극대화
```
레이저 탑재 + 실드형 적 출현 → [AGGRESSIVE] 전환
→ affinityMultiplier(1.5) + affinityBonus(0.1) = 1.6 배율 적용
```

---

## 6. AffinitySystem 수정 (최소 변경)
## 파일: `src/realtimeBattle/AffinitySystem.ts`

```typescript
// [수정] computeAffinityMultiplier에 bonus 파라미터 추가
export function computeAffinityMultiplier(
  weaponType: WeaponType | undefined,
  mType:      number,
  bonus:      number = 0,  // ← [신규] 태세 affinityBonus
): number {
  if (!weaponType) return 1.0;
  const armorType = ENEMY_ARMOR_TYPE[mType] ?? 'light';
  return AFFINITY_TABLE[weaponType][armorType] + bonus;  // ← bonus 합산
}
```

---

## ✅ 태세 시스템 체크리스트

### StanceSystem 검증
- [ ] `applyStanceModifiers(pData, 'AGGRESSIVE')` 반환값의 `nPAttackBonus` = 원본 + 2 확인
- [ ] `applyStanceModifiers(pData, 'DEFENSIVE')` 반환값의 `nPACBonus` = 원본 + 3 확인
- [ ] `applyStanceModifiers(pData, 'NEUTRAL')` 반환값 = 원본 pData와 동일 확인
- [ ] 원본 `pData`가 `applyStanceModifiers` 호출 후에도 변경되지 않음 확인 (불변성)

### BattleManager 태세 연동 검증
- [ ] `processTurn(..., 'AGGRESSIVE')` 시 데미지 ×1.3 범위 내 확인
- [ ] `processTurn(..., 'DEFENSIVE')` 시 수신 데미지 ×0.85 적용 확인
- [ ] `processTurn(..., 'DEFENSIVE')` 시 실드 +1 회복 확인 (nPMaxShield 초과 안 함)
- [ ] `processTurn(..., 'AGGRESSIVE')` 시 실드 재생 0 확인

### battleStore 태세 상태 검증
- [ ] `setStance('AGGRESSIVE')` 후 `activeStance === 'AGGRESSIVE'` 확인
- [ ] 동일 태세 재호출 시 log 중복 기록 안 함 확인
- [ ] `resetBattle()` 후 `activeStance === 'NEUTRAL'` 복귀 확인
- [ ] `executeTurn()` 호출 시 `activeStance`가 `processTurn`에 전달 확인

### 이동 수정자 검증
- [ ] `getMovementModifiers('AGGRESSIVE').approachSpeedMult === 1.5` 확인
- [ ] `getMovementModifiers('DEFENSIVE').evadeChanceDelta === 0.15` 확인
- [ ] salvoCount = `Math.max(1, base + delta)` 최솟값 1 보장 확인

### 크리티컬 범위 검증
- [ ] AGGRESSIVE: `nPCritical = 18` → 18, 19, 20 크리티컬 발생 확인
- [ ] DEFENSIVE: `nPCritical = 20` → 20만 크리티컬 발생 확인
- [ ] `Math.min(20, Math.max(2, ...))` 경계값 클램프 작동 확인

---

## ⚠️ 미결/주의 사항

| 항목 | 현재 처리 | 권장 |
|------|---------|-----|
| `useBattleSimLoop` 내부 구조 | 확인 필요 (STEP 12 패턴만 제시) | 실제 코드 확인 후 movMod 주입 |
| 태세 전환 애니메이션 | 스펙 미정 | UI 레이어에서 별도 처리 권장 |
| 적 AI 태세 시스템 | 없음 (플레이어 전용) | 향후 확장 시 `EnemyStance` 추가 고려 |
| 태세별 사운드/이펙트 트리거 | 없음 | `STANCE_META`에 sfxKey 추가 권장 |
| 태세 통계 기록 | 없음 | battleStore log에서 추출 가능 |
