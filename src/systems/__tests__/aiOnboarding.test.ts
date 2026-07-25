describe('oracle endpoint resolution', () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_API_ORIGIN
  const ORIGINAL_URL = process.env.EXPO_PUBLIC_API_URL

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_ORIGIN = ORIGINAL
    process.env.EXPO_PUBLIC_API_URL = ORIGINAL_URL
    jest.resetModules()
  })

  function endpoint(): string {
    let value = ''
    jest.isolateModules(() => {
      value = jest.requireActual('../aiOnboarding').ORACLE_ENDPOINT as string
    })
    return value
  }

  it('uses a relative path when no origin is configured', () => {
    delete process.env.EXPO_PUBLIC_API_ORIGIN
    delete process.env.EXPO_PUBLIC_API_URL
    expect(endpoint()).toBe('/api/oracle')
  })

  it('prefixes the path with the configured origin', () => {
    process.env.EXPO_PUBLIC_API_ORIGIN = 'https://oracle.example.com'
    expect(endpoint()).toBe('https://oracle.example.com/api/oracle')
  })

  it('strips trailing slashes from the origin', () => {
    process.env.EXPO_PUBLIC_API_ORIGIN = 'https://oracle.example.com/'
    expect(endpoint()).toBe('https://oracle.example.com/api/oracle')
  })
})
