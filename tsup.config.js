import { defineConfig } from 'tsup';

export default defineConfig(() => ({
  entry: ['lib/sdk/index.js'],
  format: ['esm', 'cjs'],
  sourcemap: true,
  clean: true,
  target: 'es2019',
  outDir: 'dist',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
}));
