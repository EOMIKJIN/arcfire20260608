// ============================================================
// NPC 함장 DB — CSV 생성본을 단일 소스로 사용
// source: tables/content/npc_ai_captains.csv
// ============================================================

import type { NpcCaptain } from '../types';
import { NPC_CAPTAINS_FROM_CSV } from './generated';

export const NPC_CAPTAINS: readonly NpcCaptain[] = NPC_CAPTAINS_FROM_CSV;
