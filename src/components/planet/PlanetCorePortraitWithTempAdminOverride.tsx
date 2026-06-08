// ============================================================
// 플레이어층 — 행성 허브 초상. 아크코어 `PlanetCorePortraitSvg`와 동일 SVG,
// 시작 행성만 `applyTempAdminArcadiaPortraitTint` 적용 (임시 관리자 시각 테스트).
// ============================================================

import React, { memo, useMemo } from 'react';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import { derivePlanetPortrait } from '../../arcCore/planetCorePortrait/corePortraitDerive';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import type { ZoneType } from '../../types';
import { applyTempAdminArcadiaPortraitTint } from '../../game/tempAdminArcadiaPlanetPortraitOverride';

type Props = {
  planetId: string;
  size: number;
  zone: ZoneType;
  coreGauges: PlanetCoreGaugeView;
  combatMuted?: boolean;
};

export const PlanetCorePortraitWithTempAdminOverride = memo(function PlanetCorePortraitWithTempAdminOverride({
  planetId,
  size,
  zone,
  coreGauges,
  combatMuted,
}: Props) {
  const d = useMemo(() => {
    const raw = derivePlanetPortrait({ planetId, zone, core: coreGauges, combatMuted });
    return applyTempAdminArcadiaPortraitTint(planetId, raw, { combatMuted });
  }, [planetId, zone, coreGauges, combatMuted]);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="행성 핵심 초상">
      <Defs>
        <RadialGradient id={d.gradId} cx="38%" cy="32%" rx="78%" ry="78%" fx="35%" fy="28%">
          <Stop offset="0%" stopColor={d.highlight} stopOpacity="0.42" />
          <Stop offset="100%" stopColor={d.baseFill} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={47.5} fill={`url(#${d.gradId})`} stroke={d.ring} strokeWidth={1.4} />
      {d.spokes.map((s, i) => (
        <Line
          key={`sp-${i}`}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke={s.stroke}
          strokeOpacity={s.opacity}
          strokeWidth={s.sw}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={50} cy={50} r={d.innerBulge} fill={d.innerCore} opacity={0.5} />
    </Svg>
  );
});
