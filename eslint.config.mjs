import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import simpleImportSort from "eslint-plugin-simple-import-sort"

const eslintConfig = defineConfig([
  // Next.js base configurations
  ...nextVitals,
  ...nextTs,

  // Global ignores
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    "src/prisma/contract.d.ts",
    "src/prisma/contract.json",
    "migrations/**",
  ]),

  // Custom JSX prop sorting (Reserved first, callbacks last)
  {
    name: "custom/jsx-sort-props",
    rules: {
      "react/jsx-sort-props": [
        "error",
        {
          callbacksLast: true,
          shorthandFirst: false,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],
    },
  },

  // Custom deterministic import/export sorting
  {
    name: "custom/import-sort",
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"], // 1. Side-effect imports (e.g. CSS files)
            ["^react", "^next"], // 2. React and Next.js core libraries
            ["^@?\\w"], // 3. Third-party packages (excluding project aliases)
            ["^@/"], // 4. Internal project aliases
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"], // 5. Parent directory relative imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"], // 6. Sibling directory relative imports
            ["^"], // 7. Catch-all
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
])

export default eslintConfig
