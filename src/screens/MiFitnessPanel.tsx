import React from 'react'
import { Text } from 'react-native'

import { SettingsDropdownPanel } from '../ui/settingsSprite'
import { strings } from '../ui/strings'
import { ConnectedState, DisconnectedState, panelStyles } from './MiFitnessParts'
import { useMiFitnessLogin } from './useMiFitnessLogin'

export function MiFitnessPanel({ k }: { k: number }) {
  const model = useMiFitnessLogin()
  return (
    <SettingsDropdownPanel k={k}>
      <Text style={panelStyles.label}>{strings.mifit_title}</Text>
      {model.connected ? (
        <ConnectedState
          region={model.connectedRegion}
          savedAt={model.savedAt}
          onDisconnect={model.disconnect}
        />
      ) : (
        <DisconnectedState {...model} />
      )}
    </SettingsDropdownPanel>
  )
}
