import React, { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArcOverlaySettingsEntry } from '../arcOverlayStore';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { TACTICAL_OVERLAY, tacticalOverlaySectionStyles } from '../tacticalOverlayStyles';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
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

function AudioRow({
  label,
  mutedLabel,
  volume,
  muted,
  onToggleMute,
  onStep,
  isTactical = false,
}: {
  label: string;
  mutedLabel: string;
  volume: number;
  muted: boolean;
  onToggleMute: () => void;
  onStep: (delta: number) => void;
  isTactical?: boolean;
}) {
  const accent = isTactical ? TACTICAL_OVERLAY.labelInk : OVERLAY_TOKENS.phosphorAccent;
  const border = isTactical ? TACTICAL_OVERLAY.insetBorder : OVERLAY_TOKENS.phosphorBorder;
  const barOn = isTactical ? TACTICAL_OVERLAY.sectionBarBg : OVERLAY_TOKENS.phosphorAccent;
  const barOff = isTactical ? TACTICAL_OVERLAY.insetBg : 'rgba(107, 212, 255, 0.16)';
  const pctColor = isTactical ? TACTICAL_OVERLAY.valueInk : OVERLAY_TOKENS.valueContentColor;
  return (
    <View style={styles.audioRow}>
      <Text style={[styles.audioLabel, isTactical && { color: accent }]}>{label}</Text>
      <View style={styles.audioControls}>
        <Pressable style={[styles.stepBtn, { borderColor: border }]} onPress={onToggleMute} hitSlop={6}>
          <Text style={[styles.stepIcon, { color: accent }]}>{muted ? '🔇' : '🔊'}</Text>
        </Pressable>
        <Pressable
          style={[styles.stepBtn, { borderColor: border }]}
          onPress={() => onStep(-VOLUME_STEP)}
          hitSlop={6}
          disabled={muted}
        >
          <Text style={[styles.stepIcon, { color: accent }, muted && styles.dimmed]}>−</Text>
        </Pressable>
        <View style={styles.bar}>
          {Array.from({ length: 10 }, (_, i) => {
            const on = !muted && i < Math.round(volume * 10);
            return (
              <View
                key={i}
                style={[styles.barCell, { backgroundColor: on ? barOn : barOff }]}
              />
            );
          })}
        </View>
        <Pressable
          style={[styles.stepBtn, { borderColor: border }]}
          onPress={() => onStep(VOLUME_STEP)}
          hitSlop={6}
          disabled={muted}
        >
          <Text style={[styles.stepIcon, { color: accent }, muted && styles.dimmed]}>＋</Text>
        </Pressable>
        <Text style={[styles.pct, isTactical && { color: pctColor }]}>
          {muted ? mutedLabel : `${Math.round(volume * 100)}%`}
        </Text>
      </View>
    </View>
  );
}

export const SettingsOverlayContent = memo(function SettingsOverlayContent({
  onClose,
  onResetAccount,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('settings');
  const isTactical = visualTheme === 'tactical';
  const section = isTactical ? tacticalOverlaySectionStyles : phosphorOverlay;
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
    <ArcOverlayFooterActions onCancel={handleCancel} onConfirm={onClose} visualTheme={visualTheme} />
  );

  return (
    <ArcOverlayCard
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      layout="panel"
      footer={footer}
      visualTheme={visualTheme}
      onClose={handleCancel}
    >
      <View style={isTactical ? section.divider : phosphorOverlay.divider} />
      <Text style={isTactical ? section.sectionLabel : phosphorOverlay.sectionLabel}>
        {t('settings.section.sound')}
      </Text>
      <AudioRow
        label={t('settings.bgm')}
        mutedLabel={t('settings.muted')}
        volume={bgmVolume}
        muted={bgmMuted}
        onToggleMute={() => setBgmMuted(!bgmMuted)}
        onStep={(d) => setBgmVolume(bgmVolume + d)}
        isTactical={isTactical}
      />
      <AudioRow
        label={t('settings.sfx')}
        mutedLabel={t('settings.muted')}
        volume={sfxVolume}
        muted={sfxMuted}
        onToggleMute={() => setSfxMuted(!sfxMuted)}
        onStep={(d) => setSfxVolume(sfxVolume + d)}
        isTactical={isTactical}
      />
      <View style={isTactical ? section.divider : phosphorOverlay.divider} />
      <Text style={isTactical ? section.sectionLabel : phosphorOverlay.sectionLabel}>
        {t('settings.section.language')}
      </Text>
      {SUPPORTED_LOCALES.map((l) => {
        const selected = l === locale;
        const ready = FULLY_TRANSLATED_LOCALES.includes(l);
        return (
          <Pressable
            key={l}
            style={[
              styles.langRow,
              selected && (isTactical ? styles.langRowSelTactical : styles.langRowSel),
            ]}
            onPress={() => onSelectLocale(l)}
          >
            <Text style={[styles.langCheck, { color: isTactical ? TACTICAL_OVERLAY.labelInk : PHOSPHOR_MUTED }, selected && (isTactical ? styles.langCheckSelTactical : styles.langCheckSel)]}>
              {selected ? '◉' : '○'}
            </Text>
            <Text style={[styles.langLabel, isTactical && styles.langLabelTactical, selected && (isTactical ? styles.langLabelSelTactical : styles.langLabelSel)]}>
              {LOCALE_LABELS[l]}
            </Text>
            {!ready ? <Text style={styles.langPending}>{t('settings.language.pending')}</Text> : null}
          </Pressable>
        );
      })}
      <View style={isTactical ? section.divider : phosphorOverlay.divider} />
      <Text style={isTactical ? section.sectionLabel : phosphorOverlay.sectionLabel}>
        {t('settings.section.account')}
      </Text>
      <Text style={[styles.resetHint, isTactical && styles.resetHintTactical]}>{t('settings.reset.hint')}</Text>
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
    color: OVERLAY_TOKENS.valueContentColor,
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
  langRowSelTactical: {
    backgroundColor: TACTICAL_OVERLAY.insetBg,
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.insetBorder,
  },
  langCheck: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: PHOSPHOR_MUTED,
    marginRight: SPACING.sm,
  },
  langCheckSel: { color: OVERLAY_TOKENS.phosphorAccent },
  langCheckSelTactical: { color: TACTICAL_OVERLAY.valueInk },
  langLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: 'rgba(230, 238, 255, 0.8)',
    flex: 1,
  },
  langLabelTactical: {
    color: TACTICAL_OVERLAY.labelInk,
  },
  langLabelSel: { color: OVERLAY_TOKENS.phosphorAccent, fontWeight: FONTS.weight.bold },
  langLabelSelTactical: { color: TACTICAL_OVERLAY.valueInk, fontWeight: FONTS.weight.bold },
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
    marginBottom: SPACING.sm,
  },
  resetHintTactical: {
    color: TACTICAL_OVERLAY.labelInk,
  },
  resetBtn: { alignSelf: 'stretch' },
});
