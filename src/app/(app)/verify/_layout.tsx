import { Stack } from 'expo-router';

export default function VerifyLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerTitle: '', headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
