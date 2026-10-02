/**
 * DEV logcat [MEM_PROFILE] / owner-playlog session.log → SessionTrace v0 시드.
 * 앱 변경 없음.
 */
import fs from 'node:fs';
import path from 'node:path';
import { defaultMemProfilePath, importHumanSeedFromMemProfile } from './src/refreshHumanSeed';
import type { SessionKind } from './src/humanSeed';
import { learnedDir } from './src/policy';

function arg(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return fallback;
  return process.argv[i + 1];
}

function has(flag: string): boolean {
  return process.argv.includes(flag);
}

const input = arg('--in', defaultMemProfilePath());
if (!fs.existsSync(input)) {
  console.error(`mem_profile_missing ${input}`);
  process.exit(1);
}

const kindRaw = arg('--kind', '');
const kind = kindRaw === 'qa' || kindRaw === 'profiler' || kindRaw === 'human'
  ? kindRaw as SessionKind
  : undefined;
const force = has('--force-kind');

const out = importHumanSeedFromMemProfile(input, {
  outDir: arg('--out-dir', learnedDir()),
  runId: arg('--run-id', ''),
  defaultKind: kind,
  forceKind: force ? (kind ?? 'human') : undefined,
  capturedFrom: path.basename(input.includes(`${path.sep}human-raw${path.sep}`) ? path.dirname(input) : input),
});
if (!out) {
  console.error('mem_profile_no_beats');
  process.exit(2);
}
console.log(`human_seed=${out.dest} sessions=${out.sessions} human=${out.human} beats=${out.beats}`);
