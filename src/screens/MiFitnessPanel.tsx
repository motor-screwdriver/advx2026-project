import React from 'react'
import { Text } from 'react-native'

import { SettingsDropdownPanel, settingsTitleStyle } from '../ui/settingsDropdown'
import { strings } from '../ui/strings'
import { ConnectedState, DisconnectedState, panelStyles } from './MiFitnessParts'
import { useMiFitnessLogin } from './useMiFitnessLogin'

export function MiFitnessPanel({ k }: { k: number }) {
  const model = useMiFitnessLogin()
  return (
    <SettingsDropdownPanel k={k}>
      <Text style={[panelStyles.label, settingsTitleStyle(k)]}>{strings.mifit_title}</Text>
      {model.connected ? (
        <ConnectedState
          k={k}
          region={model.connectedRegion}
          savedAt={model.savedAt}
          onDisconnect={model.disconnect}
        />
      ) : (
        <DisconnectedState {...model} k={k} />
      )}
    </SettingsDropdownPanel>
  )
}
