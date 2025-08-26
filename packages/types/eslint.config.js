import { config } from "@workspace/eslint-config/base";

export default [
  ...config,
  {
    ignores: ["dist/**/*"],
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      // Permettre les types any pour les métadonnées JSON
      "@typescript-eslint/no-explicit-any": "off",
      // Permettre les interfaces vides pour les requêtes API
      "@typescript-eslint/no-empty-object-type": "off",
      // Permettre les imports non utilisés dans les fichiers de types
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];