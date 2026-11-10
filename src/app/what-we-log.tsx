import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, fonts, space, type } from '@/lib/theme';

// Plain-words version of the event list in the README. Keep the two in sync.
const EVENTS: [string, string][] = [
  ['You create an account', 'That it happened, and which version of the app you got (see below).'],
  ['You start verifying', 'Whether you used a work email or an offer letter.'],
  ['You choose to browse before verifying', 'That it happened.'],
  ['You finish verifying', 'Which way you verified.'],
  [
    'Your code screen shows "No code yet?"',
    'How long you waited, and whether you switched to an offer letter.',
  ],
  [
    'You open your matches',
    'Your city, how many matches you had, and how long you stayed on the list.',
  ],
  [
    'A match shows up on your list',
    'Who it was, the overlap type and number of days, and whether your budgets overlap.',
  ],
  ['You open someone’s profile', 'Whose profile, and the overlap type.'],
  ['You tap a badge', 'Whose badge, and which kind it was.'],
  ['You tap Message before you can message', 'Whose profile it was.'],
  ['We suggest a first message', 'Who the conversation is with.'],
  [
    'You send a message',
    'Who it was to, the overlap type, whether it started or replied to a conversation, how many messages you’ve sent there, and whether you used the suggested message as-is, edited it, or typed your own. Not the message text.',
  ],
  ['You start and finish the checklist', 'That it happened. Not your answers.'],
  [
    'The team reviews your offer letter',
    'How long the review took and which checks didn’t match. Not the letter itself.',
  ],
];

export default function WhatWeLog() {
  return (
    <Screen back={{ label: 'Back', onPress: () => router.back() }}>
      <Text style={type.h1}>What we log</Text>
      <Text style={[type.body, styles.intro]}>
        Overlap is a prototype for a Georgia Tech class (CS 4261). We record a short list of
        actions, each with the time it happened, to see whether the app works for people. Here’s
        everything we log:
      </Text>

      {EVENTS.map(([when, what]) => (
        <View key={when} style={styles.row}>
          <Text style={styles.when}>{when}</Text>
          <Text style={type.body}>{what}</Text>
        </View>
      ))}

      <Text style={[type.h2, styles.heading]}>Two versions of the app</Text>
      <Text style={type.body}>
        We’re testing two versions. In one, you verify before you can open full profiles or send
        messages. In the other, you can use everything right away and verifying adds a badge.
        You’re placed in one when you sign up, and we compare how the two groups use the app.
      </Text>

      <Text style={[type.h2, styles.heading]}>What we never log</Text>
      <Text style={type.body}>
        Your work email is never shown to anyone or saved with these actions. Other people only see
        your company name. Message text is saved so chat works, but it isn’t part of the study data.
      </Text>

      <Text style={[type.h2, styles.heading]}>How we use it</Text>
      <Text style={type.body}>
        Before we look at the data, your account is replaced with an ID like P07, so the numbers in
        our report don’t include names. If you upload an offer letter, it’s deleted as soon as
        someone on the team reviews it.
      </Text>
      <Text style={[type.body, styles.last]}>
        All test data, including accounts, profiles, messages, and logs, is deleted after the sprint
        ends.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.md },
  row: { paddingVertical: space.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  when: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, marginBottom: 2 },
  heading: { marginTop: space.lg, marginBottom: space.xs },
  last: { marginTop: space.sm },
});
