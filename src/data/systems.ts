// ============================================================
// 아크파이어 온라인 - 성계 데이터 (CSV 생성본 단일 소스)
// ============================================================

import type { StarSystem } from '../types';
import { STAR_SYSTEMS_FROM_CSV } from './generated/csvSystems';

export const STAR_SYSTEMS: Record<string, StarSystem> = STAR_SYSTEMS_FROM_CSV;

export const STARTING_SYSTEM_ID = 'arcadia';
export const STARTING_PLANET_ID = 'arcadia_prime';

export const SYSTEMS_LIST = Object.values(STAR_SYSTEMS);
