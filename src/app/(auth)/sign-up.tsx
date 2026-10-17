import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { authErrorMessage, signUp } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

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
    <Screen>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.hint}>
        Any email works here. You’ll verify your work email in the next step.
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
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Create account" onPress={onSubmit} loading={busy} />
      <Link href="/sign-in" replace style={styles.link}>
        Already have an account? Sign in
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  hint: { fontSize: 15, color: colors.muted, marginTop: space.xs, marginBottom: space.lg },
  error: { color: colors.error, marginBottom: space.sm },
  link: { color: colors.primary, textAlign: 'center', marginTop: space.lg, fontSize: 15 },
});
