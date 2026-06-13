'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const planetPath = path.join(ROOT, 'app', '(game)', 'planet.tsx');
const src = fs.readFileSync(planetPath, 'utf8');
const lines = src.split(/\r?\n/);

const hubDir = path.join(ROOT, 'src', 'components', 'planet', 'planetHub');
fs.mkdirSync(hubDir, { recursive: true });

const styleLines = lines.slice(2283, 3077);
const styleHeader = [
  '// planet hub styles — extracted from app/(game)/planet.tsx',
  "import { Platform, StyleSheet } from 'react-native';",
  "import { COLORS, FONTS, SPACING } from '../../../utils/theme';",
  "import {",
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX,',
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_X_PX,',
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_Y_PX,',
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX,',
  '  PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX,',
  '  PLANET_MAIN_BOTTOM_FEATURE_RESERVE_PX,',
  '  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,',
  '  PLANET_MAIN_TOPBAR_BORDER_BOTTOM_PX,',
  '  PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,',
  '  PLANET_MAIN_TOPBAR_ICON_BUTTON_PX,',
  '  PLANET_MAIN_TOPBAR_PADDING_HORIZONTAL,',
  '  PLANET_MAIN_TOPBAR_PADDING_VERTICAL,',
  "} from '../../../stages/planetMainStageLayout';",
  "import {",
  '  INFO_LOG_CONTENT_PAD_BOTTOM,',
  '  INFO_LOG_LINE_HEIGHT_PX,',
  '  INFO_LOG_ROW_GAP_PX,',
  '  PLANET_HUB_CAPITAL_COMBAT_DIM_OPACITY,',
  '  PLANET_HUB_CAPITAL_COMBAT_GRAY,',
  '  PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y,',
  '  PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X,',
  "} from '../../../game/planetHub/planetHubConstants';",
  '',
].join('\n');

let styleBody = styleLines.join('\n');
styleBody = styleBody.replace(/^const styles = StyleSheet.create/m, 'export const planetHubStyles = StyleSheet.create');
styleBody = styleBody.replace(/^const bgStyles = StyleSheet.create/m, 'export const planetHubBgStyles = StyleSheet.create');
fs.writeFileSync(path.join(hubDir, 'planetHubStyles.ts'), styleHeader + styleBody + '\n');

const subLines = lines.slice(1302, 2282);
const subHeader = [
  '// planet hub subcomponents — extracted from app/(game)/planet.tsx',
  "import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';",
  "import { View, Text, ScrollView, useWindowDimensions, Platform } from 'react-native';",
  "import type { LayoutChangeEvent } from 'react-native';",
  "import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';",
  "import Svg, { Line, Polyline } from 'react-native-svg';",
  "import Ionicons from '@expo/vector-icons/Ionicons';",
  "import { COLORS, FONTS, SPACING, ZONE_LABELS, ZONE_COLORS } from '../../../utils/theme';",
  "import type { StarSystem, ZoneType } from '../../../types';",
  "import type { PlanetCoreGaugeView } from '../../../store/planetCoreRuntimeStore';",
  "import { planetCoreRuntimeToGaugeView, planetCsvBaselineToRuntime, usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';",
  "import { usePlanetNebulaStore } from '../../../store/planetNebulaStore';",
  "import { usePlayerStore } from '../../../store/playerStore';",
  "import type { ArcNpcTrafficShip } from '../../../store/arcNpcTrafficStore';",
  "import { PlanetCorePortraitWithTempAdminOverride } from '../PlanetCorePortraitWithTempAdminOverride';",
  "import { PlanetHubOrbitSkiaLayer } from '../PlanetHubOrbitSkiaLayer';",
  "import { SkiaPlanetNebulaShaderBackdrop } from '../SkiaPlanetNebulaShaderBackdrop';",
  "import { resolveMainStageSkiaBackdrop } from '../../../game/mainStageSkiaBackdrop';",
  "import { resolvePlanetNebulaBakedSource } from '../../../game/planetNebulaBakedAssets';",
  "import {",
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_AFTER_NAME_GAP_PX,',
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_X_PX,',
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_OFFSET_Y_PX,',
  '  PLANET_MAIN_BACKGROUND_CLAN_PLATE_SLOT_HEIGHT_PX,',
  '  PLANET_MAIN_BACKGROUND_SYSTEM_NAME_MIN_HEIGHT_PX,',
  '  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,',
  "} from '../../../stages/planetMainStageLayout';",
  "import type { CapitalRealtimeCombatSim } from '../../../combat/capitalRealtimeTypes';",
  "import type { DefenseInterceptVisualPlan } from '../../../arcCore/message/defenseInterceptVisualPlan';",
  "import type { WorldObject } from '../../../worldObjects';",
  "import { WORLD_OBJECT_DEFENSE_SATELLITE_ORBIT_CYCLE_MS, WORLD_OBJECT_ORBIT_CYCLE_MS } from '../../../worldObjects/planetWorldObjectOrbit';",
  "import { PlanetArcCoreMessageMissileSkiaLayer } from '../PlanetArcCoreMessageMissileSkiaLayer';",
  "import { PlanetDefenseInterceptMissileSkiaLayer } from '../PlanetDefenseInterceptMissileSkiaLayer';",
  "import {",
  '  INFO_LOG_SCROLL_VIEWPORT_PX,',
  '  INFO_LOG_VIEWPORT_ROWS,',
  '  PLANET_HUB_CAPITAL_COMBAT_GRAY,',
  '  PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y,',
  '  PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X,',
  '  PLANET_MAIN_ORBIT_VISUAL_LIFT_PX,',
  '  splitNearbyInfoLine,',
  "} from '../../../game/planetHub/planetHubConstants';",
  "import { planetHubStyles as styles, planetHubBgStyles as bgStyles } from './planetHubStyles';",
  '',
  'export const ORBIT_CENTER = ORBIT_SCENE_SIZE / 2;',
  '',
  'export type NearbyInfoRow = { keySlot: number; line: string };',
  '',
].join('\n');

let subBody = subLines.join('\n');
subBody = subBody.replace(/^const ORBIT_CENTER = ORBIT_SCENE_SIZE \/ 2;/m, '');
subBody = subBody.replace(/^const PLANET_MAIN_ORBIT_VISUAL_LIFT_PX = 14;/m, '');
subBody = subBody.replace(/^function splitNearbyInfoLine[\s\S]*?^}\n\n/m, '');
subBody = subBody.replace(/^type NearbyInfoRow = \{ keySlot: number; line: string \};\n\n/m, '');
subBody = subBody.replace(/^function NearbyShipInfoPanel/m, 'export function NearbyShipInfoPanel');
subBody = subBody.replace(/^function PlanetCoreGaugeRow/m, 'export function PlanetCoreGaugeRow');
subBody = subBody.replace(/^function PlanetDot/m, 'export function PlanetDot');
subBody = subBody.replace(/^const PlanetStageBackground = memo\(function PlanetStageBackground/m, 'export const PlanetStageBackground = memo(function PlanetStageBackground');

fs.writeFileSync(path.join(hubDir, 'planetHubSubcomponents.tsx'), subHeader + subBody + '\n');

// Build slim planet.tsx
let screenPart = lines.slice(0, 1301).join('\n');
screenPart = screenPart.replace(
  /\/\*\* 행성 허브 궤도 worklet[\s\S]*?(?=export default function PlanetScreen)/,
  '',
);

const extraImports = [
  "import { NearbyShipInfoPanel, PlanetStageBackground } from '../../src/components/planet/planetHub/planetHubSubcomponents';",
  "import { planetHubStyles as styles } from '../../src/components/planet/planetHub/planetHubStyles';",
  "import {",
  '  EDEN_COMBAT_HUD_BLOCK_PX,',
  '  formatPilotExp8,',
  '  hasEnemyFleetEnteredPlanetOrbit,',
  '  NPC_ORBIT_CYCLE_MS,',
  '  ORBIT_FLAT_STRIDE,',
  '  ORBIT_FRAME_DT_MAX_MS,',
  '  orbitCaptainCaptionFromLine,',
  '  PLANET_MAIN_STANCE_ROW_HEIGHT_EST_PX,',
  '  resolvePlanetBattleReadyDurationMs,',
  '  splitStoryTextByMaxLines,',
  "} from '../../src/game/planetHub/planetHubConstants';",
  "import { usePlanetHubArcCoreWarningBlink } from '../../src/game/planetHub/usePlanetHubArcCoreWarningBlink';",
  "import { usePlanetHubBattleReady } from '../../src/game/planetHub/usePlanetHubBattleReady';",
  "import { usePlanetHubInfoDistanceSort } from '../../src/game/planetHub/usePlanetHubInfoDistanceSort';",
  '',
].join('\n');

screenPart = screenPart.replace(
  "import type { DefenseInterceptVisualPlan } from '../../src/arcCore/message/defenseInterceptVisualPlan';",
  "import type { DefenseInterceptVisualPlan } from '../../src/arcCore/message/defenseInterceptVisualPlan';\n" + extraImports,
);

fs.writeFileSync(planetPath, screenPart);
console.log('OK — styles', styleLines.length, 'sub', subLines.length);
