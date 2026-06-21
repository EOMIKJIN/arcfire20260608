// ============================================================
// 아크파이어 온라인 - 미션/퀘스트 데이터
// 목표 타입·완료 규약: ../missions/missionObjectiveDsl.ts (스키마 v1)
// ============================================================

import { Mission } from '../types';

export const MISSIONS: Record<string, Mission> = {

  // ── 1번 미션 (튜토리얼) ────────────────────────────────────

  mission_001: {
    id: 'mission_001',
    title: '첫 비행',
    description:
      '함장, 연방의 임무가 내려왔습니다. 베가 전초기지 행성에 진입하여 지휘관 마코프를 만나십시오.',
    type: 'travel',
    objectives: [
      {
        id: 'obj_001_a',
        description: '베가 전초기지 행성 진입',
        type: 'reach_planet',
        targetId: 'vega_base',
        complete: false,
      },
    ],
    rewards: {
      credits: 500,
      exp: 150,
    },
    prerequisiteIds: [],
    nextMissionId: 'mission_002',
    dc: 0,
  },

  // ── 2번 미션 ──────────────────────────────────────────────

  mission_002: {
    id: 'mission_002',
    title: '해적 소탕',
    description:
      '마코프 지휘관의 요청: 아르카디아 주변 해적 1척을 격파하고 돌아오십시오.',
    type: 'combat',
    objectives: [
      {
        id: 'obj_002_a',
        description: '해적 전투기 격파 (1대)',
        type: 'defeat_enemy',
        targetId: 'pirate_fighter',
        quantity: 1,
        complete: false,
      },
    ],
    rewards: {
      credits: 1000,
      exp: 300,
      skillPointBonus: 1,
    },
    prerequisiteIds: ['mission_001'],
    nextMissionId: 'mission_003',
    dc: 12,
  },

  // ── 3번 미션 ──────────────────────────────────────────────

  mission_003: {
    id: 'mission_003',
    title: '무역 루트 개척',
    description:
      '솔라 항구에서 식량 팩 10개를 구매하여 미네르바로 운반하십시오.',
    type: 'delivery',
    objectives: [
      {
        id: 'obj_003_a',
        description: '솔라 항구에서 식량 팩 구매 (10개)',
        type: 'buy_goods',
        targetId: 'food',
        quantity: 10,
        complete: false,
      },
      {
        id: 'obj_003_b',
        description: '미네르바로 배달',
        type: 'reach_system',
        targetId: 'minerva',
        complete: false,
      },
    ],
    rewards: {
      credits: 1500,
      exp: 400,
    },
    prerequisiteIds: ['mission_002'],
    nextMissionId: 'mission_004',
    dc: 10,
  },

  // ── 4번 미션 ──────────────────────────────────────────────

  mission_004: {
    id: 'mission_004',
    title: '중립 지대 탐험',
    description:
      '중립 구역의 뉴 에덴으로 이동하여 현지 상황을 파악하십시오. 위험 지역입니다.',
    type: 'explore',
    objectives: [
      {
        id: 'obj_004_a',
        description: '뉴 에덴 도착',
        type: 'reach_system',
        targetId: 'new_eden',
        complete: false,
      },
    ],
    rewards: {
      credits: 2000,
      exp: 600,
      skillPointBonus: 1,
    },
    prerequisiteIds: ['mission_003'],
    nextMissionId: 'mission_005',
    dc: 14,
  },

  // ── 5번 미션 ──────────────────────────────────────────────

  mission_005: {
    id: 'mission_005',
    title: '은하의 심장을 향해',
    description:
      '오메가 스테이션으로 이동하라. 그 곳에서 아크파이어 코어의 단서를 얻을 수 있다.',
    type: 'explore',
    objectives: [
      {
        id: 'obj_005_a',
        description: '오메가 스테이션 도착',
        type: 'reach_system',
        targetId: 'omega_station',
        complete: false,
      },
    ],
    rewards: {
      credits: 5000,
      exp: 1000,
      skillPointBonus: 2,
    },
    prerequisiteIds: ['mission_004'],
    nextMissionId: null,
    dc: 16,
  },
};

export const MISSIONS_LIST = Object.values(MISSIONS);
export const FIRST_MISSION_ID = 'mission_001';
