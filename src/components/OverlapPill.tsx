import { StyleSheet, Text, View } from 'react-native';

import type { OverlapType } from '@/lib/matches';
import { colors, fonts } from '@/lib/theme';

export function OverlapPill({ type }: { type: OverlapType }) {
  const full = type === 'full';
  return (
    <View style={[styles.pill, full ? styles.full : styles.partial]}>
      <Text style={styles.text}>{full ? 'Full overlap' : 'Partial overlap'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  full: { backgroundColor: colors.chip, borderColor: colors.chip },
  partial: { backgroundColor: colors.bg, borderColor: colors.border },
  text: { fontFamily: fonts.semibold, fontSize: 11, color: colors.text },
});
