import type { ConfigContext, ExpoConfig } from 'expo/config'

type ProcessLike = {
  env?: Record<string, string | undefined>
}

function readEnv(name: string): string | undefined {
  return (globalThis as typeof globalThis & { process?: ProcessLike }).process?.env?.[name]
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const origin = readEnv('EXPO_PUBLIC_API_ORIGIN')
  const plugins = (config.plugins ?? []).map((plugin) => {
    if (plugin === 'expo-router' && origin) {
      return ['expo-router', { origin }]
    }
    return plugin
  }) as ExpoConfig['plugins']

  return {
    ...config,
    name: config.name ?? '8bit Sleep',
    slug: config.slug ?? '8bit-sleep',
    plugins,
    web: {
      ...config.web,
      // No server-side routes any more: /api/oracle is the Go service,
      // so the web build is plain static files.
      output: 'static',
    },
  }
}
