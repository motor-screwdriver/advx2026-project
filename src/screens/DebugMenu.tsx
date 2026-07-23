import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FLAGS } from '../contracts/flags';
import { PixelButton } from '../ui/PixelButton';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame, type DebugPreset } from '../ui/useGame';

interface DebugRoute {
  href: string;
  label: string;
}

const ROUTES: DebugRoute[] = [
  { href: '/onboarding', label: strings.onboarding_title },
  { href: '/hero-ceremony', label: strings.ceremony_begin },
  { href: '/morning-scene', label: strings.morning_title },
  { href: '/death', label: strings.death_title },
  { href: '/resurrection', label: strings.soul_title },
  { href: '/mosaic', label: strings.mosaic_title },
  { href: '/chest', label: strings.chest_title },
  { href: '/inventory', label: strings.inventory_title },
  { href: '/tutorial', label: strings.tutorial_title },
  { href: '/settings', label: strings.settings_title },
];

const PRESETS: { preset: DebugPreset; label: string }[] = [
  { preset: 'empty', label: strings.debug_empty },
  { preset: 'mid', label: strings.debug_mid },
  { preset: 'death', label: strings.debug_death },
];

/** Temporary M0-M1 navigation + state presets. Removed before release. */
export function DebugMenu() {
  const { loadDebugPreset } = useGame();
  let routes = FLAGS.raids
    ? [...ROUTES, { href: '/raid-lobby', label: strings.raid_title }]
    : ROUTES;
  routes = FLAGS.artGallery
    ? [...routes, { href: '/art-gallery', label: strings.gallery_title }]
    : routes;
  return (
    <View style={styles.menu}>
      <Text style={styles.heading}>{strings.debug_title}</Text>
      <View style={styles.grid}>
        {routes.map((route) => (
          <Link key={route.href} href={route.href} asChild>
            <PixelButton compact label={route.label} />
          </Link>
        ))}
      </View>
      <Text style={styles.heading}>{strings.debug_presets}</Text>
      <View style={styles.grid}>
        {PRESETS.map(({ preset, label }) => (
          <PixelButton key={preset} compact label={label} onPress={() => loadDebugPreset(preset)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: { gap: theme.spacing(2) },
  heading: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing(2),
  },
});
