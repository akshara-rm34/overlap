import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, space } from '@/lib/theme';

export default function Welcome() {
  return (
    <Screen>
      <View style={styles.top}>
        <Text style={styles.title}>Overlap</Text>
        <Text style={styles.subtitle}>
          Find verified roommates whose internship dates overlap with yours.
        </Text>
      </View>
      <View>
        <Button title="Create account" onPress={() => router.push('/sign-up')} />
        <Button title="Sign in" variant="secondary" onPress={() => router.push('/sign-in')} />
        {/* TODO step 8: link to the "What we log" page. */}
        <Text style={styles.note}>
          This is a class study. We log app actions (like sign-ups, matches, and messages sent) with
          an anonymous ID, never your work email.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 17, color: colors.muted, marginTop: space.sm, lineHeight: 24 },
  note: { fontSize: 13, color: colors.muted, marginTop: space.md, textAlign: 'center', lineHeight: 18 },
});
