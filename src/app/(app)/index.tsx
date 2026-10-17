import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { signOut, useAuth } from '@/lib/auth';
import { colors, space } from '@/lib/theme';

// Placeholder home for step 1. Step 2 sends new users to the verify flow from here.
export default function Home() {
  const { user } = useAuth();
  return (
    <Screen>
      <Text style={styles.title}>Hi, {user?.displayName ?? 'there'}</Text>
      <Text style={styles.body}>You’re signed in as {user?.email}.</Text>
      <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  body: { fontSize: 16, color: colors.muted, marginTop: space.sm, marginBottom: space.lg },
});
