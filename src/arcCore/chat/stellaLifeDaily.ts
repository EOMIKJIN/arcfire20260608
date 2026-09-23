import { useArcCoreChatStore } from '../../store/arcCoreChatStore';
import { stellaLifeAddDayKey, stellaLifeDayKey } from './stellaLifeClock';
import { ingestStellaLifeCognition } from './stellaLifeCognition';
import { consolidateStellaLifeSnapshot } from './stellaLifeDigest';
import { readStellaLifeUid } from './stellaLifeEnvRead';
import { patchStellaLifeMemory, snapshotStellaLifeMemory } from './stellaLifeMemory';

export async function consolidateStellaLifeOnDailyBatch(nowMs = Date.now()): Promise<void> {
  const chat = useArcCoreChatStore.getState();
  if (!chat.hydrated) return;
  const yesterday = stellaLifeAddDayKey(stellaLifeDayKey(nowMs), -1);
  const life = snapshotStellaLifeMemory();
  const withPlayerYesterday = life.lastPlayerDay === yesterday || life.withPlayerToday;
  let next = consolidateStellaLifeSnapshot(life, nowMs, readStellaLifeUid(), withPlayerYesterday);
  next = ingestStellaLifeCognition(next, nowMs);
  patchStellaLifeMemory(next);
  chat.touchPersist();
}
