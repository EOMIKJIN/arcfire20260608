/**
 * 플레이봇 성능 벤치. 같은 시드·일수로 트윈을 돌려 진행 지표를 비교한다.
 * 정책·카드·learned 파일은 읽지도 쓰지도 않는다(기본 페르소나 가중 · 기본 카드).
 * npx tsx tools/play-bot-console/bench-bot.ts [days=1200] [seeds=4] [mineCap] [fairFightMin]
 * 카드 인자를 주면 임시 폴더에 카드를 써서 그 값으로 돌린다(learned 무관).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listPlayableMissionIds } from './src/catalog';
import { hullFundGap, nextHullStep } from './src/combatEfficiency';
import { humanSecondsFor, loadHumanClock } from './src/humanClock';
import { toolRoot } from './src/io';
import { tgRouteStats } from './src/tradeRun';
import type { JournalKind } from './src/types';
import { defaultPlayIntelligence, savePlayIntelligence } from './src/playIntelligence';
import { runSimulation } from './src/simulate';
import { emptyStallMemory, stepStall } from './src/stallReplay';
import { snapshotKpi } from './src/world';

type Row = {
  seed: number;
  level: number;
  quests: number;
  storyCleared: number;
  hullRank: number;
  credits: number;
  destroys: number;
  wins: number;
  annex: number;
  colonize: number;
  fuel: number;
  /** 하네스라면 재시작했을 정체 횟수. hard=성장 정지 · section=구간 정지. 평균만 보면 중간 정체를 놓친다. */
  hardStalls: number;
  sectionStalls: number;
  firstStall: string;
  /** 사람 기준 누적 플레이 시간(h). fast=중앙값 손 · real=평균(메뉴·대기 포함) */
  hoursFast: number;
  hoursReal: number;
  /** 첫 상위 함선 값이 레벨상 열렸는데 돈이 모자란 시점 → 실제 구매 시점 (사람 h · 트윈 일). -1 = 미도달 */
  hullWallStartH: number;
  hullBuyH: number;
  hullWallDays: number;
  hullTarget: string;
  story014H: number;
  tgTrips: number;
  tgNet: number;
};

function main(): void {
  const days = Number(process.argv[2] || 1200);
  const seeds = Number(process.argv[3] || 4);
  const playable = listPlayableMissionIds().length;
  const card = defaultPlayIntelligence();
  if (process.argv[4]) card.mineCap = Number(process.argv[4]);
  if (process.argv[5]) card.fairFightMin = Number(process.argv[5]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'playbot-bench-'));
  savePlayIntelligence(tmp, card, Date.now());
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`card mineCap=${card.mineCap} fairFightMin=${card.fairFightMin}`);
  const clock = loadHumanClock(path.join(toolRoot(), 'logs', 'learned'));
  const tg = tgRouteStats();
  console.log(`human-clock sessions=${clock.sessions} assumed=${clock.assumed.join(',') || '-'} · tg routes profitable=${tg.profitable} losing=${tg.losing} fee=${tg.feePct}%`);
  const rows: Row[] = [];
  for (let s = 1; s <= seeds; s += 1) {
    let fuel = 0;
    let mem = emptyStallMemory();
    let hardStalls = 0;
    let sectionStalls = 0;
    let firstStall = '';
    let secFast = 0;
    let secReal = 0;
    let prevKind: JournalKind | '' = '';
    let wallStartH = -1;
    let wallStartDay = -1;
    let buyH = -1;
    let buyDay = -1;
    let hullTarget = '';
    let story014H = -1;
    let tgTrips = 0;
    let tgNet = 0;
    const fuelRe = /연료 -(\d+)cr/;
    const tgBuyRe = /^교역 매입 .* -(\d+)cr/;
    const tgSellRe = /^교역 매도 .* \+(\d+)cr/;
    const { world } = runSimulation({
      persona: 'mixed_ref',
      days,
      seed: s,
      runId: `bench-${s}`,
      allowSides: true,
      stronger: false,
      hooks: {
        onEntry: (w, e) => {
          const m = fuelRe.exec(e.line);
          if (m) fuel += Number(m[1]);
          const [f, r] = humanSecondsFor(clock, e, prevKind);
          secFast += f;
          secReal += r;
          if (f > 0) prevKind = e.kind;
          const tb = tgBuyRe.exec(e.line);
          if (tb) tgNet -= Number(tb[1]);
          const ts = tgSellRe.exec(e.line);
          if (ts) {
            tgNet += Number(ts[1]);
            tgTrips += 1;
          }
          if (wallStartH < 0 && (w.hullRank ?? 0) === 0 && hullFundGap(w) > 0) {
            wallStartH = secFast / 3600;
            wallStartDay = w.day;
            hullTarget = `${nextHullStep(w)?.key ?? '?'} ${nextHullStep(w)?.price ?? 0}cr Lv${nextHullStep(w)?.levelReq ?? 0}`;
          }
          if (buyH < 0 && (w.hullRank ?? 0) >= 1) {
            buyH = secFast / 3600;
            buyDay = w.day;
          }
          if (story014H < 0 && w.completedMissionIds.includes('story_014')) story014H = secFast / 3600;
        },
        onDay: (w) => {
          const k = snapshotKpi(w);
          const r = stepStall(mem, {
            day: w.day,
            level: k.level,
            totalExp: k.totalExp,
            questCleared: k.questCleared,
            annexOk: k.annexOk,
            colonizeOk: k.colonizeOk,
            independent: k.independent,
            devSum: k.devSum,
            combatWins: k.combatWins,
            credits: k.credits,
          });
          mem = r.mem;
          if (!r.restart) return;
          if (r.reason === 'hard') hardStalls += 1;
          else sectionStalls += 1;
          if (!firstStall) firstStall = `${r.reason} D${w.day} L${k.level} Q${k.questCleared}`;
          mem = emptyStallMemory();
        },
      },
    });
    let story = 0;
    for (let i = 0; i < world.completedMissionIds.length; i += 1) {
      if (world.completedMissionIds[i].startsWith('story_')) story += 1;
    }
    rows.push({
      seed: s,
      level: world.level,
      quests: world.questCleared,
      storyCleared: story,
      hullRank: world.hullRank ?? 0,
      credits: world.credits,
      destroys: world.shipDestroys,
      wins: world.combatWins,
      annex: world.annexOk,
      colonize: world.colonizeOk,
      fuel,
      hardStalls,
      sectionStalls,
      firstStall,
      hoursFast: Math.round((secFast / 3600) * 10) / 10,
      hoursReal: Math.round((secReal / 3600) * 10) / 10,
      hullWallStartH: Math.round(wallStartH * 10) / 10,
      hullBuyH: Math.round(buyH * 10) / 10,
      hullWallDays: buyDay >= 0 && wallStartDay >= 0 ? buyDay - wallStartDay : -1,
      hullTarget,
      story014H: Math.round(story014H * 10) / 10,
      tgTrips,
      tgNet,
    });
  }
  const avg = (k: keyof Row) => Math.round(rows.reduce((a, r) => a + Number(r[k]), 0) / rows.length);
  console.log(`bench days=${days} seeds=${seeds} playable=${playable}`);
  for (let i = 0; i < rows.length; i += 1) console.log(JSON.stringify(rows[i]));
  console.log(JSON.stringify({
    avg: {
      level: avg('level'),
      quests: avg('quests'),
      story: avg('storyCleared'),
      hullRank: avg('hullRank'),
      destroys: avg('destroys'),
      fuel: avg('fuel'),
      annex: avg('annex'),
      colonize: avg('colonize'),
    },
    total: {
      hardStalls: rows.reduce((a, r) => a + r.hardStalls, 0),
      sectionStalls: rows.reduce((a, r) => a + r.sectionStalls, 0),
    },
  }));
}

main();
