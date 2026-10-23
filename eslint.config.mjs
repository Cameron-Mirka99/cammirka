import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Too strict for this app's legitimate patterns: syncing from
      // localStorage/matchMedia on mount, bootstrapping auth state, and
      // resetting feed/zoom state when a dependency (tag, folder, photo)
      // changes are all effects doing exactly what effects are for.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Backend (CDK/Lambda) code has its own tsconfig and isn't meant to be
    // linted against Next.js/React rules.
    "amplify/**",
  ]),
]);

export default eslintConfig;
