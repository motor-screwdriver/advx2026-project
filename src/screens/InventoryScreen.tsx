import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ArtifactId } from '../contracts/types';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { Screen } from '../ui/Screen';
import { strings } from '../ui/strings';
import { theme } from '../ui/theme';
import { useGame } from '../ui/useGame';

function humanize(id: string): string {
  return id
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function InventoryScreen() {
  const { state, equip } = useGame();
  const { equipped, artifacts } = state;

  return (
    <Screen title={strings.inventory_title}>
      <View style={styles.slots}>
        <Slot label={strings.inventory_armor} artifact={equipped.armor} />
        <Slot label={strings.inventory_charm} artifact={equipped.charm} />
      </View>
      <Text style={styles.sectionTitle}>{strings.inventory_consumables}</Text>
      {artifacts.length === 0 ? (
        <Text style={styles.empty}>{strings.inventory_empty}</Text>
      ) : (
        artifacts.map((artifact, index) => (
          <ArtifactRow key={`${artifact}-${index}`} artifact={artifact} onEquip={equip} />
        ))
      )}
    </Screen>
  );
}

function Slot({ label, artifact }: { label: string; artifact: ArtifactId | null }) {
  return (
    <PixelPanel style={styles.slot}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={artifact ? styles.slotValue : styles.slotEmpty}>
        {artifact ? humanize(artifact) : '-'}
      </Text>
    </PixelPanel>
  );
}

interface RowProps {
  artifact: ArtifactId;
  onEquip: (slot: 'armor' | 'charm', artifact: ArtifactId) => void;
}

function ArtifactRow({ artifact, onEquip }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowName}>{humanize(artifact)}</Text>
      <View style={styles.rowActions}>
        <PixelButton compact label="ARM" onPress={() => onEquip('armor', artifact)} />
        <PixelButton compact label="CHM" onPress={() => onEquip('charm', artifact)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slots: {
    flexDirection: 'row',
    gap: theme.spacing(3),
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  slotLabel: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textTransform: 'uppercase',
  },
  slotValue: {
    ...theme.type.label,
    color: theme.colors.gold,
    textAlign: 'center',
  },
  slotEmpty: {
    ...theme.type.label,
    color: theme.colors.textDim,
  },
  sectionTitle: {
    ...theme.type.label,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  empty: {
    ...theme.type.body,
    color: theme.colors.textDim,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
  },
  rowName: {
    ...theme.type.label,
    color: theme.colors.text,
    flex: 1,
  },
  rowActions: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
});
