import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { theme } from './theme';

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 3;

interface Props {
  values: readonly number[];
  format: (value: number) => string;
  value: number;
  onChange: (value: number) => void;
}

/** Wheel picker (15-min steps): snap scroll, gold selected row. */
export function WheelPicker({ values, format, value, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, values.indexOf(value)));

  useEffect(() => {
    const index = Math.max(0, values.indexOf(value));
    setSelectedIndex(index);
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
  }, [values, value]);

  const commit = (offsetY: number) => {
    const index = Math.min(Math.max(0, Math.round(offsetY / ITEM_HEIGHT)), values.length - 1);
    setSelectedIndex(index);
    onChange(values[index]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.highlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        onScroll={(event) =>
          setSelectedIndex(Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT))
        }
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => commit(event.nativeEvent.contentOffset.y)}
      >
        {values.map((item, index) => (
          <View key={item} style={styles.item}>
            <Text style={[styles.text, index === selectedIndex && styles.textSelected]}>
              {format(item)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_COUNT,
    overflow: 'hidden',
    backgroundColor: theme.colors.inset,
    borderWidth: theme.borderWidth,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: theme.borderWidth,
    borderBottomWidth: theme.borderWidth,
    borderColor: theme.colors.bevelLight,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.type.body,
    color: theme.colors.textDim,
  },
  textSelected: {
    color: theme.colors.gold,
  },
});
