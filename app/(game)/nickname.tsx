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
import { COLORS, FONTS, SPACING } from '../../src/utils/theme';
import { showArcAlert } from '../../src/utils/showArcAlert';
import { getCurrentUser } from '../../src/firebase/auth';
import { StageShell } from '../../src/stages/StageShell';
import {
  completePilotRegistration,
  PilotRegistrationError,
} from '../../src/game/onboardingPilotRegistration';

const NICKNAME_REGEX = /^[a-zA-Z0-9가-힣]{2,12}$/;

export default function NicknameScreen() {
  const [nickname, setNickname] = useState('');
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const validate = (text: string) => NICKNAME_REGEX.test(text);

  /** 인트로 직후 전환에서는 autoFocus만으로는 키보드가 안 뜨는 경우가 있어 1회 보강 */
  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }, []),
  );

  const handleConfirm = async () => {
    if (!validate(nickname)) {
      showArcAlert('닉네임 오류', '2~12자, 한글/영문/숫자만 사용 가능합니다.');
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      showArcAlert('오류', '인증 정보를 찾을 수 없습니다. 다시 시작해주세요.');
      router.replace('/');
      return;
    }

    try {
      setChecking(true);
      await completePilotRegistration(user.uid, nickname);
      router.replace('/(game)/continue-warp?target=planet');
    } catch (e: unknown) {
      const message =
        e instanceof PilotRegistrationError
          ? e.message
          : e instanceof Error
            ? e.message
            : '다시 시도해주세요.';
      showArcAlert('오류', message);
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
          <Text style={styles.title}>파일럿 등록</Text>
          <Text style={styles.subtitle}>
            {'은하계에 기록될 당신의 이름을\n입력하십시오.'}
          </Text>

          <View style={styles.divider} />

          <Text style={styles.label}>파일럿 식별명</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="2~12자 (한글/영문/숫자)"
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
            {nickname.length}/12{'  '}{validate(nickname) ? '✓ 사용 가능' : ''}
          </Text>

          <TouchableOpacity
            style={[styles.btn, !validate(nickname) && styles.btnDisabled]}
            onPress={handleConfirm}
            disabled={!validate(nickname) || checking}
          >
            {checking
              ? <ActivityIndicator color={COLORS.bg_primary} />
              : <Text style={styles.btnText}>[ 등록 확정 ]</Text>
            }
          </TouchableOpacity>

          <Text style={styles.warning}>
            ※ 닉네임은 한 번 설정하면 변경할 수 없습니다.
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
    color: COLORS.ink_dark,
    letterSpacing: 4,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_mid,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xl,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.border_dark,
    borderRadius: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.ink_dark,
    backgroundColor: COLORS.bg_input,
    textAlign: 'center',
    letterSpacing: 2,
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  btn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: COLORS.ink_dark,
    borderRadius: 4,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.ink_dark,
    marginBottom: SPACING.md,
  },
  btnDisabled: { opacity: 0.3 },
  btnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.bg_primary,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 2,
  },
  warning: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
