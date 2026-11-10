import type { Timestamp } from 'firebase/firestore';
import { StyleSheet, Text, View } from 'react-native';

import type { VerificationMethod } from '@/lib/profile';
import { colors, fonts, radius, space } from '@/lib/theme';

import { badgeLabel } from './VerifiedPill';

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

type BadgeInfo = {
  verificationMethod: VerificationMethod | null;
  company: string | null;
  verifiedAt?: Timestamp | null;
};

// The badge definition card from the Sprint 4 notebook: how it's earned, what it proves,
// and what it doesn't prove.
export function badgeDefinition(p: BadgeInfo) {
  const company = p.company ?? 'their company';
  const when = p.verifiedAt ? ` on ${monthDay.format(p.verifiedAt.toDate())}` : '';
  if (p.verificationMethod === 'offer_letter') {
    return {
      earned: `Uploaded an offer letter${when}. Someone on the Overlap team checked the name, company, role, and city by hand, then deleted the letter.`,
      proves: `A letter from ${company} with their name on it was checked by a person.`,
      doesNot: `We can’t confirm the letter with ${company}, and it doesn’t guarantee their dates or that they’ll take the job.`,
    };
  }
  if (p.verificationMethod === 'work_email') {
    return {
      earned: `Entered a code we sent to a ${company} email address${when}.`,
      proves: `They can sign in to an email account at ${company}.`,
      doesNot: `It doesn’t prove they work there now, are relocating, or have the dates they listed. Overlap never shows anyone’s email.`,
    };
  }
  return {
    earned: 'This person hasn’t verified yet.',
    proves: 'Nothing has been checked about where they work.',
    doesNot: 'Be careful before sharing personal details or sending money.',
  };
}

export function BadgeExplanation(props: BadgeInfo) {
  const d = badgeDefinition(props);
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{badgeLabel(props.verificationMethod)}</Text>
      <Row label="How it’s earned" text={d.earned} />
      <Row label="What it proves" text={d.proves} />
      <Row label="What it doesn’t prove" text={d.doesNot} />
    </View>
  );
}

function Row({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 12,
    marginTop: space.md,
    gap: space.sm,
  },
  title: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  row: { gap: 2 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.text },
});
