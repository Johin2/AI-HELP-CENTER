import { defineConfig } from 'tsup';

export default defineConfig(() => ({
  entry: ['lib/sdk/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  outDir: 'dist',
  tsconfig: 'tsconfig.sdk.json',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    };
  },
}));
