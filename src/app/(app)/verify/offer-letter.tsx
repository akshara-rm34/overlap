import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, space } from '@/lib/theme';
import { MAX_OFFER_LETTER_BYTES, uploadOfferLetter } from '@/lib/verification';

type Picked = { uri: string; name: string; mimeType: string; size?: number };

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
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/pdf',
      size: asset.size,
    });
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
    <Screen>
      <Text style={styles.title}>Upload your offer letter</Text>
      <Text style={styles.body}>
        No work email yet? Upload your offer letter (PDF or photo). Someone on the Overlap team
        checks it by hand, usually within a day. We delete the letter after review and only keep
        your company name.
      </Text>
      <View style={styles.fileBox}>
        <Text style={file ? styles.fileName : styles.muted}>{file ? file.name : 'No file chosen'}</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={file ? 'Choose a different file' : 'Choose file'} variant="secondary" onPress={onPick} />
      <Button title="Upload for review" onPress={onUpload} loading={busy} disabled={!file} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.muted, marginTop: space.sm, marginBottom: space.lg, lineHeight: 21 },
  fileBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: space.md,
    marginBottom: space.sm,
  },
  fileName: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 15 },
  error: { color: colors.error, marginBottom: space.sm },
});
