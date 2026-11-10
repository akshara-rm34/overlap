import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { BadgeExplanation } from '@/components/BadgeExplanation';
import { Button } from '@/components/Button';
import { ChecklistCompare } from '@/components/ChecklistCompare';
import { Loading } from '@/components/Loading';
import { BudgetFitText, money } from '@/components/MatchCard';
import { OverlapPill } from '@/components/OverlapPill';
import { Screen } from '@/components/Screen';
import { VerifiedPill } from '@/components/VerifiedPill';
import { useAuth } from '@/lib/auth';
import { convIdFor } from '@/lib/chat';
import { formatDate, formatRange } from '@/lib/dates';
import { logEvent } from '@/lib/events';
import { useMatch } from '@/lib/matches';
import { housingSummary, useProfile } from '@/lib/profile';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { useUserProfile } from '@/lib/useUserProfile';

export default function PersonProfile() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { user } = useAuth();
  const { profile: me, access, offerLetterStatus } = useProfile();
  const full = access === 'full';
  // Users who are still verifying can't read full profiles, so they only get the match card.
  const person = useUserProfile(full ? uid : null);
  const match = useMatch(uid);
  const [showBadge, setShowBadge] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const viewLogged = useRef(false);

  const loading = match === undefined || (full && person === undefined);

  useEffect(() => {
    if (viewLogged.current || !uid || loading) return;
    viewLogged.current = true;
    logEvent('profile_view', { otherUid: uid, overlapType: match?.overlapType ?? null, access });
  }, [uid, loading, match, access]);

  if (loading) return <Loading />;

  const back = { label: 'Matches', onPress: () => router.back() };
  const card = match?.card;
  if ((full && !person) || (!full && !card)) {
    return (
      <Screen back={back}>
        <Text style={type.body}>This profile isn’t available anymore.</Text>
      </Screen>
    );
  }

  // Everything below comes from the full profile when we have it, else from the match card.
  const name = full ? person!.displayName : card!.firstName;
  const company = full ? (person!.verified ? person!.company : null) : card!.company;
  const method = full ? (person!.verified ? person!.verificationMethod : null) : card!.verificationMethod;
  const startDate = full ? person!.startDate : card!.startDate;
  const endDate = full ? person!.endDate : card!.endDate;
  const budgetMin = full ? person!.budgetMin : card!.budgetMin;
  const budgetMax = full ? person!.budgetMax : card!.budgetMax;
  const housing = housingSummary(full ? person!.housingStatus : card!.housingStatus);

  function toggleBadge() {
    const next = !showBadge;
    setShowBadge(next);
    if (next) logEvent('badge_tap', { otherUid: uid, method: method ?? null });
  }

  function onMessage() {
    if (full) {
      router.push({ pathname: '/chat/[convId]', params: { convId: convIdFor(user!.uid, uid) } });
      return;
    }
    logEvent('locked_message_tap', { otherUid: uid });
    setShowLocked(true);
  }

  const pending = offerLetterStatus === 'pending';

  return (
    <Screen
      back={back}
      footer={
        <>
          {showLocked && (
            <View style={styles.locked}>
              <Text style={type.h2}>
                {pending ? 'Almost there' : `Verify to message ${name}`}
              </Text>
              <Text style={type.body}>
                {pending
                  ? 'You can message matches as soon as the Overlap team approves your offer letter.'
                  : 'Verifying shows matches you’re really relocating for a job. It takes about a minute with a work email.'}
              </Text>
              {!pending && <Button title="Verify now" onPress={() => router.push('/verify')} />}
            </View>
          )}
          <Button
            title={full ? 'Message' : 'Message (verify first)'}
            variant={full ? 'primary' : 'secondary'}
            onPress={onMessage}
          />
        </>
      }>
      <View style={styles.head}>
        <Avatar name={name} size={88} />
        <View style={styles.headText}>
          <Text style={[type.h1, styles.name]}>{name}</Text>
          {company && <Text style={type.body}>{company}</Text>}
          <Pressable
            onPress={toggleBadge}
            accessibilityRole="button"
            accessibilityLabel="What does this badge mean?"
            hitSlop={6}>
            <VerifiedPill method={method ?? null} size="large" />
          </Pressable>
          <Text style={type.small}>Tap the badge to see what it means</Text>
        </View>
      </View>
      {showBadge && (
        <BadgeExplanation
          verificationMethod={method ?? null}
          company={company ?? null}
          verifiedAt={full ? person!.verifiedAt : null}
        />
      )}

      {startDate && endDate && (
        <View style={styles.card}>
          <View style={styles.cardTitle}>
            <Feather name="calendar" size={16} color={colors.text} />
            <Text style={type.h2}>Their dates</Text>
          </View>
          <Text style={styles.dates}>
            {formatDate(startDate)} – {formatDate(endDate, true)}
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

      {budgetMin != null && budgetMax != null && (
        <View style={styles.section}>
          <Text style={type.h2}>Budget</Text>
          <Text style={[type.text, styles.sectionBody]}>
            {money(budgetMin)}–{money(budgetMax)}/month
            {me?.budgetMin != null && me.budgetMax != null
              ? `  ·  You: ${money(me.budgetMin)}–${money(me.budgetMax)}`
              : ''}
          </Text>
          {match && <BudgetFitText fit={match.budgetFit} />}
        </View>
      )}

      {housing && (
        <View style={styles.section}>
          <Text style={type.h2}>Housing</Text>
          <Text style={[type.text, styles.sectionBody]}>{housing}</Text>
        </View>
      )}

      {full ? (
        <>
          {!!person!.bio && (
            <View style={styles.section}>
              <Text style={type.h2}>About</Text>
              <Text style={[type.body, styles.sectionBody]}>{person!.bio}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[type.h2, styles.checklistTitle]}>Compatibility checklist</Text>
            {person!.checklist ? (
              <>
                <ChecklistCompare mine={me?.checklist ?? null} theirs={person!.checklist} />
                {!me?.checklist && (
                  <Pressable
                    onPress={() => router.push({ pathname: '/checklist', params: { edit: '1' } })}
                    style={styles.fillMine}>
                    <Text style={type.link}>Fill out yours to compare</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <Text style={type.body}>{name} hasn’t filled out the checklist yet.</Text>
            )}
          </View>
        </>
      ) : (
        <View style={[styles.card, styles.lockedCard]}>
          <View style={styles.cardTitle}>
            <Feather name="lock" size={16} color={colors.muted} />
            <Text style={type.h2}>About and checklist</Text>
          </View>
          <Text style={type.body}>
            {pending
              ? 'You’ll see their bio and checklist answers once your offer letter is approved.'
              : 'Verify to see their bio, checklist answers, and full name.'}
          </Text>
        </View>
      )}
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
  lockedCard: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.divider },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dates: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  overlapRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  overlapText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
  section: { marginTop: space.lg },
  sectionBody: { marginTop: space.xs },
  checklistTitle: { marginBottom: space.sm },
  fillMine: { marginTop: space.sm },
  locked: {
    backgroundColor: colors.blueBg,
    borderWidth: 1,
    borderColor: colors.blueBorder,
    borderRadius: radius,
    padding: space.md,
    gap: space.sm,
    marginBottom: space.sm,
  },
});
