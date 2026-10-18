import { StyleSheet } from 'react-native';

// Matches the Solution A Figma prototype.
export const colors = {
  bg: '#FFFFFF',
  text: '#1F2A44',
  muted: '#6B7280',
  faint: '#99A1AF',
  border: '#D1D5DB',
  divider: '#E5E7EB',
  card: '#F5F5F5',
  chip: '#E9EDF5',
  primary: '#1F2A44',
  primaryText: '#FFFFFF',
  green: '#007A55',
  greenSolid: '#009966',
  greenBg: '#ECFDF5',
  greenBorder: '#A4F4CF',
  error: '#B91C1C',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = 10;

export const type = StyleSheet.create({
  h1: { fontFamily: fonts.semibold, fontSize: 28, color: colors.text, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.muted },
  text: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  small: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  link: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  error: { fontFamily: fonts.regular, fontSize: 13, color: colors.error },
});
