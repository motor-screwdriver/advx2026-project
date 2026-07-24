const expoConfig = require('eslint-config-expo/flat')
const prettierConfig = require('eslint-config-prettier')
const boundaries = require('eslint-plugin-boundaries')

// Module ownership map (see docs "пайплайн разработки команды"): one dev per
// folder; contracts are frozen and import nothing; engine stays UI-free;
// screens reach the engine only via state/contracts; app/ is thin routes only.
const ELEMENTS = [
  { type: 'contracts', pattern: 'src/contracts/**/*', partialMatch: false },
  { type: 'engine', pattern: 'src/engine/**/*', partialMatch: false },
  { type: 'state', pattern: 'src/state/**/*', partialMatch: false },
  { type: 'ui', pattern: 'src/ui/**/*', partialMatch: false },
  { type: 'screens', pattern: 'src/screens/**/*', partialMatch: false },
  { type: 'systems', pattern: 'src/systems/**/*', partialMatch: false },
  { type: 'app', pattern: 'app/**/*', partialMatch: false },
]

const disallowAnyOf = (types) => ({
  disallow: { to: { element: { types: { anyOf: types } } } },
})

const BOUNDARY_POLICIES = [
  {
    from: { element: { type: 'contracts' } },
    ...disallowAnyOf(['engine', 'state', 'ui', 'screens', 'systems', 'app']),
  },
  {
    from: { element: { type: 'engine' } },
    ...disallowAnyOf(['ui', 'screens', 'systems', 'app']),
  },
  { from: { element: { type: 'screens' } }, ...disallowAnyOf(['engine']) },
  { from: { element: { type: 'app' } }, ...disallowAnyOf(['engine', 'state', 'systems']) },
]

const expoEntries = Array.isArray(expoConfig) ? expoConfig : expoConfig.default

module.exports = [
  ...expoEntries,
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': ELEMENTS,
    },
    rules: {
      // Hard limits from the spec (NFR-10) — keep files agent-friendly.
      'max-lines': ['error', 250],
      'max-lines-per-function': ['error', 60],
      'boundaries/dependencies': ['error', { default: 'allow', policies: BOUNDARY_POLICIES }],
    },
  },
  {
    files: ['**/__tests__/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
  },
  prettierConfig,
  { ignores: ['node_modules/**', '.expo/**', 'dist/**', 'coverage/**'] },
]
