import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/Loading';
import { OverlapPill } from '@/components/OverlapPill';
import { useAuth } from '@/lib/auth';
import { MESSAGE_MAX, otherUidIn, sendMessage, useConversation, type Message } from '@/lib/chat';
import { useMatch } from '@/lib/matches';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { useUserProfile } from '@/lib/useUserProfile';

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

function Bubble({ msg, mine }: { msg: Message; mine: boolean }) {
  return (
    <View style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.theirsWrap]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text style={[styles.bubbleText, mine && styles.mineText]}>{msg.text}</Text>
      </View>
      {msg.sentAt && (
        <Text style={[type.small, styles.time]}>{time.format(msg.sentAt.toDate())}</Text>
      )}
    </View>
  );
}

export default function Chat() {
  const { convId } = useLocalSearchParams<{ convId: string }>();
  const { user } = useAuth();
  const me = user!.uid;
  const otherUid = otherUidIn(convId, me);
  const other = useUserProfile(otherUid);
  const match = useMatch(otherUid);
  const { conv, messages } = useConversation(convId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (messages?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages?.length]);

  if (conv === undefined || messages === null || other === undefined || match === undefined) {
    return <Loading />;
  }

  // A new conversation needs a match. Existing ones keep working even if dates change later.
  const canStart = !!conv || !!match;
  const overlapType = conv?.overlapType ?? match?.overlapType;

  async function onSend() {
    if (!text.trim() || sending) return;
    setError(null);
    setSending(true);
    const draft = text;
    setText('');
    try {
      await sendMessage({
        convId,
        me,
        text: draft,
        newConversation: conv ? undefined : { overlapType: match!.overlapType },
      });
    } catch {
      setText(draft);
      setError('Message didn’t send. Try again.');
    } finally {
      setSending(false);
    }
  }

  const name = other?.displayName ?? 'Unknown';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.headerText}
          onPress={() => router.push({ pathname: '/person/[uid]', params: { uid: otherUid } })}>
          <Text style={styles.headerName} numberOfLines={1}>
            {name}
          </Text>
          {other?.company && <Text style={type.small}>{other.company}</Text>}
        </Pressable>
        {overlapType && <OverlapPill type={overlapType} />}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble msg={item} mine={item.senderId === me} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[type.body, styles.empty]}>
              {canStart
                ? `Say hi to ${name}. Mention your dates or ask about their checklist answers.`
                : `You can only message people you match with.`}
            </Text>
          }
        />
        {error && <Text style={[type.error, styles.error]}>{error}</Text>}
        {canStart && (
          <View style={styles.composer}>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, MESSAGE_MAX))}
              placeholder="Message"
              placeholderTextColor={colors.faint}
              multiline
              style={styles.input}
            />
            <Pressable
              onPress={onSend}
              disabled={!text.trim() || sending}
              accessibilityLabel="Send"
              style={[styles.send, (!text.trim() || sending) && styles.sendOff]}>
              <Feather name="arrow-up" size={18} color={colors.primaryText} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerText: { flex: 1 },
  headerName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  list: { padding: 16, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: space.xl, paddingHorizontal: space.md },
  bubbleWrap: { marginBottom: 10, maxWidth: '80%' },
  mineWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirsWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.text },
  mineText: { color: colors.primaryText },
  time: { marginTop: 3, fontSize: 11 },
  error: { paddingHorizontal: 16, paddingBottom: space.xs },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius * 2,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendOff: { opacity: 0.4 },
});
