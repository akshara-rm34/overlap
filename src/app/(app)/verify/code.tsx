import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import {
  confirmVerificationCode,
  sendVerificationCode,
  verifyErrorMessage,
} from '@/lib/verification';

const RESEND_WAIT_SECONDS = 30;

export default function EnterCode() {
  const params = useLocalSearchParams<{ email: string; devCode?: string }>();
  const { email } = params;
  const [devCode, setDevCode] = useState(params.devCode);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_WAIT_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function onVerify() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await confirmVerificationCode(code);
      // The layout moves on as soon as the profile shows verified.
    } catch (err) {
      setError(verifyErrorMessage(err));
      setBusy(false);
    }
  }

  async function onResend() {
    setError(null);
    setNotice(null);
    try {
      setDevCode(await sendVerificationCode(email));
      setCode('');
      setNotice('New code sent.');
      setWait(RESEND_WAIT_SECONDS);
    } catch (err) {
      setError(verifyErrorMessage(err));
    }
  }

  return (
    <Screen
      back={{ label: 'Use a different email', onPress: () => router.back() }}
      footer={
        <Button
          title="Verify email"
          onPress={onVerify}
          loading={busy}
          disabled={code.length !== 6}
        />
      }>
      <Text style={type.h1}>Enter your code</Text>
      <View style={styles.sentCard}>
        <Text style={type.small}>Code sent to</Text>
        <Text style={styles.sentEmail}>{email}</Text>
      </View>
      {devCode && <Text style={styles.devCode}>Emulator test code: {devCode}</Text>}
      <TextField
        label="Verification code"
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        style={styles.codeInput}
      />
      {error && <Text style={[type.error, styles.msg]}>{error}</Text>}
      {notice && <Text style={[type.text, styles.msg]}>{notice}</Text>}
      <Text style={type.small}>The code expires in 10 minutes.</Text>
      <View style={styles.links}>
        <Pressable onPress={onResend} disabled={wait > 0} hitSlop={6}>
          <Text style={[type.link, wait > 0 && styles.disabled]}>
            {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/verify/offer-letter')} hitSlop={6}>
          <Text style={type.link}>I don’t have a work email yet</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sentCard: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: space.md,
    marginTop: space.lg,
    marginBottom: space.lg,
    gap: 2,
  },
  sentEmail: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  devCode: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: space.sm,
    marginBottom: space.md,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  codeInput: { letterSpacing: 6, fontFamily: fonts.semibold, fontSize: 18 },
  msg: { marginBottom: space.sm },
  links: { marginTop: space.lg, gap: space.md, alignItems: 'flex-start' },
  disabled: { color: colors.faint, textDecorationLine: 'none' },
});
