// ============================================================
// 아크파이어 온라인 - 닉네임 생성 화면
// ============================================================

import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import type { Href } from 'expo-router';
import { runStageNavAfterTeardown } from '../../src/navigation/stageNavGate';
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { TACTICAL_FACILITY as TF } from '../../src/ui/tactical/tacticalFacilityScreenTokens';
import { useT } from '../../src/i18n';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { getCurrentUser } from '../../src/firebase/auth';
import { ensureFirebaseAnonymousAuth } from '../../src/firebase/firebaseAnonymousAuth';
import { StageShell } from '../../src/stages/StageShell';
import {
  completePilotRegistration,
  PilotRegistrationError,
} from '../../src/game/onboardingPilotRegistration';

const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣]{2,12}$/;

export default function NicknameScreen() {
  const t = useT();
  const [nickname, setNickname] = useState('');
  const [checking, setChecking] = useState(false);
  const navScheduledRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const validate = (text: string) => NICKNAME_REGEX.test(text);

  /** 인트로 직후 전환에서는 autoFocus만으로는 키보드가 안 뜨는 경우가 있어 1회 보강 */
  useFocusEffect(
    useCallback(() => {
      // 확인 탭 직전에 Auth+Firestore가 cold start 되지 않도록 유휴 warm(실패해도 로컬 등록 가능)
      void ensureFirebaseAnonymousAuth();
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }, []),
  );

  const handleConfirm = async () => {
    if (checking) return;
    if (!validate(nickname)) {
      showArcAlert(t('nickname.errTitle'), t('nickname.errBody'));
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      showArcAlert(t('nickname.genericErrTitle'), t('nickname.authErr'));
      if (!navScheduledRef.current) {
        navScheduledRef.current = true;
        runStageNavAfterTeardown({
          teardown: () => {},
          navigate: () => router.replace('/' as Href),
        });
      }
      return;
    }

    try {
      setChecking(true);
      await completePilotRegistration(user.uid, nickname);
      if (navScheduledRef.current) return;
      navScheduledRef.current = true;
      runStageNavAfterTeardown({
        teardown: () => {},
        navigate: () => router.replace('/(game)/continue-warp?target=planet' as Href),
      });
    } catch (e: unknown) {
      const message =
        e instanceof PilotRegistrationError
          ? t(`pilotReg.${e.code}`)
          : e instanceof Error
            ? e.message
            : t('nickname.retry');
      showArcAlert(t('nickname.genericErrTitle'), message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <StageShell routeName="nickname" background="none">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>{t('nickname.title')}</Text>
          <Text style={styles.subtitle}>
            {t('nickname.subtitle')}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>{t('nickname.label')}</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('nickname.placeholder')}
            placeholderTextColor={COLORS.ink_faint}
            maxLength={12}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (validate(nickname) && !checking) void handleConfirm();
            }}
          />
          <Text style={styles.hint}>
            {nickname.length}/12{'  '}{validate(nickname) ? t('nickname.available') : ''}
          </Text>

          <TouchableOpacity
            style={[styles.btn, !validate(nickname) && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={!validate(nickname) || checking}
          >
            {checking
              ? <ActivityIndicator color={COLORS.bg_primary} />
              : <Text style={styles.btnText}>{t('nickname.confirm')}</Text>
            }
          </TouchableOpacity>

          <Text style={styles.warning}>
            {t('nickname.warning')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xxl,
    fontWeight: FONTS.weight.bold,
    color: TF.titleInk,
    letterSpacing: 4,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TF.midInk,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: TF.panelBorder,
    marginVertical: SPACING.xl,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TF.mutedInk,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: TF.panelBorder,
    borderRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: TF.titleInk,
    backgroundColor: TF.inputBg,
    textAlign: 'center',
    letterSpacing: 2,
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  btn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: TF.ctaBg,
    borderRadius: 4,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: TF.ctaBg,
    marginBottom: SPACING.md,
  },
  btnDisabled: { opacity: 0.3 },
  btnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: TF.ctaInk,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 2,
  },
  warning: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TF.mutedInk,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
