import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'The rules engine must stay framework-free (ARCHITECTURE.md D-2).' },
            { name: 'react-dom', message: 'The rules engine must stay framework-free (ARCHITECTURE.md D-2).' },
          ],
          patterns: [
            {
              group: ['**/components/**', '**/src/components/**'],
              message: 'The rules engine must not depend on UI components (ARCHITECTURE.md D-2).',
            },
            {
              group: ['**/ai/**', '**/src/ai/**'],
              message:
                'The rules engine must not depend on the AI module — the dependency is one-way, ai -> engine (ARCHITECTURE.md D-9).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ai/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'The AI module must stay framework-free (ARCHITECTURE.md D-9).' },
            { name: 'react-dom', message: 'The AI module must stay framework-free (ARCHITECTURE.md D-9).' },
          ],
          patterns: [
            {
              group: ['**/components/**', '**/src/components/**'],
              message: 'The AI module must not depend on UI components (ARCHITECTURE.md D-9).',
            },
          ],
        },
      ],
    },
  },
)
