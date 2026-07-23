import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ICONS } from '../../assets/manifest';
import type { ArtifactId } from '../contracts/types';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';
import { PixelSprite } from '../ui/PixelSprite';
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

function artIcon(id: ArtifactId) {
  return ICONS[`art_${id}` as keyof typeof ICONS];
}

function artifactDesc(id: ArtifactId): string {
  return strings[`artifact_${id}` as keyof typeof strings];
}

export function InventoryScreen() {
  const { state, equip } = useGame();
  const { equipped, artifacts } = state;

  return (
    <Screen title={strings.inventory_title}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>{strings.inventory_hint}</Text>
        <View style={styles.slots}>
          <Slot
            label={strings.inventory_armor}
            desc={strings.inventory_armor_desc}
            artifact={equipped.armor}
          />
          <Slot
            label={strings.inventory_charm}
            desc={strings.inventory_charm_desc}
            artifact={equipped.charm}
          />
        </View>
        <Text style={styles.sectionTitle}>{strings.inventory_consumables}</Text>
        {artifacts.length === 0 ? (
          <Text style={styles.empty}>{strings.inventory_empty}</Text>
        ) : (
          artifacts.map((artifact, index) => (
            <ArtifactRow
              key={`${artifact}-${index}`}
              artifact={artifact}
              equipped={equipped}
              onEquip={equip}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

interface SlotProps {
  label: string;
  desc: string;
  artifact: ArtifactId | null;
}

function Slot({ label, desc, artifact }: SlotProps) {
  return (
    <PixelPanel style={styles.slot} contentStyle={styles.slotContent}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotDesc}>{desc}</Text>
      {artifact && <PixelSprite sprite={artIcon(artifact)} size={40} animated={false} />}
      <Text style={artifact ? styles.slotValue : styles.slotEmpty}>
        {artifact ? humanize(artifact) : strings.inventory_slot_empty}
      </Text>
    </PixelPanel>
  );
}

interface RowProps {
  artifact: ArtifactId;
  equipped: { armor: ArtifactId | null; charm: ArtifactId | null };
  onEquip: (slot: 'armor' | 'charm', artifact: ArtifactId) => void;
}

function ArtifactRow({ artifact, equipped, onEquip }: RowProps) {
  const equippedIn =
    equipped.armor === artifact ? 'armor' : equipped.charm === artifact ? 'charm' : null;
  return (
    <PixelPanel contentStyle={styles.rowContent}>
      <View style={styles.rowHeader}>
        <PixelSprite sprite={artIcon(artifact)} size={28} animated={false} />
        <Text style={styles.rowName}>{humanize(artifact)}</Text>
        {equippedIn && (
          <Text style={styles.badge}>
            {strings.inventory_equipped}:{' '}
            {equippedIn === 'armor' ? strings.inventory_armor : strings.inventory_charm}
          </Text>
        )}
      </View>
      <Text style={styles.rowDesc}>{artifactDesc(artifact)}</Text>
      <View style={styles.rowActions}>
        <PixelButton
          compact
          label={strings.inventory_to_armor}
          onPress={() => onEquip('armor', artifact)}
        />
        <PixelButton
          compact
          label={strings.inventory_to_charm}
          onPress={() => onEquip('charm', artifact)}
        />
      </View>
    </PixelPanel>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: theme.spacing(4), paddingBottom: theme.spacing(6) },
  hint: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
  },
  slots: {
    flexDirection: 'row',
    gap: theme.spacing(3),
  },
  slot: {
    flex: 1,
  },
  slotContent: {
    alignItems: 'center',
    gap: theme.spacing(2),
  },
  slotLabel: {
    ...theme.type.title,
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  slotDesc: {
    ...theme.type.label,
    color: theme.colors.textDim,
    textAlign: 'center',
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
  rowContent: { gap: theme.spacing(2) },
  rowHeader: {
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
  badge: {
    ...theme.type.label,
    color: theme.colors.leaf,
  },
  rowDesc: {
    ...theme.type.label,
    color: theme.colors.textDim,
  },
  rowActions: {
    flexDirection: 'row',
    gap: theme.spacing(2),
  },
});
