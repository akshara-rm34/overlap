import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { space, type } from '@/lib/theme';

export default function Welcome() {
  return (
    <Screen
      footer={
        <>
          <Button title="Create account" onPress={() => router.push('/sign-up')} />
          <Button title="Sign in" variant="secondary" onPress={() => router.push('/sign-in')} />
          {/* TODO step 8: link to the "What we log" page. */}
          <Text style={[type.small, styles.note]}>
            This is a class study. We log app actions (like sign-ups, matches, and messages sent)
            with an anonymous ID, never your work email.
          </Text>
        </>
      }>
      <View style={styles.top}>
        <Text style={[type.h1, styles.title]}>Find a roommate whose dates overlap with yours</Text>
        <Text style={type.body}>
          For interns and new grads moving to a new city. Everyone verifies their work email first.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flex: 1, justifyContent: 'center' },
  title: { marginBottom: space.sm },
  note: { textAlign: 'center', marginTop: space.md, lineHeight: 18 },
});
