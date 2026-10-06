/**
 * O4 (=D3) 스텔라 선제 빈도 검증 (설계 §C-8).
 * npx tsx tools/play-bot-console/stella-verify.ts [days=600] [seeds=4] [runId]
 * 시나리오 두 개를 같은 봇 플레이로 돌린다:
 *   timer — 지금 앱 그대로 (허브 타이머 대화 요청 「나야, 스텔라.」 8~15분 + 관찰 선제)
 *   judge — 대표님 결정안 (2026-10-06): 타이머 없음 · 일상 질문도 같은 판단
 * 보고서 → reports/stella-proactive/<runId>.md · 행 후보 → out/stella-proactive/<runId>-<시나리오>-candidates.csv (Fable 반영용)
 * learned·정책 카드는 읽지도 쓰지도 않는다. 표는 includeDisabled 로 전 행을 본다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getStellaObserveGatePolicy, listStellaObserveSituations } from '../../src/arcCore/chat/stellaObserveTableIndex';
import { loadHumanClock, type HumanClock } from './src/humanClock';
import { toolRoot } from './src/io';
import { runSimulation } from './src/simulate';
import {
  STELLA_REPLAY_DEFAULTS,
  STELLA_ROW_BLOCKED,
  createStellaReplay,
  summarizeStellaReplay,
  type StellaReplayResult,
  type StellaReplaySummary,
} from './src/stellaReplay';

const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;
const num = (v: number) => String(Math.round(v * 100) / 100);

type Mode = 'timer' | 'judge' | 'candidates';
const MODE_LABEL: Record<Mode, string> = {
  timer: 'A. 지금 앱 그대로 — 허브 타이머 대화 요청(8~15분) + 관찰 선제',
  judge: 'B. 대표님 결정안 — 타이머 없음 · 일상 질문도 스텔라 판단',
  candidates: 'C. B 에서 지금 켤 수 있는 상황만 (차단 사유 있는 행 제외 · 포착은 rough_day 가 없어 0)',
};

function runScenario(mode: Mode, days: number, seeds: number, clock: HumanClock): { results: StellaReplayResult[]; sum: StellaReplaySummary } {
  const all = listStellaObserveSituations();
  const rows = mode === 'candidates' ? all.filter((r) => !STELLA_ROW_BLOCKED[r.id]) : all;
  const policy = getStellaObserveGatePolicy();
  const results: StellaReplayResult[] = [];
  for (let s = 1; s <= seeds; s += 1) {
    const replay = createStellaReplay({ seed: s, rows, policy, clock, cfg: mode === 'timer' ? { inbound: 'timer', life: 'daily' } : { inbound: 'off', life: 'judge' } });
    runSimulation({
      persona: 'mixed_ref',
      days,
      seed: s,
      runId: `stella-${mode}-${s}`,
      allowSides: true,
      stronger: false,
      hooks: { onEntry: (w, e) => replay.onEntry(w, e) },
    });
    results.push(replay.finish());
  }
  return { results, sum: summarizeStellaReplay(results) };
}

function section(mode: Mode, results: StellaReplayResult[], sum: StellaReplaySummary, csv: string[]): string[] {
  const rows = listStellaObserveSituations();
  const out: string[] = [];
  const pass = sum.criteria.every((c) => c.pass);
  out.push(`## ${MODE_LABEL[mode]}`, '');
  out.push(`판정: **${pass ? 'PASS' : 'FAIL'}** · 플레이일 ${sum.playDays} · 사람 시간 합 ${results.reduce((a, r) => a + r.humanHours, 0).toFixed(1)}h`, '');
  out.push('| 지표 | 값 | 합격선 | 판정 |', '|---|---|---|---|');
  for (const c of sum.criteria) {
    const v = c.id === 'streak3' || c.id === 'failsafe' || c.id === 'per_day' ? num(c.value) : pct(c.value);
    out.push(`| ${c.label} | ${v} | ${c.target} | ${c.pass ? 'PASS' : '**FAIL**'} |`);
  }
  out.push(
    '',
    `플레이일당 내역: 관찰 선제 ${num(sum.observePerDay)} · 일상 질문 ${num(sum.lifePerDay)} · 타이머 대화 요청 ${num(sum.inboundPerDay)}`,
    '',
    `힘든 날 전체 ${sum.captureAllDays}일 포착 ${pct(sum.captureAll)} (매일 반복되는 날은 일부러 덜 말함 · 정보용) · 놓친 순간의 판정: ${Object.entries(sum.captureMiss).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ') || '-'}`,
    '',
    '| 상황 | 횟수 | 점유율 | 연속 3일 | 앱 후보 |',
    '|---|---|---|---|---|',
  );
  const observeTotal = Object.values(sum.rowCount).reduce((a, n) => a + n, 0);
  csv.push('id,count,share,streak3,candidate,reason');
  for (const r of rows) {
    const n = sum.rowCount[r.id] ?? 0;
    const share = observeTotal > 0 ? n / observeTotal : 0;
    const streak = sum.rowStreak[r.id] ?? 0;
    const reason = STELLA_ROW_BLOCKED[r.id] ?? (n === 0 ? '재생에서 0회' : share > 0.4 ? '점유율 초과' : streak > 0 ? '연속 3일' : '');
    const cand = reason ? 0 : 1;
    out.push(`| ${r.id} | ${n} | ${pct(share)} | ${streak} | ${cand ? '1' : `0 — ${reason}`} |`);
    csv.push(`${r.id},${n},${share.toFixed(3)},${streak},${cand},${reason}`);
  }
  out.push('', '침묵 사유 (결정 순간 기준): ' + Object.entries(sum.silent).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '), '');
  out.push('채널: ' + Object.entries(sum.channels).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '), '');
  return out;
}

function main(): void {
  const days = Number(process.argv[2] || 600);
  const seeds = Number(process.argv[3] || 4);
  const runId = process.argv[4] || `o4-d${days}-s${seeds}`;
  const clock = loadHumanClock(path.join(toolRoot(), 'logs', 'learned'));
  const reportDir = path.join(toolRoot(), 'reports', 'stella-proactive');
  const outDir = path.join(toolRoot(), 'out', 'stella-proactive');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const lines: string[] = [`# 스텔라 선제 빈도 검증 — ${runId}`, '', `봇 D${days} × 시드 ${seeds} · mixed_ref · 생성 ${new Date().toISOString()}`, ''];
  lines.push('선제 = 스텔라가 먼저 말을 건 것 전부 (관찰 선제 + 일상 질문 + 타이머 대화 요청). 타이머 대화 요청도 「나야, 스텔라.」 1차 통신이라 스텔라의 말로 센다.', '');
  for (const mode of ['timer', 'judge', 'candidates'] as Mode[]) {
    const { results, sum } = runScenario(mode, days, seeds, clock);
    const csv: string[] = [];
    lines.push(...section(mode, results, sum, csv));
    fs.writeFileSync(path.join(outDir, `${runId}-${mode}-candidates.csv`), `${csv.join('\n')}\n`, 'utf8');
    console.log(`[${mode}] playDays=${sum.playDays} perDay=${num(sum.perDay)} observe=${num(sum.observePerDay)} life=${num(sum.lifePerDay)} inbound=${num(sum.inboundPerDay)}`);
    for (const cr of sum.criteria) console.log(`  ${cr.pass ? 'PASS' : 'FAIL'} ${cr.id} ${num(cr.value)} (${cr.target})`);
  }

  const c = STELLA_REPLAY_DEFAULTS;
  lines.push('## 재생 가정 (실측 아님 — 결과 해석 시 함께 볼 것)', '');
  lines.push(
    `- 사람 시간: humanClock real(평균) · learned 세션 ${clock.sessions} · 가정 동사 ${clock.assumed.join(',') || '-'}`,
    `- 세션 ${c.sessionMinMin}~${c.sessionMaxMin}분 · 하루 2회 접속 ${pct(c.twoSessionP)} (점심·저녁) · 다음 접속 이틀 뒤 ${pct(c.skipOneP)} · 3~4일 뒤 ${pct(c.skipManyP)}`,
    '- 결정 순간: 세션 시작 · 착륙 · 전투 복귀. 다른 팝업·당직·casualFirst 는 없음으로 둠',
    `- 타이머 대화 요청: 세션 동안 허브에 있다고 보고 첫 ${c.inboundFirstMinSec}~${c.inboundFirstMaxSec}초 · 이후 ${c.inboundCooldownMinMin}~${c.inboundCooldownMaxMin}분 (앱 상수 그대로). 스텔라 관찰 선제가 먼저 말하면 다음 창으로 밀림`,
    '- 일상 질문: A 는 지금 앱처럼 허브 진입 하루 1회 (관찰 상황이 말하지 않았고 대화 요청 대기도 없을 때). B 는 관찰 상황과 같은 판단에 후보 하나로 올림',
    `- B 의 일상 질문거리: 봇에 스텔라 기분·대화 기억이 없어 허브 진입마다 늘 ${c.lifeMotive}·${c.lifeAskId} 질문거리가 있다고 봄 — 실제 앱보다 자주 묻는 쪽 가정`,
    `- 반응: 1차 통신·메신저 받아 줌 ${pct(c.acceptP)} · 말걸기는 반응 없음`,
    '- 봇 사실성 한계: 봇은 플레이일 대부분이 「기함 2회 이상 파괴」 날이고(위 「힘든 날 전체」), 콘텐츠 끝에서 목표가 오래 멈춘다. rough_day·quest_stall 의 점유율·연속은 사람보다 높게 나온다',
    '- 함선 내구도 % 없음 → risky_launch 측정 불가 · advice_* 입력 false (O6 전) · session 은 재생이 가정 방출',
    `- 포착: 오늘 파괴 2회 이상이 된 뒤 첫 결정 순간에 rough_day 를 말했거나 ${c.coveredWithinMin}분 안에 이미 말했으면 포착. 합격선은 「새 힘든 시기」(최근 ${c.freshEpisodeHours}시간 안에 이 걱정을 꺼낸 적 없음)만 (대표님 확정 2026-10-06)`,
    '- ask 2회 이상인 날: 하루 예산이 없어져 「하루 ask ≤ 1 (구조상 보장)」 대신 잰다. 타이머 요청·일상 질문도 1차 통신이라 포함',
  );
  const reportPath = path.join(reportDir, `${runId}.md`);
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(`report ${reportPath}`);
}

main();
