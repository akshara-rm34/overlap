import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { QUESTIONS, answerSummary, type Checklist } from '@/lib/checklist';
import { colors, fonts, radius } from '@/lib/theme';

type Props = { mine: Checklist | null; theirs: Checklist };

// Their checklist answers next to yours. A check marks answers that are the same.
export function ChecklistCompare({ mine, theirs }: Props) {
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headRow]}>
        <Text style={[styles.cell, styles.labelCell, styles.head]} />
        <Text style={[styles.cell, styles.head]}>Them</Text>
        <Text style={[styles.cell, styles.head]}>You</Text>
      </View>
      {QUESTIONS.map((q, i) => {
        const their = theirs[q.key];
        const my = mine?.[q.key];
        const same = my !== undefined && my === their;
        return (
          <View key={q.key} style={[styles.row, i === QUESTIONS.length - 1 && styles.last]}>
            <Text style={[styles.cell, styles.labelCell, styles.label]}>{q.title}</Text>
            <Text style={[styles.cell, styles.value]}>{answerSummary(q.key, their as never)}</Text>
            <View style={[styles.cell, styles.youCell]}>
              <Text style={[styles.value, styles.youText]}>
                {my === undefined ? '—' : answerSummary(q.key, my as never)}
              </Text>
              {same && <Feather name="check" size={13} color={colors.green} />}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: 8,
  },
  headRow: { paddingVertical: 8 },
  last: { borderBottomWidth: 0 },
  cell: { flex: 1 },
  labelCell: { flex: 0.9 },
  head: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  label: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  value: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  youCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  youText: { flexShrink: 1 },
});
