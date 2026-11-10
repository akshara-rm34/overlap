import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatRange } from '@/lib/dates';
import type { BudgetFit, Match } from '@/lib/matches';
import { housingSummary } from '@/lib/profile';
import { colors, fonts, radius, space } from '@/lib/theme';

import { Avatar } from './Avatar';
import { OverlapPill } from './OverlapPill';
import { VerifiedPill } from './VerifiedPill';

export function money(n: number) {
  return `$${n.toLocaleString('en-US')}`;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function BudgetFitText({ fit }: { fit: BudgetFit }) {
  if (fit === 'unknown') return null;
  const ok = fit === 'fits';
  const color = ok ? colors.green : colors.amber;
  return (
    <View style={styles.fit}>
      <Feather name={ok ? 'check' : 'alert-circle'} size={12} color={color} />
      <Text style={[styles.fitText, { color }]}>
        {ok ? 'Budget overlaps yours' : 'Budget doesn’t overlap yours'}
      </Text>
    </View>
  );
}

// One match on the home list. Uses only the limited card from the match doc, so it looks the
// same for users who are still verifying.
export function MatchCard({ match }: { match: Match }) {
  const c = match.card;
  const housing = housingSummary(c.housingStatus);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/person/[uid]', params: { uid: match.otherUid } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.head}>
        <Avatar name={c.firstName} />
        <View style={styles.headText}>
          <Text style={styles.name}>{c.firstName}</Text>
          {c.company && <Text style={styles.company}>{c.company}</Text>}
          <VerifiedPill method={c.verificationMethod} />
        </View>
        <Feather name="chevron-right" size={18} color={colors.faint} />
      </View>
      <View style={styles.divider} />
      <View style={styles.grid}>
        <Field label="Their dates" value={formatRange(c.startDate, c.endDate)} />
        {c.budgetMin != null && c.budgetMax != null && (
          <Field label="Budget" value={`${money(c.budgetMin)}–${money(c.budgetMax)}/mo`} />
        )}
      </View>
      {housing && <Text style={styles.housing}>{housing}</Text>}
      <BudgetFitText fit={match.budgetFit} />
      <View style={styles.overlapRow}>
        <OverlapPill type={match.overlapType} />
        <Text style={styles.overlapText}>
          Overlap: {formatRange(match.overlapStart, match.overlapEnd)}, {match.overlapDays} days
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius + 2,
    padding: space.md,
    marginBottom: 12,
  },
  pressed: { opacity: 0.7 },
  head: { flexDirection: 'row', gap: space.md },
  headText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  company: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  field: { width: '50%' },
  fieldLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  fieldValue: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text, marginTop: 2 },
  housing: { fontFamily: fonts.medium, fontSize: 12, color: colors.text, marginTop: space.sm },
  fit: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  fitText: { fontFamily: fonts.medium, fontSize: 12 },
  overlapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  overlapText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
});
