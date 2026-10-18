import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius, space, type } from '@/lib/theme';

type Props = TextInputProps & {
  label: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
};

export function TextField({ label, prefix, suffix, hint, multiline, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={[type.label, styles.label]}>{label}</Text>
      <View style={[styles.box, multiline && styles.multiBox]}>
        {prefix && <Text style={styles.affix}>{prefix}</Text>}
        <TextInput
          placeholderTextColor={colors.faint}
          style={[styles.input, multiline && styles.multiInput, style]}
          multiline={multiline}
          {...inputProps}
        />
        {suffix && <Text style={[styles.affix, styles.suffix]}>{suffix}</Text>}
      </View>
      {hint && <Text style={[type.small, styles.hint]}>{hint}</Text>}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  box: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    borderRadius: radius,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { marginBottom: space.sm },
  box: fieldStyles.box,
  multiBox: { alignItems: 'flex-start', paddingVertical: 12 },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
  },
  multiInput: { minHeight: 88, paddingVertical: 0, textAlignVertical: 'top' },
  affix: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, marginRight: 2 },
  suffix: { color: colors.muted, fontSize: 12, marginLeft: space.sm, marginRight: 0 },
  hint: { marginTop: space.xs, textAlign: 'right' },
});
