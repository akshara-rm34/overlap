import Feather from '@expo/vector-icons/Feather';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, space, type } from '@/lib/theme';

type Props = {
  children: ReactNode;
  // Small "‹ Back" style link above the title.
  back?: { label: string; onPress: () => void };
  // Pinned to the bottom, outside the scroll area (main action buttons).
  footer?: ReactNode;
  // Right side of the top bar.
  headerRight?: ReactNode;
};

export function Screen({ children, back, footer, headerRight }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Feather name="home" size={18} color={colors.text} />
        <Text style={styles.brand}>Overlap</Text>
        <View style={styles.flex} />
        {headerRight}
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {back && (
            <Pressable onPress={back.onPress} style={styles.back} hitSlop={8}>
              <Feather name="chevron-left" size={16} color={colors.muted} />
              <Text style={[type.small, styles.backText]}>{back.label}</Text>
            </Pressable>
          )}
          {children}
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  brand: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: space.lg, paddingBottom: space.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: space.lg },
  backText: { fontFamily: fonts.medium, fontSize: 13 },
  footer: { paddingHorizontal: 20, paddingBottom: space.sm },
});
