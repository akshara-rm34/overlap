import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, space, type } from '@/lib/theme';

type Option<T> = { value: T; label: string };

type Props<T> = {
  label: string;
  hint?: string;
  options: Option<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
};

// A row of choices where one can be picked (used for city and checklist answers).
export function OptionGroup<T extends string | number | boolean>({
  label,
  hint,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      {hint && <Text style={[type.small, styles.hint]}>{hint}</Text>}
      <View style={styles.row}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[styles.option, selected && styles.selected]}>
              <Text style={[styles.text, selected && styles.selectedText]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { marginBottom: space.sm },
  hint: { marginTop: -4, marginBottom: space.sm },
  row: { flexDirection: 'row', gap: space.sm },
  option: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 6,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, textAlign: 'center' },
  selectedText: { color: colors.primaryText },
});
