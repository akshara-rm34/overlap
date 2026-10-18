import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { signOut } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import { colors, space } from '@/lib/theme';
import { sendVerificationCode, verifyErrorMessage } from '@/lib/verification';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { skipVerify } = useProfile();

  function onSkip() {
    skipVerify();
    router.replace('/');
  }

  async function onSubmit() {
    const workEmail = email.trim().toLowerCase();
    setError(null);
    setBusy(true);
    try {
      const devCode = await sendVerificationCode(workEmail);
      router.push({ pathname: '/verify/code', params: { email: workEmail, devCode } });
    } catch (err) {
      setError(verifyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Verify your work email</Text>
      <Text style={styles.body}>
        We’ll send a 6-digit code to the email from your internship or new job. Your profile will
        show your company name. We never show your email to anyone.
      </Text>
      <TextField
        label="Work email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Send code" onPress={onSubmit} loading={busy} disabled={!email.trim()} />
      <Link href="/verify/offer-letter" style={styles.link}>
        I don’t have a work email yet
      </Link>
      <Pressable onPress={onSkip} style={styles.skip}>
        <Text style={styles.muted}>Skip for now</Text>
      </Pressable>
      <Text style={styles.skipNote}>
        You can set up your profile, but you won’t see matches until you verify.
      </Text>
      <Pressable onPress={() => signOut()} style={styles.signOut}>
        <Text style={styles.muted}>Sign out</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.muted, marginTop: space.sm, marginBottom: space.lg, lineHeight: 21 },
  error: { color: colors.error, marginBottom: space.sm },
  link: { color: colors.primary, textAlign: 'center', marginTop: space.lg, fontSize: 15 },
  skip: { marginTop: space.xl, alignItems: 'center' },
  skipNote: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: space.xs },
  signOut: { marginTop: space.lg, alignItems: 'center' },
  muted: { color: colors.muted, fontSize: 14 },
});
