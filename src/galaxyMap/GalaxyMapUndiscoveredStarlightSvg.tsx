import React, { memo, useMemo } from 'react';
import { Path } from 'react-native-svg';
import type { StarSystem } from '../types';

/**
 * 미발견 성계 위 흐린 별빛(도트) — 노드/라인/라벨 없이 색×opacity 스타일별
 * 배칭 Path 소수(최대 DOT_COLORS×OPACITY_BUCKETS개)로만 렌더한다.
 * systemId 결정적 해시로 표시 여부·밝기·색을 고르므로 매 렌더 동일 결과(Math.random 금지).
 */

const SHOW_PCT = 36;
const DOT_COLORS = ['#eaf3ff', '#bfe0ff', '#93cdf2'] as const;
const OPACITY_BUCKETS = [0.06, 0.14, 0.23, 0.33, 0.45] as const;
const DOT_STROKE_WIDTH = 1.3;

function hashStringToU32(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type StarlightPath = {
  key: string;
  d: string;
  color: string;
  opacity: number;
};

export const GalaxyMapUndiscoveredStarlightSvg = memo(function GalaxyMapUndiscoveredStarlightSvg({
  systems,
  toScreen,
}: {
  systems: readonly StarSystem[];
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}) {
  const paths = useMemo<StarlightPath[]>(() => {
    const groups = new Map<string, { color: string; opacity: number; parts: string[] }>();
    for (const s of systems) {
      const h = hashStringToU32(s.id);
      if (h % 100 >= SHOW_PCT) continue;
      const color = DOT_COLORS[(h >>> 8) % DOT_COLORS.length]!;
      const opacity = OPACITY_BUCKETS[(h >>> 16) % OPACITY_BUCKETS.length]!;
      const key = `${color}|${opacity}`;
      let group = groups.get(key);
      if (!group) {
        group = { color, opacity, parts: [] };
        groups.set(key, group);
      }
      const p = toScreen(s.position);
      group.parts.push(`M${p.x.toFixed(1)} ${p.y.toFixed(1)}l0.01 0`);
    }
    const out: StarlightPath[] = [];
    let idx = 0;
    for (const [key, group] of groups) {
      out.push({ key: `starlight-${idx}-${key}`, d: group.parts.join(''), color: group.color, opacity: group.opacity });
      idx += 1;
    }
    return out;
  }, [systems, toScreen]);

  if (paths.length === 0) return null;

  return (
    <>
      {paths.map((p) => (
        <Path
          key={p.key}
          d={p.d}
          stroke={p.color}
          strokeWidth={DOT_STROKE_WIDTH}
          strokeLinecap="round"
          opacity={p.opacity}
          fill="none"
        />
      ))}
    </>
  );
});
