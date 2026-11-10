import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { formatDate } from '@/lib/dates';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import {
  LETTER_CHECKS,
  approveOfferLetter,
  listOfferLetters,
  rejectOfferLetter,
  verifyErrorMessage,
  type LetterCheck,
  type PendingLetter,
} from '@/lib/verification';

const when = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function LetterCard({ letter, onDone }: { letter: PendingLetter; onDone: () => void }) {
  const [company, setCompany] = useState('');
  const [checked, setChecked] = useState<Set<LetterCheck>>(new Set());
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const mismatches = LETTER_CHECKS.map((c) => c.key).filter((k) => !checked.has(k));
  // Hands-on review time starts at the first checklist tap.
  const startedAt = useRef<number | null>(null);

  function toggle(k: LetterCheck) {
    startedAt.current ??= Date.now();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }
  const [error, setError] = useState<string | null>(null);

  async function run(action: 'approve' | 'reject') {
    setError(null);
    setBusy(action);
    try {
      const review = {
        mismatches,
        handsOnSeconds:
          startedAt.current === null ? null : (Date.now() - startedAt.current) / 1000,
      };
      if (action === 'approve') await approveOfferLetter(letter.uid, company.trim(), review);
      else await rejectOfferLetter(letter.uid, review);
      onDone();
    } catch (err) {
      setError(verifyErrorMessage(err));
      setBusy(null);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={type.h2}>{letter.displayName}</Text>
      <Text style={type.small}>
        Uploaded {letter.uploadedAt ? when.format(new Date(letter.uploadedAt)) : '—'}
      </Text>
      <Text style={[type.small, styles.path]} selectable>
        {letter.path}
      </Text>
      <Text style={type.small}>
        Their stay: {letter.city ?? 'no city'}
        {letter.startDate && letter.endDate
          ? ` · ${formatDate(letter.startDate)} – ${formatDate(letter.endDate, true)}`
          : ''}
      </Text>
      <Text style={[type.label, styles.checksTitle]}>Check the letter</Text>
      {LETTER_CHECKS.map((c) => {
        const on = checked.has(c.key);
        return (
          <Pressable
            key={c.key}
            onPress={() => toggle(c.key)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={styles.check}>
            <View style={[styles.box, on && styles.boxOn]}>
              {on && <Feather name="check" size={12} color={colors.primaryText} />}
            </View>
            <Text style={styles.checkText}>{c.label}</Text>
          </Pressable>
        );
      })}
      <Text style={[type.small, styles.checksNote]}>
        Anything left unchecked is logged as a mismatch.
      </Text>
      <TextField
        label="Company on the letter"
        value={company}
        onChangeText={setCompany}
        placeholder="e.g. Delta"
      />
      {error && <Text style={type.error}>{error}</Text>}
      <Button
        title="Approve"
        onPress={() => run('approve')}
        loading={busy === 'approve'}
        disabled={!company.trim() || busy !== null}
      />
      <Button
        title="Reject"
        variant="secondary"
        onPress={() => run('reject')}
        loading={busy === 'reject'}
        disabled={busy !== null}
      />
    </View>
  );
}

// Team-only. Open each file in the Firebase console (Storage), check it, then approve or reject.
// Either way the file is deleted.
export default function Admin() {
  const [letters, setLetters] = useState<PendingLetter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listOfferLetters()
      .then((l) => {
        setLetters(l);
        setError(null);
      })
      .catch((err) => setError(verifyErrorMessage(err)));
  }, []);

  useEffect(load, [load]);

  return (
    <Screen back={{ label: 'Profile', onPress: () => router.back() }}>
      <Text style={type.h1}>Offer letters</Text>
      <Text style={[type.body, styles.intro]}>
        Open each file in the Firebase console under Storage and go through the checklist, then
        approve or reject it here. The file is deleted either way. We log how long each review
        took and which checks failed.
      </Text>
      {error ? (
        <Text style={type.error}>{error}</Text>
      ) : !letters ? (
        <ActivityIndicator color={colors.muted} />
      ) : letters.length === 0 ? (
        <Text style={type.body}>Nothing waiting for review.</Text>
      ) : (
        letters.map((l) => <LetterCard key={l.uid} letter={l} onDone={load} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.lg },
  card: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius,
    padding: space.md,
    marginBottom: space.md,
    gap: space.xs,
  },
  path: { marginBottom: space.xs },
  checksTitle: { marginTop: space.sm },
  check: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 4 },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { fontFamily: fonts.regular, fontSize: 13, color: colors.text },
  checksNote: { marginBottom: space.sm },
});
