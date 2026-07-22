import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FLAGS } from '../contracts/flags';
import { PixelButton } from '../ui/PixelButton';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';

interface DebugRoute {
  href: string;
  label: string;
}

const ROUTES: DebugRoute[] = [
  { href: '/onboarding', label: strings.onboarding_title },
  { href: '/hero-ceremony', label: strings.ceremony_title },
  { href: '/morning-scene', label: strings.morning_title },
  { href: '/death', label: strings.death_title },
  { href: '/resurrection', label: strings.resurrection_title },
  { href: '/mosaic', label: strings.mosaic_title },
  { href: '/chest', label: strings.chest_title },
  { href: '/inventory', label: strings.inventory_title },
  { href: '/settings', label: strings.settings_title },
];

/** Temporary M0 navigation: every stub screen reachable from Home. */
export function DebugMenu() {
  const routes = FLAGS.raids
    ? [...ROUTES, { href: '/raid-lobby', label: strings.raid_title }]
    : ROUTES;
  return (
    <View style={styles.menu}>
      <Text style={styles.heading}>{strings.home_debug_title}</Text>
      {routes.map((route) => (
        <Link key={route.href} href={route.href} asChild>
          <PixelButton label={route.label} />
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: { gap: theme.spacing(3) },
  heading: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
