#!/usr/bin/env node
/**
 * assets/images/npc 의 고정 레거시 + npc_cpt_*.png + Player_pilot.png 로
 * npcCaptainPortraitAssets.ts require 맵을 재작성한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const npcDir = path.join(root, 'assets/images/npc');
const outPath = path.join(root, 'src/game/npcCaptainPortraitAssets.ts');

const LEGACY = [
  'stella_aris_char001.png',
  'mia_bello_char002.png',
  'noname_char003.png',
  'noname_char004.png',
  'noname_char005.png',
  'noname_char006.png',
  'noname_char007.png',
  'noname_char008.png',
  'noname_char009.png',
  'noname_char010.png',
];

const files = fs
  .readdirSync(npcDir)
  .filter((f) => /\.png$/i.test(f))
  .sort();

const unique = files.filter((f) => f.startsWith('npc_cpt_') || f === 'Player_pilot.png');

function entry(file) {
  const key = `assets/images/npc/${file}`;
  return `  '${key}': require('../../${key}'),`;
}

const lines = [
  `import { Image, type ImageSourcePropType } from 'react-native';`,
  ``,
  `/**`,
  ` * CSV \`portraitImageAssetKey\` → Metro 정적 require.`,
  ` * 새 PNG: assets/images/npc/ 저장 후 \`npm run\` ingest 또는 본 스크립트 재실행.`,
  ` * 픽셀 규격: npcPortraitPixelContract.ts (240×240).`,
  ` * 금지: listCriticalSessionImageSources 에 함장 초상 전수 편입.`,
  ` */`,
  `const NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {`,
  ...LEGACY.map(entry),
  `  /** story_scene_pages 레거시 키 — npc/ 하위와 동일 에셋 */`,
  `  'assets/images/stella_aris_char001.png': require('../../assets/images/npc/stella_aris_char001.png'),`,
  `  /** 테이블 고유 정본 */`,
  ...unique.map(entry),
  `};`,
  ``,
  `export function resolveNpcCaptainPortraitSource(`,
  `  key: string | undefined | null,`,
  `): ImageSourcePropType | null {`,
  `  if (key == null) return null;`,
  `  const k = String(key).trim();`,
  `  if (!k) return null;`,
  `  return NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY[k] ?? null;`,
  `}`,
  ``,
  `export function listNpcCaptainPortraitSources(): ImageSourcePropType[] {`,
  `  return Object.values(NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY);`,
  `}`,
  ``,
  `export function resolveNpcCaptainPortraitAspectRatio(`,
  `  source: ImageSourcePropType | null | undefined,`,
  `): number | null {`,
  `  if (source == null) return null;`,
  `  const resolved = Image.resolveAssetSource(source);`,
  `  const w = resolved?.width;`,
  `  const h = resolved?.height;`,
  `  if (!w || !h) return null;`,
  `  return w / h;`,
  `}`,
  ``,
];

fs.writeFileSync(outPath, lines.join('\n'));
console.log(`wrote ${outPath} legacy=${LEGACY.length} unique=${unique.length}`);
