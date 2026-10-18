import { Stack } from 'expo-router';

import { Loading } from '@/components/Loading';
import { ProfileProvider, useProfile } from '@/lib/profile';

function AppStack() {
  const { profile, offerLetterStatus, loading, verifySkipped } = useProfile();
  if (loading) return <Loading />;

  // Verify screens close once the user is verified or has an offer letter pending.
  // Unverified users see them first, but can skip and come back from home.
  const canVerify = !profile?.verified && offerLetterStatus !== 'pending';
  const canUseApp = !canVerify || verifySkipped;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={canVerify}>
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected guard={canUseApp}>
        <Stack.Screen name="index" />
        <Stack.Screen name="stay" />
        <Stack.Screen name="checklist" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="person/[uid]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <ProfileProvider>
      <AppStack />
    </ProfileProvider>
  );
}
