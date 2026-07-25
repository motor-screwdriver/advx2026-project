import Constants from 'expo-constants'

type ProcessLike = { env?: Record<string, string | undefined> }
type ExpoConstants = {
  expoConfig?: { hostUri?: string } | null
  manifest?: { debuggerHost?: string } | null
  manifest2?: {
    extra?: {
      expoClient?: { hostUri?: string }
      expoGo?: { debuggerHost?: string }
    }
  } | null
}

const DEFAULT_API_PORT = '8080'

function envOrigin(): string | undefined {
  const env = (globalThis as typeof globalThis & { process?: ProcessLike }).process?.env
  return env?.EXPO_PUBLIC_API_ORIGIN || env?.EXPO_PUBLIC_API_URL
}

function expoDevHost(): string | undefined {
  const constants = Constants as ExpoConstants
  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest2?.extra?.expoClient?.hostUri ||
    constants.manifest2?.extra?.expoGo?.debuggerHost ||
    constants.manifest?.debuggerHost
  if (!hostUri) {
    return undefined
  }
  const withoutProtocol = hostUri.replace(/^[a-z]+:\/\//i, '')
  const hostPort = withoutProtocol.split('/')[0]
  return hostPort?.split(':')[0] || undefined
}

function inferredDevOrigin(): string | undefined {
  const host = expoDevHost()
  return host ? `http://${host}:${DEFAULT_API_PORT}` : undefined
}

export function apiEndpoint(path: string): string {
  const origin = envOrigin() || inferredDevOrigin()
  return origin ? `${origin.replace(/\/+$/, '')}${path}` : path
}
