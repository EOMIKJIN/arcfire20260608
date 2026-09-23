import type { ImageSourcePropType } from 'react-native';
import type { NlMouthId } from '../../game/conversation/conversationGateContract';
import { resolveNpcCaptainPortraitSource } from '../../game/npcCaptainPortraitAssets';
import { getArcCoreChatSpeakerRow } from './arcCoreChatTableIndex';

export type ChatSpeakerChrome = {
  speakerId: NlMouthId;
  title: string;
  subtitle: string;
  portrait: ImageSourcePropType | null;
  useLens: boolean;
};

export function resolveChatSpeakerChrome(
  speakerId: NlMouthId,
  locale: 'ko' | 'en',
): ChatSpeakerChrome {
  const row = getArcCoreChatSpeakerRow(speakerId);
  const title = locale === 'en'
    ? (row?.displayNameEn || row?.displayNameKo || speakerId)
    : (row?.displayNameKo || speakerId);
  const subtitle = locale === 'en'
    ? (row?.subtitleEn || row?.subtitleKo || '')
    : (row?.subtitleKo || '');
  const portrait = resolveNpcCaptainPortraitSource(row?.portraitAssetKey ?? null);
  return {
    speakerId,
    title,
    subtitle,
    portrait,
    useLens: speakerId === 'arc_core' || !portrait,
  };
}

export function toggleNlMouthId(current: NlMouthId): NlMouthId {
  return current === 'operator' ? 'arc_core' : 'operator';
}
