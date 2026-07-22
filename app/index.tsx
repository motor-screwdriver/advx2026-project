import { Redirect } from 'expo-router';
import React from 'react';

import { HomeScreen } from '../src/screens/HomeScreen';
import { useGame } from '../src/ui/useGame';

export default function IndexRoute() {
  const { state } = useGame();
  if (!state.onboardingDone) {
    return <Redirect href="/onboarding" />;
  }
  return <HomeScreen />;
}
