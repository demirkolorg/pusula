import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // ── B-Ç18: Mikro bileşen boyut sınırları ──────────────────────────
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],

      // ── Tip güvenliği ─────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // ── B-Ç18: Çapraz özellik import yasağı ──────────────────────────
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/\\(dashboard\\)/*/components', '@/app/\\(dashboard\\)/*/components/*'],
              message:
                'Başka özelliğin components klasöründen import yapılamaz. 2+ özellikte gerekiyorsa components/ köküne taşı.',
            },
            {
              group: ['@/app/\\(dashboard\\)/*/hooks', '@/app/\\(dashboard\\)/*/hooks/*'],
              message:
                'Başka özelliğin hooks klasöründen import yapılamaz. 2+ özellikte gerekiyorsa hooks/ köküne taşı.',
            },
          ],
        },
      ],

      // ── React ─────────────────────────────────────────────────────────
      'react/jsx-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]

export default eslintConfig
