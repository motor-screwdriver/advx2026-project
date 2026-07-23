import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { SpriteEntry } from '../../assets/manifest';
import { AUDIO, ICONS, SCENES, SPRITES, SPRITES_1BIT } from '../../assets/manifest';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';

const MAX_WIDTH = 300;

/** QA wall for PROMPT C: renders every manifest asset so art can be eyeballed
 *  in-app. Multi-frame assets show as their horizontal strip. Behind
 *  FLAGS.artGallery; linked from the debug menu. */
export function ArtGalleryScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{strings.gallery_title}</Text>
      <Text style={styles.body}>{strings.gallery_body}</Text>
      <SpriteSection title="Sprites" entries={SPRITES} />
      <SpriteSection title="Sprites 1-bit (e-ink)" entries={SPRITES_1BIT} paper />
      <SpriteSection title="Scenes" entries={SCENES} />
      <SpriteSection title="Icons" entries={ICONS} />
      <AudioSection />
    </ScrollView>
  );
}

function SpriteSection({
  title,
  entries,
  paper = false,
}: {
  title: string;
  entries: Record<string, SpriteEntry>;
  paper?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {Object.entries(entries).map(([name, entry]) => (
        <SpriteRow key={name} name={name} entry={entry} paper={paper} />
      ))}
    </View>
  );
}

function SpriteRow({ name, entry, paper }: { name: string; entry: SpriteEntry; paper: boolean }) {
  const width = Math.min(entry.width, MAX_WIDTH);
  const height = Math.round((width * entry.height) / entry.width);
  return (
    <View style={styles.row}>
      <View style={paper && styles.paper}>
        <Image source={entry.source} style={{ width, height }} resizeMode="stretch" />
      </View>
      <Text style={styles.label}>{name}</Text>
      <Text style={styles.meta}>
        {entry.frameWidth}x{entry.frameHeight} · {entry.frames}f
      </Text>
    </View>
  );
}

function AudioSection() {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Audio</Text>
      {Object.entries(AUDIO).map(([name, entry]) => (
        <Text key={name} style={styles.label}>
          {name} · {entry.durationSec.toFixed(1)}s{entry.loop ? ' · loop' : ''}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  content: { alignItems: 'center', padding: theme.spacing(5), gap: theme.spacing(4) },
  title: { ...theme.type.title, color: theme.colors.gold, textAlign: 'center' },
  body: { ...theme.type.body, color: theme.colors.textDim, textAlign: 'center' },
  section: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.panel,
    borderColor: theme.colors.outline,
    borderWidth: theme.borderWidth,
    borderRadius: theme.borderRadius,
    padding: theme.spacing(4),
    gap: theme.spacing(3),
  },
  heading: {
    ...theme.type.label,
    color: theme.colors.gold,
    textTransform: 'uppercase',
  },
  row: { alignItems: 'center', gap: theme.spacing(1) },
  paper: { backgroundColor: '#f2e7d5' },
  label: { ...theme.type.body, color: theme.colors.text },
  meta: { ...theme.type.label, color: theme.colors.textDim },
});
