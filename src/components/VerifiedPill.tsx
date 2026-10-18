import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

export function VerifiedPill({ size = 'small' }: { size?: 'small' | 'large' }) {
  const large = size === 'large';
  return (
    <View style={[styles.pill, large && styles.large]}>
      <Feather name="check" size={large ? 14 : 12} color={colors.green} />
      <Text style={[styles.text, large && styles.largeText]}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    backgroundColor: colors.greenBg,
  },
  large: { paddingHorizontal: 12, paddingVertical: 6 },
  text: { fontFamily: fonts.medium, fontSize: 12, color: colors.green },
  largeText: { fontSize: 15 },
});
