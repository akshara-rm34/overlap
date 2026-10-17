import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, space } from '@/lib/theme';

type Props = TextInputProps & { label: string };

export function TextField({ label, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: space.md },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: space.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
});
