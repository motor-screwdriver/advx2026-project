import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';

const CARDS = [
  { title: strings.tutorial_card1_title, body: strings.tutorial_card1_body, tint: theme.colors.leaf },
  { title: strings.tutorial_card2_title, body: strings.tutorial_card2_body, tint: theme.colors.heartFull },
  { title: strings.tutorial_card3_title, body: strings.tutorial_card3_body, tint: theme.colors.gold },
] as const;

export function TutorialScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pageWidth = width - theme.spacing(4) * 2;

  return (
    <Screen title={strings.tutorial_title}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {CARDS.map((card, index) => (
          <View key={card.title} style={[styles.page, { width: pageWidth }]}>
            <PixelPanel style={styles.card}>
              <View style={[styles.image, { backgroundColor: card.tint }]} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.body}</Text>
              {index === CARDS.length - 1 && (
                <PixelButton label={strings.tutorial_done} onPress={() => router.replace('/')} />
              )}
            </PixelPanel>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: theme.spacing(1),
  },
  card: {
    alignItems: 'center',
    minHeight: 320,
  },
  image: {
    width: 96,
    height: 96,
    borderWidth: theme.borderWidth * 2,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
  },
  cardTitle: {
    ...theme.type.title,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  cardBody: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
});
