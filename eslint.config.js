import js from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";
import playwright from "eslint-plugin-playwright";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
    globalIgnores(["dist", "**/dist"]),
    {
        files: ["**/*.{ts,tsx}"],
        extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    prefer: "type-imports",
                    fixStyle: "separate-type-imports",
                    disallowTypeAnnotations: false,
                },
            ],
            "simple-import-sort/exports": "error",
            "simple-import-sort/imports": "error",
        },
    },
    {
        ...vitest.configs.recommended,
        files: ["src/**/*.test.{ts,tsx}"],
        rules: {
            ...vitest.configs.recommended.rules,
            "vitest/expect-expect": [
                "error",
                {
                    assertFunctionNames: ["expect", "expectTypeOf"],
                },
            ],
        },
    },
    {
        ...playwright.configs["flat/recommended"],
        files: ["tests/**/*.spec.ts", "playwright.config.ts", "playwright.visual.config.ts"],
        rules: {
            ...playwright.configs["flat/recommended"].rules,
            "playwright/expect-expect": [
                "warn",
                {
                    assertFunctionNames: ["expectStableScreenshot"],
                },
            ],
        },
    },
    {
        files: ["tests/visual/**/*.spec.ts"],
        rules: {
            "playwright/no-skipped-test": "off",
        },
    },
]);
