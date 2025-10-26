module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    webextensions: true,  // tells ESLint that 'chrome' exists
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-console': 'off',  // allow console.log in development
    'react/prop-types': 'off',  // disable prop-types 
  },
  globals: {
    chrome: 'readonly',  // declare 'chrome' as a global
  },
}