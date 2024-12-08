import config from "eslint-config-binden-ts";
export default [
  ...config,
  {
    ignores: ["dist/*", "docs/*"],
    languageOptions: { parserOptions: { project: "tsconfig.json" } },
  },
];
