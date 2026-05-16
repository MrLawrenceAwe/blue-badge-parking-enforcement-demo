import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repositoryName ? `/${repositoryName}/` : '/';

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    exclude: ['node_modules/**', 'dist/**', 'tests/e2e/**'],
  },
});
