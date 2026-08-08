// ============================================================
// 아크파이어 온라인 — 캐릭터(함장) 선택 화면
// 스토리 → character-select → nickname
// ============================================================

import React, { useCallback, useMemo, useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { StageShell } from '../../src/stages/StageShell';
import { ArcButton } from '../../src/ui/overlay/ArcButton';
import { CharacterSelectOptionRow } from '../../src/ui/onboarding/CharacterSelectOptionRow';
import { listPlayerProfessions, getPlayerProfessionById } from '../../src/game/playerPilotProfessionModel';
import { resolveNpcCaptainPortraitSource } from '../../src/game/npcCaptainPortraitAssets';
import { setOnboardingProfessionId } from '../../src/game/onboardingDraftStorage';
import { runStageNavAfterTeardown } from '../../src/navigation/stageNavGate';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { useT } from '../../src/i18n';
import type { PlayerProfessionCsvRow } from '../../src/data/generated';
import {
  ONBOARDING_CHARACTER_SELECT_HEADER_TOP_PX,
  ONBOARDING_HEADER_BODY_GAP_PX,
} from '../../src/ui/onboarding/onboardingScreenLayout';

export default function CharacterSelectScreen() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const professions = useMemo(() => [...listPlayerProfessions()], []);
  const [selectedId, setSelectedId] = useState(professions[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const navScheduledRef = useRef(false);

  const handleConfirm = useCallback(async () => {
    if (!selectedId || submitting || navScheduledRef.current) return;
    if (!getPlayerProfessionById(selectedId)) {
      showArcAlert(t('charSelect.errorTitle'), t('charSelect.notFound'));
      return;
    }
    // AsyncStorage + stage nav gate — 실비용 동안 busy 스피너 유지(성공 시 언마운트까지).
    setSubmitting(true);
    try {
      await setOnboardingProfessionId(selectedId);
      navScheduledRef.current = true;
      runStageNavAfterTeardown({
        teardown: () => {},
        navigate: () => router.replace('/(game)/nickname' as Href),
      });
    } catch {
      setSubmitting(false);
    }
  }, [selectedId, submitting, t]);

  const renderItem = useCallback(
    ({ item }: { item: PlayerProfessionCsvRow }) => (
      <CharacterSelectOptionRow
        profession={item}
        selected={selectedId === item.id}
        portraitSource={resolveNpcCaptainPortraitSource(item.portraitImageAssetKey)}
        onPress={() => setSelectedId(item.id)}
      />
    ),
    [selectedId],
  );

  return (
    <StageShell routeName="character_select" background="stars" topInset={false}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('charSelect.title')}</Text>

        {professions.length === 0 ? (
          <Text style={styles.emptyHint}>{t('charSelect.emptyHint')}</Text>
        ) : null}

        <FlatList
          data={professions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          extraData={selectedId}
        />

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
          <ArcButton
            label={t('charSelect.register')}
            variant="panel"
            disabled={!selectedId}
            busy={submitting}
            onPress={() => {
              void handleConfirm();
            }}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: ONBOARDING_CHARACTER_SELECT_HEADER_TOP_PX,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: TF.titleInk,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: ONBOARDING_HEADER_BODY_GAP_PX,
  },
  emptyHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.midInk,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: SPACING.md,
  },
  footer: {
    paddingTop: SPACING.sm,
    alignItems: 'center',
  },
  confirmBtn: {
    minWidth: 160,
  },
});
