import { Audio, type AVPlaybackStatusSuccess } from 'expo-av';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { getBarVoiceAssetSource } from './barVoiceAssetMap';

export type BarVoiceLayer = 'dialog' | 'song';

type PlayArgs = {
  layer?: BarVoiceLayer;
  playKey: string;
  assetKey: string;
  loop: boolean;
};

type Slot = {
  playKey: string;
  sound: Audio.Sound | null;
  loading: Promise<void> | null;
};

let audioModeReady: Promise<void> | null = null;
const slots = new Map<BarVoiceLayer, Slot>();
/** 곡은 세션당 1회. stopBarVoice 에서만 초기화. */
const songStartedKeys = new Set<string>();

async function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    })
      .then(() => undefined)
      .catch(() => {
        audioModeReady = null;
      });
  }
  await audioModeReady;
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

/** 루프 곡은 BGM, 짧은 대사는 BGM→SFX 순. */
function resolvePerformanceVolume(loop: boolean): number | null {
  const { bgmMuted, bgmVolume, sfxMuted, sfxVolume, hydrated } = useAppSettingsStore.getState();
  if (!hydrated) return null;
  const bgm = !bgmMuted ? clamp01(bgmVolume) : 0;
  if (bgm > 0) return bgm;
  if (loop) return null;
  const sfx = !sfxMuted ? clamp01(sfxVolume) : 0;
  return sfx > 0 ? sfx : null;
}

async function unloadLayer(layer: BarVoiceLayer): Promise<void> {
  const slot = slots.get(layer);
  slots.delete(layer);
  const sound = slot?.sound ?? null;
  if (!sound) return;
  try {
    sound.setOnPlaybackStatusUpdate(null);
    await sound.stopAsync().catch(() => {});
    await sound.unloadAsync();
  } catch {
    /* 해제 실패는 세션을 막지 않음 */
  }
}

/**
 * 공연 오디오 — dialog/song 각 1슬롯. 같은 playKey 면 재생성 없음.
 * 부트/타이틀 prewarm 금지 — 술사주기 세션에서만 호출.
 */
export async function playBarVoiceClip(args: PlayArgs): Promise<void> {
  const layer: BarVoiceLayer = args.layer === 'dialog' ? 'dialog' : 'song';
  const playKey = String(args.playKey ?? '').trim();
  const assetKey = String(args.assetKey ?? '').trim();
  if (!playKey || !assetKey) return;
  if (layer === 'song' && songStartedKeys.has(playKey)) return;
  const source = getBarVoiceAssetSource(assetKey);
  if (source == null) return;
  const volume = resolvePerformanceVolume(args.loop === true);
  if (volume == null) return;

  const existing = slots.get(layer);
  if (existing?.playKey === playKey) {
    if (existing.loading) await existing.loading.catch(() => {});
    const again = slots.get(layer);
    if (again?.playKey === playKey && again.sound) {
      try {
        await again.sound.setVolumeAsync(volume);
      } catch {
        /* ignore */
      }
      return;
    }
  }

  if (existing?.loading) {
    await existing.loading.catch(() => {});
  }
  await unloadLayer(layer);

  const loading = (async () => {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume,
      isLooping: args.loop === true,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      const s = status as AVPlaybackStatusSuccess;
      if (!s.isLoaded || !s.didJustFinish || s.isLooping) return;
      void unloadLayer(layer);
    });
    const cur = slots.get(layer);
    if (cur && cur.playKey === playKey) {
      cur.sound = sound;
      cur.loading = null;
    } else {
      await sound.unloadAsync().catch(() => {});
    }
  })();

  slots.set(layer, { playKey, sound: null, loading });
  if (layer === 'song') songStartedKeys.add(playKey);
  try {
    await loading;
  } catch {
    const cur = slots.get(layer);
    if (cur?.playKey === playKey) slots.delete(layer);
  }
}

export async function stopBarVoice(): Promise<void> {
  songStartedKeys.clear();
  const layers: BarVoiceLayer[] = ['dialog', 'song'];
  for (const layer of layers) {
    const slot = slots.get(layer);
    if (slot?.loading) await slot.loading.catch(() => {});
    await unloadLayer(layer);
  }
}
