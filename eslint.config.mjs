import next from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      ".worktrees/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      ".turbo/**",
      "next-env.d.ts",
    ],
  },
  ...next,
  ...coreWebVitals,
  {
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;

