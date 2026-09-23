// 세계 콘트롤 B안 예약 슬롯.
// resolveArcCoreChatWorldProposal 만 LIVE=false 에서 항상 null (집행 게이트).
// suggestArcCoreChatWorldProposal 는 대화 힌트 id 만 고른다. LIVE 를 보지 않는다.
// 시설 집행은 허브 opener + 플레이어 확인 뒤에만. 틱/부트 호출 금지.

export const ARC_CORE_CHAT_WORLD_PROPOSAL_LIVE = false;

export const ARC_CORE_CHAT_WORLD_PROPOSAL_IDS = [
  'open_trade',
  'open_shipyard',
  'open_bar',
  'open_skilltree',
  'open_economy',
  'open_development',
  'open_talk_roster',
  'talk_bar',
  'talk_npc',
  'arm_wave',
  'open_mission',
  'depart_hint',
  'daily_ops_status',
] as const;

export type ArcCoreChatWorldProposalId = (typeof ARC_CORE_CHAT_WORLD_PROPOSAL_IDS)[number];

export type ArcCoreChatWorldProposal = {
  id: ArcCoreChatWorldProposalId;
};

const ID_SET: ReadonlySet<string> = new Set(ARC_CORE_CHAT_WORLD_PROPOSAL_IDS);

export function isArcCoreChatWorldProposalLive(): boolean {
  return Boolean(ARC_CORE_CHAT_WORLD_PROPOSAL_LIVE);
}

/** LIVE가 꺼져 있으면 id가 화이트리스트여도 null. 집행 함수는 두지 않는다. */
export function resolveArcCoreChatWorldProposal(
  rawId?: string | null,
): ArcCoreChatWorldProposal | null {
  if (!isArcCoreChatWorldProposalLive()) return null;
  const id = String(rawId ?? '').trim();
  if (!id || !ID_SET.has(id)) return null;
  return { id: id as ArcCoreChatWorldProposalId };
}

export function isReservedArcCoreChatWorldProposalId(rawId: string): boolean {
  return ID_SET.has(rawId.trim());
}

/** 허브 시설 이동 문. */
export function isArcCoreChatFacilityProposalId(rawId: string): boolean {
  const id = rawId.trim();
  return id === 'open_trade' || id === 'open_shipyard' || id === 'open_bar' || id === 'open_skilltree';
}

/** 확인·명시 요청 후 몸이 집행할 수 있는 문. 크레딧·언락·일일배치는 없음. */
export function isArcCoreChatExecutableProposalId(rawId: string): boolean {
  const id = rawId.trim();
  return (
    isArcCoreChatFacilityProposalId(id)
    || id === 'open_economy'
    || id === 'open_development'
    || id === 'open_talk_roster'
    || id === 'talk_bar'
    || id === 'talk_npc'
    || id === 'arm_wave'
  );
}

export function suggestArcCoreChatWorldProposal(input: {
  hasTradePort?: boolean;
  hasShipyard?: boolean;
  lastRefusedProposalId?: string;
}): ArcCoreChatWorldProposalId | null {
  const refused = String(input.lastRefusedProposalId ?? '').trim();
  if (input.hasTradePort && refused !== 'open_trade') return 'open_trade';
  if (input.hasShipyard && refused !== 'open_shipyard') return 'open_shipyard';
  return null;
}
