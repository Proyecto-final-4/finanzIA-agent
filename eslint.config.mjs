import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    ignores: ["node_modules/"],
  },
]);
