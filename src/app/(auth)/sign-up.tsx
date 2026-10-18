import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authErrorMessage, signUp } from '@/lib/auth';
import { space, type } from '@/lib/theme';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signUp(name.trim(), email.trim(), password);
      // Root layout switches to the app once auth state changes.
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Screen
      back={{ label: 'Back', onPress: () => router.back() }}
      footer={<Button title="Create account" onPress={onSubmit} loading={busy} />}>
      <Text style={type.h1}>Create account</Text>
      <Text style={[type.body, styles.intro]}>
        Any email works here. You’ll verify your work email next.
      </Text>
      <TextField label="First name" value={name} onChangeText={setName} autoComplete="given-name" />
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
        autoComplete="new-password"
      />
      {error && <Text style={type.error}>{error}</Text>}
      <Pressable onPress={() => router.replace('/sign-in')} style={styles.switch}>
        <Text style={type.link}>Already have an account? Sign in</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.lg },
  switch: { marginTop: space.md },
});
