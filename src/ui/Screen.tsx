import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from './theme';

interface Props {
  title?: string;
  children: React.ReactNode;
}

/** Base screen: safe area, dark bg, optional gold title with rule. */
export function Screen({ title, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rule} />
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing(4),
    gap: theme.spacing(4),
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  title: {
    ...theme.type.title,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  rule: {
    width: 48,
    height: theme.borderWidth,
    backgroundColor: theme.colors.gold,
  },
});
