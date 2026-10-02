/**
 * S4 CLI — adb pull + owner-playlog/mem-profile → human-seed.
 * npx tsx tools/play-bot-console/refresh-human-seed.ts [--force]
 */
import { refreshHumanSeedForDaily } from './src/refreshHumanSeed';

const force = process.argv.includes('--force');
const out = refreshHumanSeedForDaily({ force });
console.log(`human_seed_refresh imported=${out.imported} ${out.reason} pulled=${out.pulled ?? 0}`);
process.exit(out.imported || out.reason === 'seed_fresh' ? 0 : 1);
