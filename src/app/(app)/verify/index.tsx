import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { signOut } from '@/lib/auth';
import { logEvent } from '@/lib/events';
import { useProfile } from '@/lib/profile';
import { space, type } from '@/lib/theme';
import { sendVerificationCode, verifyErrorMessage } from '@/lib/verification';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { skipVerify, offerLetterStatus } = useProfile();

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
      logEvent('verify_started', { method: 'work_email' });
      router.push({ pathname: '/verify/code', params: { email: workEmail, devCode } });
    } catch (err) {
      setError(verifyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      headerRight={
        <Pressable onPress={() => signOut()} hitSlop={8}>
          <Text style={type.small}>Sign out</Text>
        </Pressable>
      }
      footer={
        <>
          <Button
            title="Send verification code"
            onPress={onSubmit}
            loading={busy}
            disabled={!email.trim()}
          />
          <Pressable onPress={onSkip} style={styles.skip}>
            <Text style={type.link}>Skip for now</Text>
            <Text style={[type.small, styles.skipNote]}>
              You can set up your profile, but you won’t see matches until you verify.
            </Text>
          </Pressable>
        </>
      }>
      <Text style={type.h1}>Verify your work email</Text>
      <Text style={[type.body, styles.intro]}>
        Confirm that you’re relocating for a real internship or job before connecting with
        roommates. Your profile shows your company name, never your email.
      </Text>
      {offerLetterStatus === 'rejected' && (
        <Text style={[type.error, styles.error]}>
          We couldn’t approve your offer letter. Try your work email, or upload a clearer copy.
        </Text>
      )}
      <TextField
        label="Work email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@company.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      {error && <Text style={[type.error, styles.error]}>{error}</Text>}
      <View style={styles.links}>
        <Pressable onPress={() => router.push('/verify/offer-letter')} hitSlop={6}>
          <Text style={type.link}>I don’t have a work email yet</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.lg },
  error: { marginBottom: space.sm },
  links: { alignItems: 'flex-start' },
  skip: { alignItems: 'center', paddingTop: space.md, paddingBottom: space.sm, gap: space.xs },
  skipNote: { textAlign: 'center' },
});
