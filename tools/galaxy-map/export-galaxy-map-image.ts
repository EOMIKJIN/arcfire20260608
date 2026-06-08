import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  GALAXY_SYSTEMS,
  GAMEPLAY_SYSTEM_IDS,
  LEGACY_VISIBLE_TOTAL_SYSTEMS,
  parseSynthOrdinal,
} from '../../src/data/galaxy100';

type Pt = { x: number; y: number };

const W = 4096;
const H = 4096;
const PAD = 160;

function esc(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function main() {
  const systems = Object.values(GALAXY_SYSTEMS);
  const legacySynthCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of systems) {
    minX = Math.min(minX, s.position.x);
    minY = Math.min(minY, s.position.y);
    maxX = Math.max(maxX, s.position.x);
    maxY = Math.max(maxY, s.position.y);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    throw new Error('No galaxy systems found.');
  }

  const spanX = Math.max(0.001, maxX - minX);
  const spanY = Math.max(0.001, maxY - minY);
  const sx = (W - PAD * 2) / spanX;
  const sy = (H - PAD * 2) / spanY;
  const scale = Math.min(sx, sy);
  const ox = (W - spanX * scale) / 2;
  const oy = (H - spanY * scale) / 2;

  const toPx = (p: Pt): Pt => ({
    x: ox + (p.x - minX) * scale,
    y: oy + (p.y - minY) * scale,
  });

  const byId = new Map(systems.map((s) => [s.id, s]));
  const edges = new Set<string>();
  const lines: string[] = [];
  for (const s of systems) {
    const a = toPx(s.position);
    for (const c of s.connections) {
      const k = s.id < c ? `${s.id}|${c}` : `${c}|${s.id}`;
      if (edges.has(k)) continue;
      edges.add(k);
      const t = byId.get(c);
      if (!t) continue;
      const b = toPx(t.position);
      lines.push(`<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="#4d5f80" stroke-opacity="0.48" stroke-width="1.35" />`);
    }
  }

  const circles: string[] = [];
  for (const s of systems) {
    const p = toPx(s.position);
    const ord = parseSynthOrdinal(s.id);
    const isBase = !s.id.startsWith('synth_');
    const isLegacy = ord !== null && ord <= legacySynthCount;
    const fill = isBase ? '#F4F8FF' : isLegacy ? '#8FA9D2' : '#465676';
    const stroke = isBase ? '#FFFFFF' : isLegacy ? '#C6D8F4' : '#6D7FA6';
    const r = isBase ? 3.0 : isLegacy ? 2.2 : 1.6;
    circles.push(`<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="0.75" />`);
  }

  const legend = [
    `<rect x="40" y="40" width="620" height="138" rx="12" fill="#101826" fill-opacity="0.84" stroke="#2a3a58" stroke-width="1" />`,
    `<text x="68" y="76" fill="#E9F0FF" font-size="28" font-family="monospace">Arcfire Galaxy Map (Total ${systems.length})</text>`,
    `<circle cx="78" cy="110" r="5" fill="#F4F8FF" /><text x="96" y="116" fill="#E9F0FF" font-size="20" font-family="monospace">기존 성계 (${GAMEPLAY_SYSTEM_IDS.size})</text>`,
    `<circle cx="360" cy="110" r="5" fill="#8FA9D2" /><text x="378" y="116" fill="#E9F0FF" font-size="20" font-family="monospace">미개척 synth (1..${legacySynthCount})</text>`,
    `<circle cx="78" cy="146" r="5" fill="#465676" /><text x="96" y="152" fill="#E9F0FF" font-size="20" font-family="monospace">미발견 확장 synth (${Math.max(0, systems.length - GAMEPLAY_SYSTEM_IDS.size - legacySynthCount)})</text>`,
  ];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#070b13" />
${lines.join('\n')}
${circles.join('\n')}
${legend.join('\n')}
</svg>`;

  const root = path.resolve(__dirname, '..', '..');
  const outDir = path.join(root, 'assets', 'images');
  await fs.mkdir(outDir, { recursive: true });
  const pngPath = path.join(outDir, 'galaxy_map_1000.png');
  const jpgPath = path.join(outDir, 'galaxy_map_1000.jpg');

  const raster = sharp(Buffer.from(svg));
  await raster.png({ compressionLevel: 9 }).toFile(pngPath);
  await raster.jpeg({ quality: 92 }).toFile(jpgPath);

  console.log(`Generated: ${pngPath}`);
  console.log(`Generated: ${jpgPath}`);
  console.log(`Legend: base=${GAMEPLAY_SYSTEM_IDS.size}, legacy=${legacySynthCount}, total=${systems.length}`);
  console.log(esc('done'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
