import { StyleSheet, Text, View } from 'react-native';

import { formatRange } from '@/lib/dates';
import type { MatchWithProfile } from '@/lib/matches';
import { colors, fonts, radius, space } from '@/lib/theme';

import { Avatar } from './Avatar';
import { OverlapPill } from './OverlapPill';
import { VerifiedPill } from './VerifiedPill';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export function MatchCard({ match }: { match: MatchWithProfile }) {
  const p = match.profile;
  if (!p) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar name={p.displayName} />
        <View style={styles.headText}>
          <Text style={styles.name}>{p.displayName}</Text>
          {p.company && <Text style={styles.company}>{p.company}</Text>}
          {p.verified && <VerifiedPill />}
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.grid}>
        {p.startDate && p.endDate && (
          <Field label="Their dates" value={formatRange(p.startDate, p.endDate)} />
        )}
        {p.budgetMin != null && p.budgetMax != null && (
          <Field
            label="Budget"
            value={`$${p.budgetMin.toLocaleString('en-US')}–${p.budgetMax.toLocaleString('en-US')}/mo`}
          />
        )}
      </View>
      <View style={styles.overlapRow}>
        <OverlapPill type={match.overlapType} />
        <Text style={styles.overlapText}>
          Overlap: {formatRange(match.overlapStart, match.overlapEnd)}, {match.overlapDays} days
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius + 2,
    padding: space.md,
    marginBottom: 12,
  },
  head: { flexDirection: 'row', gap: space.md },
  headText: { flex: 1, gap: 4 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  company: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: space.sm },
  field: { width: '50%' },
  fieldLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  fieldValue: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text, marginTop: 2 },
  overlapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  overlapText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
});
