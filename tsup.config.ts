import { defineConfig } from 'tsup';

export default defineConfig([
  // SDK build (ESM + CJS)
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: { entry: { index: 'src/index.ts' } },
    sourcemap: true,
    target: 'node18',
    treeshake: true,
    outDir: 'dist',
    clean: true,
    splitting: false,
  },
  // CLI build (CJS only) — add shebang here
  {
    entry: { 'cli/index': 'src/cli/index.ts' },
    format: ['cjs'],
    sourcemap: true,
    target: 'node18',
    treeshake: true,
    outDir: 'dist',
    clean: false,
    splitting: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
