import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "node_modules/",
            "dist/",
            "out/",
            "lib/",
            "eslint.config.mjs",
            "vitest.config.ts",
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // Formatting
            "no-console": "error",
            "curly": "error",
            "eqeqeq": ["error", "smart"],

            // TypeScript rules
            "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-inferrable-types": ["error", { ignoreParameters: true }],
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/no-require-imports": "error",

            // Relaxations to match existing code
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
        },
    },
);
