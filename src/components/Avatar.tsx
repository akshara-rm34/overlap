import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/lib/theme';

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Text style={[styles.text, { fontSize: size * 0.25 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: fonts.semibold, color: colors.muted },
});
