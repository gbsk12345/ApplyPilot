// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Note: The 'next/typescript' config extended below should already
// include and configure '@typescript-eslint/parser' and '@typescript-eslint/eslint-plugin'.
// If for some reason it doesn't, or if ESLint later complains about not finding
// the rule definition, you might need to explicitly include those in the override.
// However, typically Next.js configs handle this.

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Your existing configurations are spread here first
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add your override configuration object AFTER the extended configs
  {
    files: ["**/*.ts", "**/*.tsx"], // This ensures the override applies only to TypeScript files
                                   // Adjust glob patterns if your TS files are located elsewhere or have different extensions
    rules: {
      // Disable the '@typescript-eslint/no-explicit-any' rule
      "@typescript-eslint/no-explicit-any": "off",

      // If you prefer to make it a warning instead of completely off:
      // "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;