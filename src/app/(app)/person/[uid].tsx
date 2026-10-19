import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BadgeExplanation } from '@/components/BadgeExplanation';
import { Button } from '@/components/Button';
import { ChecklistCompare } from '@/components/ChecklistCompare';
import { Loading } from '@/components/Loading';
import { OverlapPill } from '@/components/OverlapPill';
import { Screen } from '@/components/Screen';
import { VerifiedPill } from '@/components/VerifiedPill';
import { useAuth } from '@/lib/auth';
import { convIdFor } from '@/lib/chat';
import { formatDate, formatRange } from '@/lib/dates';
import { logEvent } from '@/lib/events';
import { useMatch } from '@/lib/matches';
import { useProfile } from '@/lib/profile';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { useUserProfile } from '@/lib/useUserProfile';

function money(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}

export default function PersonProfile() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user } = useAuth();
  const { profile: me } = useProfile();
  const person = useUserProfile(uid);
  const match = useMatch(uid);
  const [showBadge, setShowBadge] = useState(false);
  const viewLogged = useRef(false);

  useEffect(() => {
    if (viewLogged.current || !uid || !person || match === undefined) return;
    viewLogged.current = true;
    logEvent('profile_view', { otherUid: uid, overlapType: match?.overlapType ?? null });
  }, [uid, person, match]);

  function toggleBadge() {
    const next = !showBadge;
    setShowBadge(next);
    if (next) logEvent('badge_tap', { otherUid: uid });
  }

  if (person === undefined || match === undefined) return <Loading />;

  const back = { label: 'Matches', onPress: () => router.back() };
  if (!person) {
    return (
      <Screen back={back}>
        <Text style={type.body}>This profile isn’t available anymore.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      back={back}
      footer={
        <Button
          title="Message"
          onPress={() =>
            router.push({
              pathname: '/chat/[convId]',
              params: { convId: convIdFor(user!.uid, uid) },
            })
          }
        />
      }>
      <View style={styles.head}>
        <Avatar name={person.displayName} size={88} />
        <View style={styles.headText}>
          <Text style={[type.h1, styles.name]}>{person.displayName}</Text>
          {person.company && <Text style={type.body}>{person.company}</Text>}
          {person.verified && (
            <Pressable
              onPress={toggleBadge}
              accessibilityRole="button"
              accessibilityLabel="What does Verified mean?"
              hitSlop={6}>
              <VerifiedPill size="large" />
            </Pressable>
          )}
        </View>
      </View>
      {person.verified && showBadge && <BadgeExplanation profile={person} />}

      {person.startDate && person.endDate && (
        <View style={styles.card}>
          <View style={styles.cardTitle}>
            <Feather name="calendar" size={16} color={colors.text} />
            <Text style={type.h2}>Their dates</Text>
          </View>
          <Text style={styles.dates}>
            {formatDate(person.startDate)} – {formatDate(person.endDate, true)}
          </Text>
          {match ? (
            <View style={styles.overlapRow}>
              <OverlapPill type={match.overlapType} />
              <Text style={styles.overlapText}>
                Overlap: {formatRange(match.overlapStart, match.overlapEnd)}, {match.overlapDays}{' '}
                days
              </Text>
            </View>
          ) : (
            <Text style={type.small}>Your dates don’t overlap anymore.</Text>
          )}
        </View>
      )}

      {person.budgetMin != null && person.budgetMax != null && (
        <View style={styles.section}>
          <Text style={type.h2}>Budget</Text>
          <Text style={[type.text, styles.sectionBody]}>
            {money(person.budgetMin)}–{money(person.budgetMax)}/month
            {me?.budgetMin != null && me.budgetMax != null
              ? `  ·  You: ${money(me.budgetMin)}–${money(me.budgetMax)}`
              : ''}
          </Text>
        </View>
      )}

      {!!person.bio && (
        <View style={styles.section}>
          <Text style={type.h2}>About</Text>
          <Text style={[type.body, styles.sectionBody]}>{person.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[type.h2, styles.checklistTitle]}>Compatibility checklist</Text>
        {person.checklist ? (
          <>
            <ChecklistCompare mine={me?.checklist ?? null} theirs={person.checklist} />
            {!me?.checklist && (
              <Pressable
                onPress={() => router.push({ pathname: '/checklist', params: { edit: '1' } })}
                style={styles.fillMine}>
                <Text style={type.link}>Fill out yours to compare</Text>
              </Pressable>
            )}
          </>
        ) : (
          <Text style={type.body}>{person.displayName} hasn’t filled out the checklist yet.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  headText: { flex: 1, gap: 4, alignItems: 'flex-start' },
  name: { fontSize: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius + 2,
    padding: space.md,
    marginTop: space.lg,
    gap: space.sm,
  },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dates: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  overlapText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
  section: { marginTop: space.lg },
  sectionBody: { marginTop: space.xs },
  checklistTitle: { marginBottom: space.sm },
  fillMine: { marginTop: space.sm },
});
