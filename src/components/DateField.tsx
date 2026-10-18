import Feather from '@expo/vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, fromYmd, toYmd } from '@/lib/dates';
import { colors, fonts, space, type } from '@/lib/theme';

import { fieldStyles } from './TextField';

type Props = {
  label: string;
  value: string | null; // YYYY-MM-DD
  onChange: (value: string) => void;
  minimumDate?: string;
};

export function DateField({ label, value, onChange, minimumDate }: Props) {
  const [open, setOpen] = useState(false);
  const min = minimumDate ? fromYmd(minimumDate) : undefined;
  const current = value ? fromYmd(value) : (min ?? new Date());

  return (
    <View style={styles.wrap}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      <Pressable onPress={() => setOpen((o) => !o)} style={fieldStyles.box}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDate(value, true) : 'Select a date'}
        </Text>
        <Feather name="calendar" size={16} color={colors.text} />
      </Pressable>
      {open && (
        <DateTimePicker
          value={current}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={min}
          accentColor={colors.primary}
          onValueChange={(_, date) => {
            onChange(toYmd(date));
            if (Platform.OS !== 'ios') setOpen(false);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
      {open && Platform.OS === 'ios' && (
        <Pressable onPress={() => setOpen(false)} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { marginBottom: space.sm },
  value: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  placeholder: { color: colors.faint },
  done: { alignSelf: 'flex-end', paddingVertical: space.xs, paddingHorizontal: space.sm },
  doneText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
});
