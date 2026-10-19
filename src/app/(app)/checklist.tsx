import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { OptionGroup } from '@/components/OptionGroup';
import { Screen } from '@/components/Screen';
import { QUESTIONS, isComplete, type Checklist } from '@/lib/checklist';
import { logEvent } from '@/lib/events';
import { saveChecklist, useProfile } from '@/lib/profile';
import { space, type } from '@/lib/theme';

export default function ChecklistScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const { profile, skipChecklist } = useProfile();

  const [answers, setAnswers] = useState<Partial<Checklist>>(profile?.checklist ?? {});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startLogged = useRef(!!profile?.checklist);

  function setAnswer<K extends keyof Checklist>(key: K, value: Checklist[K]) {
    if (!startLogged.current) {
      startLogged.current = true;
      logEvent('checklist_started', {});
    }
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  async function onSave() {
    if (!isComplete(answers)) return;
    setError(null);
    setBusy(true);
    try {
      const firstTime = !profile?.checklistCompletedAt;
      await saveChecklist(answers, !firstTime);
      if (firstTime) logEvent('checklist_completed', {});
      if (editing) router.back();
      else router.replace('/');
    } catch {
      setError('Couldn’t save. Please try again.');
      setBusy(false);
    }
  }

  function onSkip() {
    skipChecklist();
    router.replace('/');
  }

  const answered = QUESTIONS.filter((q) => answers[q.key] !== undefined).length;

  return (
    <Screen
      back={editing ? { label: 'Profile', onPress: () => router.back() } : undefined}
      footer={
        <>
          <Button
            title={editing ? 'Save' : 'Continue'}
            onPress={onSave}
            loading={busy}
            disabled={answered < QUESTIONS.length}
          />
          {!editing && (
            <Pressable onPress={onSkip} style={styles.skip}>
              <Text style={type.link}>Skip for now</Text>
            </Pressable>
          )}
        </>
      }>
      <Text style={type.h1}>Compatibility checklist</Text>
      <Text style={[type.body, styles.intro]}>
        Your answers show on your profile so matches can see if you’d live well together. {answered}
        /{QUESTIONS.length} answered.
      </Text>

      {QUESTIONS.map((q) => (
        <OptionGroup
          key={q.key}
          label={q.question}
          hint={q.hint}
          options={q.options as { value: Checklist[typeof q.key]; label: string }[]}
          value={answers[q.key]}
          onChange={(v) => setAnswer(q.key, v as never)}
        />
      ))}

      {error && <Text style={type.error}>{error}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.lg },
  skip: { alignItems: 'center', paddingVertical: space.md },
});
