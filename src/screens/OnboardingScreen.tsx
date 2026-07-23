import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ICONS } from '../../assets/manifest';
import { PixelButton } from '../ui/PixelButton';
import { PixelSprite } from '../ui/PixelSprite';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';
import { WheelPicker } from '../ui/WheelPicker';
import { formatClock, formatDuration, isValidWindow } from '../ui/window';

const STEP = 15;
const range = (from: number, to: number) =>
  Array.from({ length: (to - from) / STEP + 1 }, (_, i) => from + i * STEP);

// Bedtime 18:00..03:00, wake 00:00..12:00 (night-line minutes from noon).
const BED_VALUES = range(360, 900);
const WAKE_VALUES = range(720, 1440);

export function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useGame();
  const [bedMin, setBedMin] = useState(690); // 23:30
  const [wakeMin, setWakeMin] = useState(1140); // 07:00
  const valid = isValidWindow({ bedMin, wakeMin });

  const begin = () => {
    completeOnboarding({ bedMin, wakeMin });
    router.replace('/hero-ceremony');
  };

  return (
    <Screen title={strings.onboarding_title}>
      <View style={styles.logo}>
        <PixelSprite sprite={ICONS.logo} size={120} animated={false} />
      </View>
      <View style={styles.intro}>
        <Text style={styles.introText}>{strings.onboarding_intro_1}</Text>
        <Text style={styles.introText}>{strings.onboarding_intro_2}</Text>
        <Text style={styles.introText}>{strings.onboarding_intro_3}</Text>
      </View>
      <View style={styles.wheels}>
        <WheelColumn
          label={strings.onboarding_bedtime}
          values={BED_VALUES}
          value={bedMin}
          onChange={setBedMin}
        />
        <WheelColumn
          label={strings.onboarding_wakeup}
          values={WAKE_VALUES}
          value={wakeMin}
          onChange={setWakeMin}
        />
      </View>
      <Text style={styles.duration}>
        {strings.onboarding_duration}: {formatDuration(wakeMin - bedMin)}
      </Text>
      {!valid && <Text style={styles.warning}>{strings.onboarding_min_hours}</Text>}
      <PixelButton label={strings.onboarding_begin} onPress={begin} disabled={!valid} />
    </Screen>
  );
}

interface WheelColumnProps {
  label: string;
  values: readonly number[];
  value: number;
  onChange: (value: number) => void;
}

function WheelColumn({ label, values, value, onChange }: WheelColumnProps) {
  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <WheelPicker values={values} format={formatClock} value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { alignItems: 'center' },
  intro: { gap: theme.spacing(2) },
  introText: {
    ...theme.type.body,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  wheels: {
    flexDirection: 'row',
    gap: theme.spacing(4),
  },
  wheelColumn: {
    flex: 1,
    gap: theme.spacing(2),
  },
  wheelLabel: {
    ...theme.type.label,
    color: theme.colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  duration: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: 'center',
  },
  warning: {
    ...theme.type.label,
    color: theme.colors.heartFull,
    textAlign: 'center',
  },
});
