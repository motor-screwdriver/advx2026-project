import React from 'react';

import { FLAGS } from '../contracts/flags';
import { strings } from '../ui/strings';
import { PlaceholderScreen } from '../ui/PlaceholderScreen';

export function RaidLobbyScreen() {
  const body = FLAGS.raids ? strings.raid_body : strings.raid_disabled;
  return <PlaceholderScreen title={strings.raid_title} body={body} />;
}
