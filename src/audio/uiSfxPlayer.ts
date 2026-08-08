import { Audio, type AVPlaybackStatusSuccess } from 'expo-av';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { getUiSfxAssetSource } from './uiSfxAssetMap';
import { UI_SFX_CUES, type UiSfxCue } from './uiSfxTypes';

type SoundSlot = {
  sound: Audio.Sound | null;
  loading: Promise<Audio.Sound | null> | null;
};

const slots = new Map<UiSfxCue, SoundSlot>();
let audioModeReady: Promise<void> | null = null;
let disposed = false;

function getSlot(cue: UiSfxCue): SoundSlot {
  let slot = slots.get(cue);
  if (!slot) {
    slot = { sound: null, loading: null };
    slots.set(cue, slot);
  }
  return slot;
}

async function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).then(() => undefined).catch(() => {
      audioModeReady = null;
    });
  }
  await audioModeReady;
}

async function loadCueSound(cue: UiSfxCue): Promise<Audio.Sound | null> {
  const source = getUiSfxAssetSource(cue);
  if (source == null) return null;
  await ensureAudioMode();
  if (disposed) return null;
  try {
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: false,
      volume: 1,
      isLooping: false,
    });
    if (disposed) {
      await sound.unloadAsync().catch(() => {});
      return null;
    }
    return sound;
  } catch {
    return null;
  }
}

async function ensureCueSound(cue: UiSfxCue): Promise<Audio.Sound | null> {
  const slot = getSlot(cue);
  if (slot.sound) return slot.sound;
  if (!slot.loading) {
    slot.loading = loadCueSound(cue).then((sound) => {
      slot.sound = sound;
      slot.loading = null;
      return sound;
    });
  }
  return slot.loading;
}

function resolvePlaybackVolume(): number | null {
  const { sfxMuted, sfxVolume, hydrated } = useAppSettingsStore.getState();
  if (!hydrated) return null;
  if (sfxMuted) return null;
  const v = Number.isFinite(sfxVolume) ? Math.max(0, Math.min(1, sfxVolume)) : 0;
  if (v <= 0) return null;
  return v;
}

/**
 * cue 재생 — 리소스 미등록·뮤트·볼륨0 이면 no-op.
 * Sound 인스턴스는 cue당 1개 재사용 (탭마다 create 금지 · PSS).
 */
export async function playUiSfx(cue: UiSfxCue): Promise<void> {
  if (disposed) return;
  if (getUiSfxAssetSource(cue) == null) return;
  const volume = resolvePlaybackVolume();
  if (volume == null) return;

  const sound = await ensureCueSound(cue);
  if (!sound || disposed) return;

  try {
    await sound.setVolumeAsync(volume);
    const status = (await sound.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!status.isLoaded) return;
    await sound.replayAsync();
  } catch {
    /* 재생 실패는 UI를 막지 않음 */
  }
}

/** 등록된 cue만 워밍 — 부트 블로킹 금지. InteractionManager/유휴에서 호출. */
export async function preloadRegisteredUiSfx(): Promise<void> {
  if (disposed) return;
  const registered = UI_SFX_CUES.filter((c) => getUiSfxAssetSource(c) != null);
  if (registered.length === 0) return;
  await ensureAudioMode();
  await Promise.all(registered.map((cue) => ensureCueSound(cue)));
}

export async function disposeUiSfxPlayer(): Promise<void> {
  disposed = true;
  const pending: Promise<void>[] = [];
  for (const slot of slots.values()) {
    const sound = slot.sound;
    slot.sound = null;
    slot.loading = null;
    if (sound) {
      pending.push(sound.unloadAsync().then(() => undefined).catch(() => undefined));
    }
  }
  slots.clear();
  await Promise.all(pending);
  disposed = false;
  audioModeReady = null;
}
