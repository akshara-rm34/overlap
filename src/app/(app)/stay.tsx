import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { CityField } from '@/components/CityField';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { isKnownCity } from '@/lib/cities';
import { BIO_MAX, saveStay, useProfile } from '@/lib/profile';
import { colors, space, type } from '@/lib/theme';

function parseDollars(s: string): number {
  return Number(s.replace(/[^\d]/g, '')) || 0;
}

export default function StayScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const { profile } = useProfile();

  // Older profiles may have a city that's not in the list; those have to pick again.
  const [city, setCity] = useState<string | null>(isKnownCity(profile?.city) ? profile.city : null);
  const [startDate, setStartDate] = useState<string | null>(profile?.startDate ?? null);
  const [endDate, setEndDate] = useState<string | null>(profile?.endDate ?? null);
  const [budgetMin, setBudgetMin] = useState(profile?.budgetMin ? String(profile.budgetMin) : '');
  const [budgetMax, setBudgetMax] = useState(profile?.budgetMax ? String(profile.budgetMax) : '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function validate(): string | null {
    if (!city) return 'Pick your city from the list.';
    if (!startDate || !endDate) return 'Add your start and end dates.';
    if (endDate <= startDate) return 'End date has to be after the start date.';
    const min = parseDollars(budgetMin);
    const max = parseDollars(budgetMax);
    if (!min || !max) return 'Add your monthly budget range.';
    if (min > max) return 'The lower budget can’t be more than the higher one.';
    return null;
  }

  async function onSave() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await saveStay({
        city: city!,
        startDate: startDate!,
        endDate: endDate!,
        budgetMin: parseDollars(budgetMin),
        budgetMax: parseDollars(budgetMax),
        bio: bio.trim(),
      });
      if (editing) router.back();
      else router.replace('/checklist');
    } catch {
      setError('Couldn’t save. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Screen
      back={editing ? { label: 'Profile', onPress: () => router.back() } : undefined}
      footer={<Button title={editing ? 'Save' : 'Continue'} onPress={onSave} loading={busy} />}>
      <Text style={type.h1}>Set your dates</Text>
      <Text style={[type.body, styles.intro]}>
        We’ll show roommate-seekers whose dates overlap with yours.
      </Text>

      <CityField value={city} onChange={setCity} />
      <DateField label="Start date" value={startDate} onChange={setStartDate} />
      <DateField
        label="End date"
        value={endDate}
        onChange={setEndDate}
        minimumDate={startDate ?? undefined}
      />

      <Text style={[type.label, styles.label]}>Monthly budget</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="From"
            prefix="$"
            value={budgetMin}
            onChangeText={setBudgetMin}
            keyboardType="number-pad"
            placeholder="1,000"
          />
        </View>
        <View style={styles.flex}>
          <TextField
            label="To"
            prefix="$"
            value={budgetMax}
            onChangeText={setBudgetMax}
            keyboardType="number-pad"
            placeholder="1,400"
          />
        </View>
      </View>

      <TextField
        label="About you (optional)"
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
        multiline
        placeholder="Where you’re interning, what you’re like to live with…"
        hint={`${bio.length}/${BIO_MAX}`}
      />

      {error && <Text style={type.error}>{error}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.lg },
  label: { marginBottom: space.sm, color: colors.text },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
});
