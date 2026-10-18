import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authErrorMessage, signIn } from '@/lib/auth';
import { space, type } from '@/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Screen
      back={{ label: 'Back', onPress: () => router.back() }}
      footer={<Button title="Sign in" onPress={onSubmit} loading={busy} />}>
      <Text style={[type.h1, styles.title]}>Sign in</Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
      />
      {error && <Text style={type.error}>{error}</Text>}
      <Pressable onPress={() => router.replace('/sign-up')} style={styles.switch}>
        <Text style={type.link}>New here? Create an account</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: space.lg },
  switch: { marginTop: space.md },
});
