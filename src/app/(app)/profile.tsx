import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { VerifiedPill } from '@/components/VerifiedPill';
import { signOut } from '@/lib/auth';
import { QUESTIONS, answerSummary } from '@/lib/checklist';
import { formatDate } from '@/lib/dates';
import { useProfile } from '@/lib/profile';
import { colors, fonts, radius, space, type } from '@/lib/theme';

function money(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={type.h2}>{title}</Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={type.link}>Edit</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function MyProfile() {
  const { profile, offerLetterStatus } = useProfile();
  if (!profile) return null;
  const hasStay = profile.city && profile.startDate && profile.endDate;

  return (
    <Screen back={{ label: 'Home', onPress: () => router.back() }}>
      <Text style={type.h1}>{profile.displayName}</Text>
      <View style={styles.status}>
        {profile.verified ? (
          <>
            <VerifiedPill />
            {profile.company && <Text style={type.body}>{profile.company}</Text>}
          </>
        ) : offerLetterStatus === 'pending' ? (
          <Text style={type.body}>Offer letter pending review</Text>
        ) : (
          <Pressable onPress={() => router.push('/verify')}>
            <Text style={type.link}>Not verified yet. Verify your work email</Text>
          </Pressable>
        )}
      </View>

      <Section
        title="Your stay"
        onEdit={() => router.push({ pathname: '/stay', params: { edit: '1' } })}>
        {hasStay ? (
          <View style={styles.table}>
            <Row label="City" value={profile.city!} />
            <Row
              label="Dates"
              value={`${formatDate(profile.startDate!)} – ${formatDate(profile.endDate!, true)}`}
            />
            <Row
              label="Budget"
              value={`${money(profile.budgetMin!)}–${money(profile.budgetMax!)}/mo`}
            />
          </View>
        ) : (
          <Text style={type.body}>Not set yet.</Text>
        )}
        {!!profile.bio && <Text style={[type.body, styles.bio]}>{profile.bio}</Text>}
      </Section>

      <Section
        title="Compatibility checklist"
        onEdit={() => router.push({ pathname: '/checklist', params: { edit: '1' } })}>
        {profile.checklist ? (
          <View style={styles.table}>
            {QUESTIONS.map((q) => (
              <Row
                key={q.key}
                label={q.title}
                value={answerSummary(q.key, profile.checklist![q.key] as never)}
              />
            ))}
          </View>
        ) : (
          <Text style={type.body}>Not filled out yet. Matches see this on your profile.</Text>
        )}
      </Section>

      <Button title="Sign out" variant="secondary" onPress={() => signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  section: { marginBottom: space.lg },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  table: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  bio: { marginTop: space.sm },
});
