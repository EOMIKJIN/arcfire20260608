import {
  getTerritorialCampaignGroupState,
  listTerritorialCampaignGroups,
  resolveScheduledPreviewOrderIndex,
} from './arcCoreTerritorialCombatState';
import {
  listTerritorialCombatPolicies,
  listTerritorialCombatPoliciesForCampaign,
} from './arcCoreTerritorialCombatPolicy';

/**
 * 은하 지도 분쟁 링 — **미리 고정된** nextPreviewOrderIndex 성계 1곳만 표시.
 * 판정 완료(markTerritorialCombatPassCompleted) 시에만 다음 예고지로 전진.
 */
export function resolveContestedZonePreviewSystemIds(_nowMs = Date.now()): readonly string[] {
  const policies = listTerritorialCombatPolicies();
  const groups = listTerritorialCampaignGroups(policies);
  const out: string[] = [];

  for (const group of groups) {
    const groupPolicies = listTerritorialCombatPoliciesForCampaign(group).filter(
      (p) => p.contestedZone,
    );
    if (groupPolicies.length === 0) continue;

    void getTerritorialCampaignGroupState(group);
    const previewIdx = resolveScheduledPreviewOrderIndex(group, groupPolicies.length);
    const preview = groupPolicies[previewIdx];
    if (preview?.systemId) out.push(preview.systemId);
  }

  for (const p of policies) {
    if (!p.enabled || !p.contestedZone || p.campaignGroup) continue;
    out.push(p.systemId);
  }

  return out;
}
