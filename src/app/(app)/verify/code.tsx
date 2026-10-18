import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, space } from '@/lib/theme';
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
    <Screen>
      <Text style={styles.title}>Enter your code</Text>
      <Text style={styles.body}>We sent a 6-digit code to {email}. It expires in 10 minutes.</Text>
      {devCode && <Text style={styles.devCode}>Emulator test code: {devCode}</Text>}
      <TextField
        label="Code"
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {notice && <Text style={styles.notice}>{notice}</Text>}
      <Button title="Verify" onPress={onVerify} loading={busy} disabled={code.length !== 6} />
      <Pressable onPress={onResend} disabled={wait > 0} style={styles.row}>
        <Text style={[styles.link, wait > 0 && styles.muted]}>
          {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
        </Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.row}>
        <Text style={styles.link}>Use a different email</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/verify/offer-letter')} style={styles.row}>
        <Text style={styles.link}>I don’t have a work email yet</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.muted, marginTop: space.sm, marginBottom: space.lg, lineHeight: 21 },
  error: { color: colors.error, marginBottom: space.sm },
  notice: { color: colors.text, marginBottom: space.sm },
  devCode: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: space.sm,
    marginBottom: space.md,
    color: colors.text,
    fontFamily: 'Courier',
  },
  row: { marginTop: space.lg, alignItems: 'center' },
  link: { color: colors.primary, fontSize: 15 },
  muted: { color: colors.muted },
});
