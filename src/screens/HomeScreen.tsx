import React from 'react';

import { HeartRow } from '../ui/HeartRow';
import { strings } from '../ui/strings';
import { PlaceholderScreen } from '../ui/PlaceholderScreen';
import { DebugMenu } from './DebugMenu';

export function HomeScreen() {
  return (
    <PlaceholderScreen title={strings.home_title} body={strings.home_body}>
      <HeartRow hp={6} />
      <DebugMenu />
    </PlaceholderScreen>
  );
}
