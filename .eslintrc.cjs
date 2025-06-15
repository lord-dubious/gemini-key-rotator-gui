module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn', // Re-enabled with targeted overrides below
    'prefer-const': 'error',
    'no-var': 'error',
  },
  overrides: [
    {
      // Allow 'any' in utility functions, API services, and type definitions where it's necessary
      files: [
        'src/utils/**/*.ts',
        'src/services/**/*.ts',
        'src/types/**/*.ts',
        'deno-edge/**/*.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}
