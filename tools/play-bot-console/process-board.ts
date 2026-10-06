/**
 * 김플레이 3단 프로세스 감시판 수동 실행. 평소에는 FQA 30분 루프가 같이 돌린다.
 * npx tsx tools/play-bot-console/process-board.ts            감시판 갱신 + 변화 알림
 * npx tsx tools/play-bot-console/process-board.ts --bench    벤치 강제 실행 후 갱신
 * npx tsx tools/play-bot-console/process-board.ts --ack-mirror   게임 변경을 트윈에 반영했음
 * npx tsx tools/play-bot-console/process-board.ts --done A-7a    수동 항목 완료
 */
import fs from 'node:fs';
import { FQA_CARD_RAISE_HOLD } from './src/fqaReview';
import { ackMirror, defaultProcessPaths, runDailyBench, runProcessBoard, worstState } from './src/processBoard';

function markDone(id: string): void {
  const p = defaultProcessPaths();
  const reg = JSON.parse(fs.readFileSync(p.itemsFile, 'utf8')) as { items: { id: string; done?: boolean }[] };
  const item = reg.items.find((x) => x.id === id);
  if (!item) throw new Error(`항목 없음: ${id}`);
  item.done = true;
  fs.writeFileSync(p.itemsFile, `${JSON.stringify(reg, null, 2)}\n`, 'utf8');
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--ack-mirror')) ackMirror();
  const doneAt = args.indexOf('--done');
  if (doneAt >= 0 && args[doneAt + 1]) markDone(args[doneAt + 1]);
  if (args.includes('--bench')) runDailyBench(defaultProcessPaths(), Date.now(), true);
  const r = runProcessBoard({ cardRaiseHold: FQA_CARD_RAISE_HOLD, alert: !args.includes('--no-alert') });
  console.log(`process-board ${worstState(r.checks)}${r.alerted ? ' alerted' : ''} → ${r.boardFile}`);
  console.log(fs.readFileSync(r.boardFile, 'utf8'));
}

main();
