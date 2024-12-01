import prettier from "eslint-plugin-prettier";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["lib/**/*", "generated/**/*"],
}, ...compat.extends("prettier").map(config => ({
    ...config,
    files: ["**/*.ts"],
})), {
    files: ["**/*.ts"],

    plugins: {
        prettier,
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    settings: {
        "import/resolver": {
            node: {
                moduleDirectory: ["node_modules", "src/"],
            },

            typescript: {
                alwaysTryTypes: true,
            },
        },
    },

    rules: {
        "no-param-reassign": "off",
        "import/order": "off",
        "no-console": "off",
        "no-shadow": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/no-shadow": "off",
        "import/no-cycle": "off",
        "import/no-extraneous-dependencies": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            vars: "all",
            args: "none",
        }],

        "prettier/prettier": ["warn", {
            bracketSpacing: true,
            printWidth: 140,
            singleQuote: true,
            trailingComma: "none",
            tabWidth: 2,
            useTabs: false,
            endOfLine: "auto",
        }],
    },
}];