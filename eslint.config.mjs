import { createConfigForNuxt } from '@nuxt/eslint-config';

export default createConfigForNuxt({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021, // Adjust as needed
    sourceType: 'module',
    project: './tsconfig.json', // Required for rules needing type information
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Integrates Prettier
  ],
  rules: {
    // Customize or override rules here
    '@typescript-eslint/no-unused-vars': 'warn', // Example: warn for unused vars
    '@typescript-eslint/explicit-function-return-type': 'off', // Example: disable explicit return type rule
  },
  env: {
    browser: true, // Or "node": true, etc.
    es2021: true,
  },
});
