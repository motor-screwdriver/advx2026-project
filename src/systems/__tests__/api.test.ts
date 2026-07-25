describe('api endpoint resolution', () => {
  const ORIGINAL_ORIGIN = process.env.EXPO_PUBLIC_API_ORIGIN
  const ORIGINAL_URL = process.env.EXPO_PUBLIC_API_URL

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_ORIGIN = ORIGINAL_ORIGIN
    process.env.EXPO_PUBLIC_API_URL = ORIGINAL_URL
    globalThis.ExpoConstants.expoConfig = null
    globalThis.ExpoConstants.manifest = null
    globalThis.ExpoConstants.manifest2 = null
    jest.resetModules()
  })

  function endpoint(): string {
    let value = ''
    jest.isolateModules(() => {
      value = jest.requireActual('../api').apiEndpoint('/api/mifit/login') as string
    })
    return value
  }

  it('uses EXPO_PUBLIC_API_ORIGIN when configured', () => {
    process.env.EXPO_PUBLIC_API_ORIGIN = 'http://10.0.0.2:8080/'
    process.env.EXPO_PUBLIC_API_URL = 'http://wrong.test'
    expect(endpoint()).toBe('http://10.0.0.2:8080/api/mifit/login')
  })

  it('accepts EXPO_PUBLIC_API_URL as a backwards-compatible alias', () => {
    delete process.env.EXPO_PUBLIC_API_ORIGIN
    process.env.EXPO_PUBLIC_API_URL = 'http://10.72.14.65:8080'
    expect(endpoint()).toBe('http://10.72.14.65:8080/api/mifit/login')
  })

  it('falls back to a relative path when no origin can be inferred', () => {
    delete process.env.EXPO_PUBLIC_API_ORIGIN
    delete process.env.EXPO_PUBLIC_API_URL
    expect(endpoint()).toBe('/api/mifit/login')
  })

  it('infers the Go backend origin from the Expo dev host', () => {
    delete process.env.EXPO_PUBLIC_API_ORIGIN
    delete process.env.EXPO_PUBLIC_API_URL
    globalThis.ExpoConstants.expoConfig = { hostUri: '10.72.14.65:8081' }
    expect(endpoint()).toBe('http://10.72.14.65:8080/api/mifit/login')
  })
})
