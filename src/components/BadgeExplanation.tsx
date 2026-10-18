import type { Timestamp } from 'firebase/firestore';
import { StyleSheet, Text, View } from 'react-native';

import type { Profile } from '@/lib/profile';
import { colors, fonts, radius, space } from '@/lib/theme';

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function on(ts: Timestamp | null) {
  return ts ? ` on ${monthDay.format(ts.toDate())}` : '';
}

// What the Verified badge actually checked (F16).
export function badgeText(p: Pick<Profile, 'verificationMethod' | 'company' | 'verifiedAt'>) {
  const company = p.company ?? 'their company';
  if (p.verificationMethod === 'offer_letter') {
    return `Offer letter from ${company} reviewed by the Overlap team${on(p.verifiedAt)}. The letter was deleted after review.`;
  }
  return `Work email confirmed at ${company}${on(p.verifiedAt)}. Overlap never shows anyone’s email.`;
}

export function BadgeExplanation({ profile }: { profile: Profile }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{badgeText(profile)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.greenBg,
    borderWidth: 1,
    borderColor: colors.greenBorder,
    borderRadius: radius,
    padding: 12,
    marginTop: space.md,
  },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.green },
});
