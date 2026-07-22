import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from './theme';

interface Props {
  title: string;
  body?: string;
  children?: React.ReactNode;
}

/**
 * Stub-era screen scaffold: centered chunky pixel panel.
 * Bevel = dark outer frame + 2px light top edge, the retro-game cheap trick.
 */
export function PlaceholderScreen({ title, body, children }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.frame}>
        <View style={styles.panel}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.titleRule} />
          {body ? <Text style={styles.body}>{body}</Text> : null}
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(5),
  },
  frame: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.outline,
    borderRadius: theme.borderRadius + 2,
    padding: theme.borderWidth,
  },
  panel: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.borderRadius,
    borderTopWidth: theme.borderWidth,
    borderTopColor: theme.colors.bevelLight,
    paddingHorizontal: theme.spacing(5),
    paddingVertical: theme.spacing(6),
    gap: theme.spacing(4),
  },
  title: {
    ...theme.type.title,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  titleRule: {
    alignSelf: 'center',
    width: 48,
    height: theme.borderWidth,
    backgroundColor: theme.colors.gold,
  },
  body: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
});
