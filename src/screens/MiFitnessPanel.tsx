import React from 'react'
import { Text } from 'react-native'

import { PixelPanel } from '../ui/PixelPanel'
import { strings } from '../ui/strings'
import { ConnectedState, DisconnectedState, panelStyles } from './MiFitnessParts'
import { useMiFitnessLogin } from './useMiFitnessLogin'

export function MiFitnessPanel() {
  const model = useMiFitnessLogin()
  return (
    <PixelPanel>
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
    </PixelPanel>
  )
}
