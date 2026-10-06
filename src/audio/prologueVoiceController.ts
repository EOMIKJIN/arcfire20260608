/**
 * 프롤로그 보이스 재생 큐.
 * 동시에 Sound 는 1개. 늦게 끝난 로드는 즉시 해제한다.
 */

export type PrologueVoiceHandle = {
  unload: () => Promise<void>;
};

export type PrologueVoiceControllerDeps = {
  load: (sceneId: string, pageIndex: number, volume: number) => Promise<PrologueVoiceHandle | null>;
  volume: () => number | null;
};

export type PrologueVoiceController = {
  play: (sceneId: string, pageIndex: number) => Promise<void>;
  stop: () => Promise<void>;
  liveCount: () => number;
};

export function createPrologueVoiceController(deps: PrologueVoiceControllerDeps): PrologueVoiceController {
  let generation = 0;
  let chain: Promise<void> = Promise.resolve();
  let current: PrologueVoiceHandle | null = null;
  let activeKey: string | null = null;

  async function unloadCurrent(): Promise<void> {
    const handle = current;
    current = null;
    activeKey = null;
    if (!handle) return;
    try {
      await handle.unload();
    } catch {
      /* 해제 실패는 다음 장을 막지 않음 */
    }
  }

  function enqueue(task: (gen: number) => Promise<void>): Promise<void> {
    const gen = ++generation;
    chain = chain.then(() => task(gen)).catch(() => undefined);
    return chain;
  }

  return {
    play(sceneId: string, pageIndex: number): Promise<void> {
      const key = `${sceneId}:${pageIndex}`;
      return enqueue(async (gen) => {
        if (gen !== generation) return;
        if (activeKey === key && current) return;
        await unloadCurrent();
        if (gen !== generation) return;
        const volume = deps.volume();
        if (volume == null) return;
        const handle = await deps.load(sceneId, pageIndex, volume);
        if (gen !== generation) {
          await handle?.unload().catch(() => undefined);
          return;
        }
        current = handle;
        activeKey = handle ? key : null;
      });
    },
    stop(): Promise<void> {
      return enqueue(async () => {
        await unloadCurrent();
      });
    },
    liveCount(): number {
      return current ? 1 : 0;
    },
  };
}
