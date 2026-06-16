// ============================================================
// 아크파이어 온라인 — 캐릭터(함장) 선택 화면
// 스토리 → character-select → nickname
// ============================================================

import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { StageShell } from '../../src/stages/StageShell';
import { ArcButton } from '../../src/ui/overlay/ArcButton';
import { CharacterSelectOptionRow } from '../../src/ui/onboarding/CharacterSelectOptionRow';
import { listPlayerProfessions, getPlayerProfessionById } from '../../src/game/playerPilotProfessionModel';
import { resolveNpcCaptainPortraitSource } from '../../src/game/npcCaptainPortraitAssets';
import { setOnboardingProfessionId } from '../../src/game/onboardingDraftStorage';
import { showArcAlert } from '../../src/utils/showArcAlert';
import type { PlayerProfessionCsvRow } from '../../src/data/generated';
import {
  ONBOARDING_CHARACTER_SELECT_HEADER_TOP_PX,
  ONBOARDING_HEADER_BODY_GAP_PX,
} from '../../src/ui/onboarding/onboardingScreenLayout';

export default function CharacterSelectScreen() {
  const insets = useSafeAreaInsets();
  const professions = useMemo(() => [...listPlayerProfessions()], []);
  const [selectedId, setSelectedId] = useState(professions[0]?.id ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (!selectedId || submitting) return;
    if (!getPlayerProfessionById(selectedId)) {
      showArcAlert('오류', '선택한 캐릭터 데이터를 찾을 수 없습니다.');
      return;
    }
    setSubmitting(true);
    try {
      await setOnboardingProfessionId(selectedId);
      router.replace('/(game)/nickname');
    } finally {
      setSubmitting(false);
    }
  }, [selectedId, submitting]);

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
        <Text style={styles.title}>캐릭터 선택</Text>

        {professions.length === 0 ? (
          <Text style={styles.emptyHint}>캐릭터 목록을 불러올 수 없습니다. 앱을 재시작해 주세요.</Text>
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
            label="[ 파일럿 등록 ]"
            variant="panel"
            disabled={!selectedId || submitting}
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
    color: COLORS.ink_dark,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: ONBOARDING_HEADER_BODY_GAP_PX,
  },
  emptyHint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_mid,
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
