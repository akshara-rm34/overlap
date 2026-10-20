import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { colors, radius, space, type } from '@/lib/theme';
import {
  approveOfferLetter,
  listOfferLetters,
  rejectOfferLetter,
  verifyErrorMessage,
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
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: 'approve' | 'reject') {
    setError(null);
    setBusy(action);
    try {
      if (action === 'approve') await approveOfferLetter(letter.uid, company.trim());
      else await rejectOfferLetter(letter.uid);
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
        Open each file in the Firebase console under Storage, check the name and company, then
        approve or reject it here. The file is deleted either way.
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
  path: { marginBottom: space.sm },
});
