import Feather from '@expo/vector-icons/Feather';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { MAX_OFFER_LETTER_BYTES, uploadOfferLetter } from '@/lib/verification';

type Picked = { uri: string; name: string; mimeType: string };

export default function OfferLetter() {
  const [file, setFile] = useState<Picked | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPick() {
    setError(null);
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (asset.size && asset.size > MAX_OFFER_LETTER_BYTES) {
      setError('That file is over 10 MB. Try a smaller PDF or a photo.');
      return;
    }
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' });
  }

  async function onUpload() {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await uploadOfferLetter(file);
      // The layout moves on once the status shows pending.
    } catch {
      setError('Upload failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <Screen
      back={{ label: 'Back', onPress: () => router.back() }}
      footer={
        <Button title="Upload for review" onPress={onUpload} loading={busy} disabled={!file} />
      }>
      <Text style={type.h1}>Upload your offer letter</Text>
      <Text style={[type.body, styles.intro]}>
        No work email yet? Upload your offer letter (PDF or photo). Someone on the Overlap team
        checks it by hand, usually within a day. We delete the letter after review and only keep
        your company name.
      </Text>
      <Pressable onPress={onPick} style={styles.drop}>
        <Feather name={file ? 'file-text' : 'upload'} size={20} color={colors.text} />
        <Text style={styles.dropText} numberOfLines={1}>
          {file ? file.name : 'Choose a PDF or photo'}
        </Text>
        {file && <Text style={type.small}>Tap to change</Text>}
      </Pressable>
      {error && <Text style={[type.error, styles.error]}>{error}</Text>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: space.sm, marginBottom: space.lg },
  drop: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius,
    paddingVertical: space.xl,
    paddingHorizontal: space.md,
    alignItems: 'center',
    gap: space.sm,
  },
  dropText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  error: { marginTop: space.sm },
});
