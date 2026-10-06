import { Audio } from 'expo-av';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { getPrologueVoiceSource } from './prologueVoiceAssetMap';
import { resolvePrologueVoiceStem } from './prologueVoiceCatalog';
import { createPrologueVoiceController, type PrologueVoiceHandle } from './prologueVoiceController';

let audioModeReady: Promise<void> | null = null;

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
}

/** 설정 하이드레이트 전에도 프롤로그는 들린다. 이후에는 BGM, 없으면 효과음. */
function resolveNarrationVolume(): number | null {
  const { bgmMuted, bgmVolume, sfxMuted, sfxVolume, hydrated } = useAppSettingsStore.getState();
  if (!hydrated) return 0.8;
  const bgm = !bgmMuted ? clamp01(bgmVolume) : 0;
  if (bgm > 0) return bgm;
  const sfx = !sfxMuted ? clamp01(sfxVolume) : 0;
  return sfx > 0 ? sfx : null;
}

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

const controller = createPrologueVoiceController({
  volume: resolveNarrationVolume,
  async load(sceneId, pageIndex, volume): Promise<PrologueVoiceHandle | null> {
    const stem = resolvePrologueVoiceStem(sceneId, pageIndex);
    if (!stem) return null;
    const source = getPrologueVoiceSource(stem);
    if (source == null) return null;
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume,
      isLooping: false,
    });
    let unloaded = false;
    return {
      async unload() {
        if (unloaded) return;
        unloaded = true;
        try {
          sound.setOnPlaybackStatusUpdate(null);
          await sound.stopAsync().catch(() => undefined);
          await sound.unloadAsync();
        } catch {
          /* 네이티브 해제는 한 번만 */
        }
      },
    };
  },
});

/** intro01 페이지 0·1·2 진입 시 1회. 같은 페이지 재호출은 재생을 restart 하지 않는다. */
export function playPrologueVoice(sceneId: string, pageIndex: number): void {
  void controller.play(sceneId, pageIndex);
}

/** 페이지 이탈·인트로 언마운트. 대기 중인 로드도 폐기한다. */
export function stopPrologueVoice(): void {
  void controller.stop();
}
