import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth';
import { otherUidIn, useConversations, type Conversation } from '@/lib/chat';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { useUserProfile } from '@/lib/useUserProfile';

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const day = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function when(c: Conversation): string {
  if (!c.lastMessageAt) return '';
  const d = c.lastMessageAt.toDate();
  return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d);
}

function Row({ conv, me }: { conv: Conversation; me: string }) {
  const other = useUserProfile(otherUidIn(conv.id, me));
  const name = other?.displayName ?? '…';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chat/[convId]', params: { convId: conv.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar name={name} size={48} />
      <View style={styles.rowText}>
        <View style={styles.rowTop}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={type.small}>{when(conv)}</Text>
        </View>
        <Text style={type.body} numberOfLines={1}>
          {conv.lastSenderId === me ? 'You: ' : ''}
          {conv.lastMessageText}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Conversations() {
  const { user } = useAuth();
  const list = useConversations();

  return (
    <Screen back={{ label: 'Matches', onPress: () => router.back() }}>
      <Text style={[type.h1, styles.title]}>Messages</Text>
      {!list ? (
        <ActivityIndicator color={colors.primary} />
      ) : list.length === 0 ? (
        <View style={styles.empty}>
          <Text style={type.h2}>No messages yet</Text>
          <Text style={type.body}>Open one of your matches and tap Message to say hi.</Text>
        </View>
      ) : (
        list.map((c) => <Row key={c.id} conv={c} me={user!.uid} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: space.md },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  rowText: { flex: 1, gap: 2 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, flexShrink: 1 },
  empty: { backgroundColor: colors.card, borderRadius: radius, padding: space.md, gap: space.sm },
});
