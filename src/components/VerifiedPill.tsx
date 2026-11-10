import Feather from '@expo/vector-icons/Feather';
import { StyleSheet, Text, View } from 'react-native';

import type { VerificationMethod } from '@/lib/profile';
import { colors, fonts } from '@/lib/theme';

// Two badges (F17): the work email badge is the weaker one, so it gets its own look and name.
// null = not verified (only shows for people in the optional-verification group).
const LOOK = {
  offer_letter: {
    icon: 'file-text',
    label: 'Offer letter checked',
    fg: colors.green,
    bg: colors.greenBg,
    border: colors.greenBorder,
  },
  work_email: {
    icon: 'mail',
    label: 'Work email confirmed',
    fg: colors.blue,
    bg: colors.blueBg,
    border: colors.blueBorder,
  },
  none: {
    icon: 'minus-circle',
    label: 'Not verified',
    fg: colors.muted,
    bg: colors.bg,
    border: colors.border,
  },
} as const;

export function badgeLabel(method: VerificationMethod | null) {
  return LOOK[method ?? 'none'].label;
}

export function VerifiedPill({
  method,
  size = 'small',
}: {
  method: VerificationMethod | null;
  size?: 'small' | 'large';
}) {
  const look = LOOK[method ?? 'none'];
  const large = size === 'large';
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: look.bg, borderColor: look.border },
        large && styles.large,
      ]}>
      <Feather name={look.icon} size={large ? 14 : 12} color={look.fg} />
      <Text style={[styles.text, { color: look.fg }, large && styles.largeText]}>{look.label}</Text>
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
  },
  large: { paddingHorizontal: 12, paddingVertical: 6 },
  text: { fontFamily: fonts.medium, fontSize: 12 },
  largeText: { fontSize: 14 },
});
