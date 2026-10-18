import Feather from '@expo/vector-icons/Feather';
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { VerifiedPill } from '@/components/VerifiedPill';
import { formatRange } from '@/lib/dates';
import { useProfile } from '@/lib/profile';
import { colors, radius, space, type } from '@/lib/theme';

// Home. Sends new users through stay details and the checklist first.
// Step 4 replaces the placeholder below with the live matches list.
export default function Home() {
  const { profile, offerLetterStatus, checklistSkipped } = useProfile();

  if (!profile?.startDate) return <Redirect href="/stay" />;
  if (!profile.checklist && !checklistSkipped) return <Redirect href="/checklist" />;

  const profileButton = (
    <Pressable onPress={() => router.push('/profile')} hitSlop={8} accessibilityLabel="My profile">
      <Feather name="user" size={20} color={colors.text} />
    </Pressable>
  );

  return (
    <Screen headerRight={profileButton}>
      <Text style={type.h1}>Roommate matches</Text>
      <Text style={[type.body, styles.sub]}>
        {profile.city} · {formatRange(profile.startDate, profile.endDate!)} · Up to $
        {profile.budgetMax?.toLocaleString('en-US')}
      </Text>

      {profile.verified ? (
        <View style={styles.card}>
          <VerifiedPill />
          <Text style={[type.body, styles.cardText]}>
            Matches show up here once we build matching (next step).
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={type.h2}>
            {offerLetterStatus === 'pending'
              ? 'Offer letter pending review'
              : 'You’re not verified yet'}
          </Text>
          <Text style={[type.body, styles.cardText]}>
            {offerLetterStatus === 'pending'
              ? 'We’ll show your matches as soon as the Overlap team approves your letter.'
              : 'You can set up your profile now, but you’ll only see matches after you verify.'}
          </Text>
          {offerLetterStatus !== 'pending' && (
            <Button title="Verify now" onPress={() => router.push('/verify')} />
          )}
        </View>
      )}

      {!profile.checklist && (
        <Pressable onPress={() => router.push({ pathname: '/checklist', params: { edit: '1' } })}>
          <Text style={[type.link, styles.checklistLink]}>Finish your compatibility checklist</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: space.xs, marginBottom: space.lg },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: space.md, gap: space.sm },
  cardText: { marginTop: 0 },
  checklistLink: { marginTop: space.lg },
});
