import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { PROLOGUE_VOICE_FILE_STEMS, resolvePrologueVoiceStem } from './prologueVoiceCatalog';
import {
  createPrologueVoiceController,
  type PrologueVoiceHandle,
} from './prologueVoiceController';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test('prologue voice stems follow intro01 pages 0 to 2', () => {
  assert.deepEqual(
    [0, 1, 2].map((page) => resolvePrologueVoiceStem('intro01', page)),
    ['prolugue_001', 'prolugue_002', 'prolugue_003'],
  );
  assert.equal(resolvePrologueVoiceStem('intro01', 3), null);
  assert.equal(resolvePrologueVoiceStem('ingame_dialog_01', 0), null);
  assert.equal(resolvePrologueVoiceStem('intro01', -1), null);
  assert.equal(resolvePrologueVoiceStem('intro01', 1.5), null);
});

test('prologue voice files on disk are id3 mp3', () => {
  for (const stem of PROLOGUE_VOICE_FILE_STEMS) {
    const filePath = path.join(process.cwd(), 'assets', 'audio', 'voice', `${stem}.mp3`);
    const buf = fs.readFileSync(filePath);
    assert.ok(buf.length > 8_000, stem);
    assert.equal(buf.subarray(0, 3).toString('ascii'), 'ID3', stem);
  }
});

test('only the latest prologue page keeps a sound', async () => {
  const live = new Set<string>();
  const gates = [0, 1, 2].map(() => deferred<void>());
  let loads = 0;
  const controller = createPrologueVoiceController({
    volume: () => 0.8,
    async load(_sceneId, pageIndex): Promise<PrologueVoiceHandle> {
      const id = `p${pageIndex}-${loads}`;
      loads += 1;
      await gates[pageIndex]!.promise;
      live.add(id);
      return {
        async unload() {
          live.delete(id);
        },
      };
    },
  });

  const first = controller.play('intro01', 0);
  const second = controller.play('intro01', 1);
  const third = controller.play('intro01', 2);
  gates[0]!.resolve();
  gates[1]!.resolve();
  gates[2]!.resolve();
  await first;
  await second;
  await third;

  assert.equal(controller.liveCount(), 1);
  assert.equal(live.size, 1);
  assert.equal([...live][0]?.startsWith('p2-'), true);

  await controller.stop();
  assert.equal(controller.liveCount(), 0);
  assert.equal(live.size, 0);
});

test('a prologue load still in flight is dropped when the page changes', async () => {
  const live = new Set<string>();
  const started = deferred<void>();
  const gate = deferred<void>();
  let loads = 0;
  const controller = createPrologueVoiceController({
    volume: () => 1,
    async load(_sceneId, pageIndex): Promise<PrologueVoiceHandle> {
      const id = `s${loads}-p${pageIndex}`;
      loads += 1;
      if (loads === 1) {
        started.resolve();
        await gate.promise;
      }
      live.add(id);
      return {
        async unload() {
          live.delete(id);
        },
      };
    },
  });

  const early = controller.play('intro01', 0);
  await started.promise;
  const later = controller.play('intro01', 1);
  gate.resolve();
  await early;
  await later;
  assert.equal(live.size, 1);
  assert.equal([...live][0], 's1-p1');
  await controller.stop();
  assert.equal(live.size, 0);
});

test('muted narration does not load a sound', async () => {
  let loads = 0;
  const controller = createPrologueVoiceController({
    volume: () => null,
    async load(): Promise<PrologueVoiceHandle> {
      loads += 1;
      return { async unload() {} };
    },
  });
  await controller.play('intro01', 0);
  assert.equal(loads, 0);
  assert.equal(controller.liveCount(), 0);
});

test('replaying the same prologue page does not create a second sound', async () => {
  let loads = 0;
  const controller = createPrologueVoiceController({
    volume: () => 0.8,
    async load(): Promise<PrologueVoiceHandle> {
      loads += 1;
      return { async unload() {} };
    },
  });
  await controller.play('intro01', 0);
  await controller.play('intro01', 0);
  assert.equal(loads, 1);
  assert.equal(controller.liveCount(), 1);
});
