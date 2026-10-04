/**
 * 켜 둔 하니스의 상태 JSON으로 학습주기 보고 1회. 하니스는 재시작하지 않는다.
 * npx tsx tools/play-bot-console/emit-learn-cycle.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessLearnCycle, commitLearnCycle, readCombatMethod, resetLearnCycleForTest } from './src/learnCycle';
import { learnedDir } from './src/policy';

const root = path.dirname(fileURLToPath(import.meta.url));
const statusPath = path.join(root, 'logs', 'PLAYBOT_STATUS_LATEST.json');

type Status = {
  runId?: string;
  planet?: string;
  kpi?: {
    day?: number;
    level?: number;
    questCleared?: number;
    annexOk?: number;
    colonizeOk?: number;
    blue?: number;
    red?: number;
    independent?: number;
    capitalDestroyed?: number;
    credits?: number;
    combatWins?: number;
    combatLosses?: number;
  };
};

const raw = JSON.parse(fs.readFileSync(statusPath, 'utf8')) as Status;
const k = raw.kpi ?? {};
resetLearnCycleForTest();
const dir = learnedDir();
const input = {
  runId: raw.runId ?? 'unknown',
  day: k.day ?? 0,
  level: k.level ?? 1,
  questCleared: k.questCleared ?? 0,
  annexOk: k.annexOk ?? 0,
  colonizeOk: k.colonizeOk ?? 0,
  blue: k.blue ?? 0,
  red: k.red ?? 0,
  independent: k.independent ?? 0,
  capitalDestroyed: k.capitalDestroyed ?? 0,
  credits: k.credits ?? 0,
  combatWins: k.combatWins ?? 0,
  combatLosses: k.combatLosses ?? 0,
  planetId: raw.planet ?? '',
  combatMethod: readCombatMethod(dir),
  botPatchLoaded: false,
};
const row = commitLearnCycle(dir, input, Date.now());
const view = assessLearnCycle(input);
process.stdout.write(`${view.phase} wrote=${row.wrote} gaps=${view.gaps.length} sig=${view.signature}\n`);
