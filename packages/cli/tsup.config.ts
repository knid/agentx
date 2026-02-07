import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node18',
    dts: true,
    shims: true,
    clean: true,
    splitting: false,
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    entry: ['src/scheduler/daemon.ts'],
    format: ['esm'],
    target: 'node18',
    dts: false,
    shims: true,
    clean: false,
    splitting: false,
    outDir: 'dist/scheduler',
  },
]);
