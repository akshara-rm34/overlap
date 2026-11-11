import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { MatchCard } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { formatRange } from '@/lib/dates';
import { logEvent, logMatchShown } from '@/lib/events';
import { useMatches } from '@/lib/matches';
import { useProfile, type Access } from '@/lib/profile';
import { colors, radius, space, type } from '@/lib/theme';

function Notice({
  title,
  body,
  tone = 'plain',
  children,
}: {
  title: string;
  body: string;
  tone?: 'plain' | 'info';
  children?: React.ReactNode;
}) {
  return (
    <View style={[styles.notice, tone === 'info' && styles.info]}>
      <Text style={type.h2}>{title}</Text>
      <Text style={type.body}>{body}</Text>
      {children}
    </View>
  );
}

function MatchList({ city, access }: { city: string; access: Access }) {
  const matches = useMatches();

  // search is logged once per visit, after the list loads, so it can include the match count.
  // feed_left records how long the list was open.
  const visit = useRef<{ start: number; logged: boolean } | null>(null);
  useFocusEffect(
    useCallback(() => {
      visit.current = { start: Date.now(), logged: false };
      return () => {
        if (visit.current) {
          logEvent('feed_left', { durationMs: Date.now() - visit.current.start, access });
        }
        visit.current = null;
      };
    }, [access]),
  );
  useEffect(() => {
    if (!matches || !visit.current || visit.current.logged) return;
    visit.current.logged = true;
    logEvent('search', { city, matchCount: matches.length, access });
  });

  useEffect(() => {
    for (const m of matches ?? []) {
      logMatchShown({
        otherUid: m.otherUid,
        overlapType: m.overlapType,
        overlapDays: m.overlapDays,
        budgetFit: m.budgetFit,
        access,
      });
    }
  }, [matches, access]);

  if (!matches) return <ActivityIndicator color={colors.primary} style={styles.spinner} />;
  if (matches.length === 0) {
    return (
      <Notice
        title="No matches yet"
        body={`We show people in ${city} whose dates overlap yours by at least 14 days. No one fits yet. New people join all the time, so check back soon. You can also double-check your dates.`}>
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
  const { profile, offerLetterStatus, checklistSkipped, access, variant } = useProfile();

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

  // Banner above the list for anyone who isn't verified yet.
  let banner: React.ReactNode = null;
  if (!profile.verified) {
    if (offerLetterStatus === 'pending') {
      banner = (
        <Notice
          tone="info"
          title="Offer letter pending review"
          body={
            access === 'full'
              ? 'You’ll get the Offer letter checked badge once the Overlap team approves it.'
              : 'You can browse your matches while you wait. Once the team approves your letter, you can open full profiles and send messages.'
          }
        />
      );
    } else if (variant === 'optional') {
      banner = (
        <Notice
          tone="info"
          title="Add a verified badge"
          body="Your profile shows Not verified. Verify with your work email or offer letter so matches know you’re really relocating for a job.">
          <Button title="Get verified" variant="secondary" onPress={() => router.push('/verify')} />
        </Notice>
      );
    } else {
      banner = (
        <Notice
          tone="info"
          title="You’re browsing as a guest"
          body="You can see who matches your dates. Verify to open full profiles and send messages.">
          <Button title="Verify now" onPress={() => router.push('/verify')} />
        </Notice>
      );
    }
  }

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

      {banner}
      <MatchList city={profile.city} access={access} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButtons: { flexDirection: 'row', gap: 20 },
  sub: { marginTop: space.xs, marginBottom: space.lg },
  notice: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.md,
  },
  info: { backgroundColor: colors.blueBg, borderWidth: 1, borderColor: colors.blueBorder },
  spinner: { marginTop: space.xl },
  count: { marginBottom: space.sm },
  checklistLink: { marginBottom: space.md },
});
