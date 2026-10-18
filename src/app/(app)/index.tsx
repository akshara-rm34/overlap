import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { signOut, useAuth } from '@/lib/auth';
import { useProfile } from '@/lib/profile';
import { colors, space } from '@/lib/theme';

// Placeholder home. Step 3 adds the stay and checklist screens after this.
export default function Home() {
  const { user } = useAuth();
  const { profile, offerLetterStatus } = useProfile();

  return (
    <Screen>
      <Text style={styles.title}>Hi, {profile?.displayName ?? user?.displayName ?? 'there'}</Text>
      <View style={styles.status}>
        {profile?.verified ? (
          <Text style={styles.statusText}>
            Verified{profile.company ? ` · ${profile.company}` : ''}
          </Text>
        ) : offerLetterStatus === 'pending' ? (
          <Text style={styles.statusText}>
            Offer letter pending review. You can finish your profile now, but you’ll see matches
            once you’re verified.
          </Text>
        ) : (
          <>
            <Text style={styles.statusText}>
              You’re not verified yet. You can set up your profile, but you’ll only see matches
              after you verify.
            </Text>
            <Button title="Verify now" onPress={() => router.push('/verify')} />
          </>
        )}
      </View>
      <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  status: { marginTop: space.sm, marginBottom: space.lg },
  statusText: { fontSize: 16, color: colors.muted, lineHeight: 22 },
});
