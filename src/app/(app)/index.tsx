import Feather from '@expo/vector-icons/Feather';
import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { MatchCard } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { formatRange } from '@/lib/dates';
import { useMatches } from '@/lib/matches';
import { useProfile } from '@/lib/profile';
import { colors, radius, space, type } from '@/lib/theme';

function Notice({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.notice}>
      <Text style={type.h2}>{title}</Text>
      <Text style={type.body}>{body}</Text>
      {children}
    </View>
  );
}

function MatchList({ city }: { city: string }) {
  const matches = useMatches();
  if (!matches) return <ActivityIndicator color={colors.primary} style={styles.spinner} />;
  if (matches.length === 0) {
    return (
      <Notice
        title="No matches yet"
        body={`We show verified people in ${city} whose dates overlap yours by at least 14 days. No one fits yet. New people join all the time, so check back soon. You can also double-check your dates.`}>
        <Button
          title="Edit my dates"
          variant="secondary"
          onPress={() => router.push({ pathname: '/stay', params: { edit: '1' } })}
        />
      </Notice>
    );
  }
  return (
    <>
      <Text style={[type.small, styles.count]}>
        {matches.length} {matches.length === 1 ? 'match' : 'matches'}
      </Text>
      {matches.map((m) => (
        <MatchCard key={m.otherUid} match={m} />
      ))}
    </>
  );
}

// Home: the matches list. Sends new users through stay details and the checklist first.
export default function Home() {
  const { profile, offerLetterStatus, checklistSkipped } = useProfile();

  if (!profile?.startDate || !profile.endDate || !profile.city) return <Redirect href="/stay" />;
  if (!profile.checklist && !checklistSkipped) return <Redirect href="/checklist" />;

  const headerButtons = (
    <View style={styles.headerButtons}>
      <Pressable
        onPress={() => router.push('/conversations')}
        hitSlop={8}
        accessibilityLabel="Messages">
        <Feather name="message-circle" size={20} color={colors.text} />
      </Pressable>
      <Pressable
        onPress={() => router.push('/profile')}
        hitSlop={8}
        accessibilityLabel="My profile">
        <Feather name="user" size={20} color={colors.text} />
      </Pressable>
    </View>
  );

  return (
    <Screen headerRight={headerButtons}>
      <Text style={type.h1}>Roommate matches</Text>
      <Text style={[type.body, styles.sub]}>
        {profile.city} · {formatRange(profile.startDate, profile.endDate)} · Up to $
        {profile.budgetMax?.toLocaleString('en-US')}
      </Text>

      {!profile.checklist && (
        <Pressable
          onPress={() => router.push({ pathname: '/checklist', params: { edit: '1' } })}
          style={styles.checklistLink}>
          <Text style={type.link}>Finish your compatibility checklist</Text>
        </Pressable>
      )}

      {profile.verified ? (
        <MatchList city={profile.city} />
      ) : offerLetterStatus === 'pending' ? (
        <Notice
          title="Offer letter pending review"
          body="We’ll show your matches as soon as the Overlap team approves your letter."
        />
      ) : (
        <Notice
          title="You’re not verified yet"
          body="You can set up your profile now, but you’ll only see matches after you verify.">
          <Button title="Verify now" onPress={() => router.push('/verify')} />
        </Notice>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButtons: { flexDirection: 'row', gap: 20 },
  sub: { marginTop: space.xs, marginBottom: space.lg },
  notice: { backgroundColor: colors.card, borderRadius: radius, padding: space.md, gap: space.sm },
  spinner: { marginTop: space.xl },
  count: { marginBottom: space.sm },
  checklistLink: { marginBottom: space.md },
});
