import { Stack } from 'expo-router';

import { Loading } from '@/components/Loading';
import { ProfileProvider, useProfile } from '@/lib/profile';

function AppStack() {
  const { profile, offerLetterStatus, loading, verifySkipped, variant } = useProfile();
  if (loading) return <Loading />;

  // Verify screens close once the user is verified or has an offer letter pending.
  // Required group: unverified users see them first, but can skip and browse limited matches.
  // Optional group: they go straight into the app and can verify later for a badge.
  const canVerify = !profile?.verified && offerLetterStatus !== 'pending';
  const verifyFirst = variant === 'required';
  const canUseApp = !canVerify || verifySkipped || !verifyFirst;

  // The first screen allowed by its guard is where the user lands.
  const verify = (
    <Stack.Protected guard={canVerify}>
      <Stack.Screen name="verify" />
    </Stack.Protected>
  );

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {verifyFirst && verify}
      <Stack.Protected guard={canUseApp}>
        <Stack.Screen name="index" />
        <Stack.Screen name="stay" />
        <Stack.Screen name="checklist" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="person/[uid]" />
        <Stack.Screen name="conversations" />
        <Stack.Screen name="chat/[convId]" />
        <Stack.Screen name="admin" />
      </Stack.Protected>
      {!verifyFirst && verify}
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
