import { seedWorld } from './src/world';
import { stepAction } from './src/actions';
import { lookupSystemId } from './src/catalog';
const w = seedWorld({ runId: 'park-story', persona: 'mixed_ref' });
w.level = 10; w.hullRank = 1; w.credits = 9_000_000; w.earlyFeelClosed = true; w.questCleared = 1;
w.completedMissionIds = ['story_001']; w.completedLookup = { story_001: true };
w.currentPlanetId = 'eternal_throne'; w.currentSystemId = lookupSystemId('eternal_throne') ?? w.currentSystemId;
w.lastQuestPlanetId = 'eternal_throne';
w.activeQuest = { missionId: 'sandbox_001', title: 'x', objIndex: 0, acceptedDay: 1 };
for (let i = 0; i < 120; i += 1) {
  const e = stepAction(w, () => 0.99, 'mixed_ref', { allowSides: true });
  if (i % 8 === 0 || i > 100) console.log(i, w.tick, 'pb', w.purposeBlockedSince, w.lastAction, w.currentPlanetId, w.activeQuest?.missionId ?? '-', w.parkedQuests.map((q) => q.missionId).join(','), e.kind, e.line.slice(0, 70));
  if (w.activeQuest?.missionId.startsWith('story_')) break;
}
