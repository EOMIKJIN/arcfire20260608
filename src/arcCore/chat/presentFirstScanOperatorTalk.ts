/**
 * 스캔 후 스텔라 2차는 인게임 가이드(A2–D2)만. 메신저/NL 백채널 없음.
 */
import { notifyStellaHubTutorial } from '../../game/hubTutorial/stellaHubTutorialGuide';

export function presentFirstScanOperatorTalk(planetId: string): void {
  const pid = (planetId ?? '').trim();
  if (!pid) return;
  notifyStellaHubTutorial('a1_dismissed', pid);
}
