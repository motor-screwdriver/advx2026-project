import React from 'react';

import { strings } from '../ui/strings';
import { PlaceholderScreen } from '../ui/PlaceholderScreen';

export function SettingsScreen() {
  const body = `${strings.settings_body}\n${strings.settings_version}`;
  return <PlaceholderScreen title={strings.settings_title} body={body} />;
}
