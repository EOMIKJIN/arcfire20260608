// ============================================================
// 팩션 정치관계 — Table-First 정본 (tables/balance/faction_political_relations.csv)
// 적대·동맹 관계와 「동맹 보급(allySupplyEnabled)」 변수를 관리한다.
// 동맹 보급은 기반만 구축 · 기본 OFF — 향후 CSV 값으로만 활성화 (대표님 결정 2026-07-21).
// 국가 추가(녹색 독립국 등) 시 CSV 행만 확장한다.
// ============================================================

import { FactionPoliticalRelations_FROM_BALANCE_CSV } from '../../data/balance/generated';

/** 정치관계 팩션 토큰 — TerritorialFactionSide 확장 로드맵(INDEPENDENT=플레이어 독립국) 포함 */
export type PoliticalFactionToken = 'BLUE' | 'RED' | 'INDEPENDENT';

export type FactionRelationKind = 'hostile' | 'ally' | 'neutral';

export type FactionPoliticalRelation = {
  relation: FactionRelationKind;
  /** 동맹 보급 — true면 동맹 점유 성계를 보급 노드로 인정 (기본 false) */
  allySupplyEnabled: boolean;
};

function parseRelation(raw: string): FactionRelationKind {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'hostile') return 'hostile';
  if (v === 'ally') return 'ally';
  return 'neutral';
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

let relationIndex: Map<string, FactionPoliticalRelation> | null = null;

function getRelationIndex(): Map<string, FactionPoliticalRelation> {
  if (!relationIndex) {
    const m = new Map<string, FactionPoliticalRelation>();
    for (const row of FactionPoliticalRelations_FROM_BALANCE_CSV) {
      const a = String(row.factionA ?? '').trim().toUpperCase();
      const b = String(row.factionB ?? '').trim().toUpperCase();
      if (!a || !b || a === b) continue;
      m.set(pairKey(a, b), {
        relation: parseRelation(row.relation),
        allySupplyEnabled:
          String(row.allySupplyEnabled ?? '').trim().toLowerCase() === 'true',
      });
    }
    relationIndex = m;
  }
  return relationIndex;
}

/** 두 팩션의 관계 — CSV 미정의 쌍은 neutral */
export function getFactionRelation(
  a: PoliticalFactionToken,
  b: PoliticalFactionToken,
): FactionPoliticalRelation {
  if (a === b) return { relation: 'ally', allySupplyEnabled: false };
  return (
    getRelationIndex().get(pairKey(a, b)) ?? { relation: 'neutral', allySupplyEnabled: false }
  );
}

export function isHostileFactionPair(
  a: PoliticalFactionToken,
  b: PoliticalFactionToken,
): boolean {
  return getFactionRelation(a, b).relation === 'hostile';
}

/**
 * 보급 인정 팩션 목록 — 자기 자신 + 「동맹 보급 ON」 동맹만.
 * 현재 CSV 전부 allySupplyEnabled=false → [side] 단독 (기존 동작과 동일).
 */
export function listSupplyEligibleFactions(
  side: PoliticalFactionToken,
): PoliticalFactionToken[] {
  const out: PoliticalFactionToken[] = [side];
  const candidates: PoliticalFactionToken[] = ['BLUE', 'RED', 'INDEPENDENT'];
  for (const other of candidates) {
    if (other === side) continue;
    const rel = getFactionRelation(side, other);
    if (rel.relation === 'ally' && rel.allySupplyEnabled) out.push(other);
  }
  return out;
}

/** 테스트·핫리로드 — CSV 재빌드 후 캐시 무효화 */
export function invalidateFactionPoliticalRelationsCache(): void {
  relationIndex = null;
}
