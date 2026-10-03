import { defineConfig } from 'eslint/config';
import obsidianmd from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default defineConfig([
    { ignores: ['node_modules/**', 'main.js', 'styles.css'] },
    ...obsidianmd.configs.recommended,
    { files: ['src/**/*.ts'], languageOptions: { parserOptions: { projectService: true } } },
    ...svelte.configs['flat/recommended'],
    { files: ['src/**/*.svelte'], languageOptions: { parserOptions: { parser: tseslint.parser } } },
]);
