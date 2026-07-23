const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// zustand's ESM build (picked via the `import` export condition on web) uses
// `import.meta.env`, which the web bundle — a classic <script>, not an ES module —
// cannot parse, so the whole bundle throws "Cannot use 'import.meta' outside a
// module" and nothing renders. On native this never happens because Metro resolves
// zustand through its `react-native` condition to the CJS build. Force that same
// CJS build on web by disabling package exports for zustand (and only zustand).
const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && (moduleName === 'zustand' || moduleName.startsWith('zustand/'))) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    )
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = config
