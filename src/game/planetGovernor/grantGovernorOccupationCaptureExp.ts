// ============================================================
// 점령 성공 → 승자 진영 총사령관 EXP (기록·카드 표시)
// 전투 수치·전술 등급에는 아직 쓰지 않음.
// ============================================================

import {
  NPC_CAPTAIN_PROGRESS_EXP,
  useNpcCaptainProgressStore,
} from '../../store/npcCaptainProgressStore';
/** 승자 슬롯 함장 1명. persist는 dirty일 때만. 틱 경로 금지. */
export function grantGovernorOccupationCaptureExp(captainId: string): void {
  const id = String(captainId ?? '').trim();
  if (!id) return;
  void (async () => {
    const store = useNpcCaptainProgressStore.getState();
    if (!store.hydrated) {
      await store.loadLocalNpcCaptainProgress();
    }
    store.grantCaptainDelta(id, { exp: NPC_CAPTAIN_PROGRESS_EXP.occupationCapture });
    await store.persistNpcCaptainProgress();
  })();
}
