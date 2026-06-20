import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArcOverlaySettingsEntry } from '../arcOverlayStore';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { phosphorOverlay, PHOSPHOR_MUTED } from './phosphorOverlayStyles';
import {
  useAppSettingsStore,
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  FULLY_TRANSLATED_LOCALES,
} from '../../../store/appSettingsStore';
import type { AppLocale } from '../../../i18n/types';
import { useT } from '../../../i18n';

type Props = {
  entry: ArcOverlaySettingsEntry;
  onClose: () => void;
  onResetAccount: () => void;
};

const VOLUME_STEP = 0.1;

function VolumeBar({ value, muted }: { value: number; muted: boolean }) {
  const filled = muted ? 0 : Math.round(value * 10);
  const cells = [];
  for (let i = 0; i < 10; i += 1) cells.push(i < filled);
  return (
    <View style={styles.bar}>
      {cells.map((on, i) => (
        <View key={i} style={[styles.barCell, on ? styles.barCellOn : styles.barCellOff]} />
      ))}
    </View>
  );
}

function AudioRow({
  label,
  mutedLabel,
  volume,
  muted,
  onToggleMute,
  onStep,
}: {
  label: string;
  mutedLabel: string;
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onStep: (delta: number) => void;
}) {
  return (
    <View style={styles.audioRow}>
      <Text style={styles.audioLabel}>{label}</Text>
      <View style={styles.audioControls}>
        <Pressable style={styles.stepBtn} onPress={onToggleMute} hitSlop={6}>
          <Text style={styles.stepIcon}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>
        <Pressable style={styles.stepBtn} onPress={() => onStep(-VOLUME_STEP)} hitSlop={6} disabled={muted}>
          <Text style={[styles.stepIcon, muted && styles.dimmed]}>−</Text>
        </Pressable>
        <VolumeBar value={volume} muted={muted} />
        <Pressable style={styles.stepBtn} onPress={() => onStep(VOLUME_STEP)} hitSlop={6} disabled={muted}>
          <Text style={[styles.stepIcon, muted && styles.dimmed]}>＋</Text>
        </Pressable>
        <Text style={styles.pct}>{muted ? mutedLabel : `${Math.round(volume * 100)}%`}</Text>
      </View>
    </View>
  );
}

export const SettingsOverlayContent = memo(function SettingsOverlayContent({
  onClose,
  onResetAccount,
}: Props) {
  const t = useT();
  const locale = useAppSettingsStore((s) => s.locale);
  const bgmMuted = useAppSettingsStore((s) => s.bgmMuted);
  const bgmVolume = useAppSettingsStore((s) => s.bgmVolume);
  const sfxMuted = useAppSettingsStore((s) => s.sfxMuted);
  const sfxVolume = useAppSettingsStore((s) => s.sfxVolume);
  const setLocale = useAppSettingsStore((s) => s.setLocale);
  const setBgmMuted = useAppSettingsStore((s) => s.setBgmMuted);
  const setBgmVolume = useAppSettingsStore((s) => s.setBgmVolume);
  const setSfxMuted = useAppSettingsStore((s) => s.setSfxMuted);
  const setSfxVolume = useAppSettingsStore((s) => s.setSfxVolume);

  const onSelectLocale = useCallback((l: AppLocale) => setLocale(l), [setLocale]);

  const initialRef = useRef<{
    locale: AppLocale;
    bgmMuted: boolean;
    bgmVolume: number;
    sfxMuted: boolean;
    sfxVolume: number;
  } | null>(null);
  if (initialRef.current === null) {
    const s = useAppSettingsStore.getState();
    initialRef.current = {
      locale: s.locale,
      bgmMuted: s.bgmMuted,
      bgmVolume: s.bgmVolume,
      sfxMuted: s.sfxMuted,
      sfxVolume: s.sfxVolume,
    };
  }

  const handleCancel = useCallback(() => {
    const init = initialRef.current;
    if (init) {
      setLocale(init.locale);
      setBgmMuted(init.bgmMuted);
      setBgmVolume(init.bgmVolume);
      setSfxMuted(init.sfxMuted);
      setSfxVolume(init.sfxVolume);
    }
    onClose();
  }, [onClose, setLocale, setBgmMuted, setBgmVolume, setSfxMuted, setSfxVolume]);

  const footer = (
    <ArcOverlayFooterActions onCancel={handleCancel} onConfirm={onClose} />
  );

  return (
    <ArcOverlayCard
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      layout="panel"
      footer={footer}
    >
      <View style={phosphorOverlay.divider} />
      <Text style={phosphorOverlay.sectionLabel}>{t('settings.section.sound')}</Text>
      <AudioRow
        label={t('settings.bgm')}
        mutedLabel={t('settings.muted')}
        volume={bgmVolume}
        muted={bgmMuted}
        onToggleMute={() => setBgmMuted(!bgmMuted)}
        onStep={(d) => setBgmVolume(bgmVolume + d)}
      />
      <AudioRow
        label={t('settings.sfx')}
        mutedLabel={t('settings.muted')}
        volume={sfxVolume}
        muted={sfxMuted}
        onToggleMute={() => setSfxMuted(!sfxMuted)}
        onStep={(d) => setSfxVolume(sfxVolume + d)}
      />
      <View style={phosphorOverlay.divider} />
      <Text style={phosphorOverlay.sectionLabel}>{t('settings.section.language')}</Text>
      {SUPPORTED_LOCALES.map((l) => {
        const selected = l === locale;
        const ready = FULLY_TRANSLATED_LOCALES.includes(l);
        return (
          <Pressable
            key={l}
            style={[styles.langRow, selected && styles.langRowSel]}
            onPress={() => onSelectLocale(l)}
          >
            <Text style={[styles.langCheck, selected && styles.langCheckSel]}>{selected ? '◉' : '○'}</Text>
            <Text style={[styles.langLabel, selected && styles.langLabelSel]}>{LOCALE_LABELS[l]}</Text>
            {!ready ? <Text style={styles.langPending}>{t('settings.language.pending')}</Text> : null}
          </Pressable>
        );
      })}
      <View style={phosphorOverlay.divider} />
      <Text style={phosphorOverlay.sectionLabel}>{t('settings.section.account')}</Text>
      <Text style={styles.resetHint}>{t('settings.reset.hint')}</Text>
      <ArcButton label={t('settings.reset.button')} variant="destructive" onPress={onResetAccount} style={styles.resetBtn} />
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  audioRow: {
    alignSelf: 'stretch',
    marginBottom: SPACING.md,
  },
  audioLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: OVERLAY_TOKENS.phosphorAccent,
    marginBottom: SPACING.xs,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  stepIcon: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  dimmed: { opacity: 0.4 },
  bar: {
    flexDirection: 'row',
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  barCell: {
    flex: 1,
    height: 12,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  barCellOn: { backgroundColor: OVERLAY_TOKENS.phosphorAccent },
  barCellOff: { backgroundColor: 'rgba(107, 212, 255, 0.16)' },
  pct: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PHOSPHOR_MUTED,
    width: 52,
    textAlign: 'right',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
    marginBottom: 2,
  },
  langRowSel: {
    backgroundColor: 'rgba(107, 212, 255, 0.10)',
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
  },
  langCheck: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: PHOSPHOR_MUTED,
    marginRight: SPACING.sm,
  },
  langCheckSel: { color: OVERLAY_TOKENS.phosphorAccent },
  langLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: 'rgba(230, 238, 255, 0.8)',
    flex: 1,
  },
  langLabelSel: { color: OVERLAY_TOKENS.phosphorAccent, fontWeight: FONTS.weight.bold },
  langPending: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PHOSPHOR_MUTED,
    fontStyle: 'italic',
  },
  resetHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: PHOSPHOR_MUTED,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  resetBtn: { alignSelf: 'stretch' },
});
