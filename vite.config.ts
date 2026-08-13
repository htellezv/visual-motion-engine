import { defineConfig, type Plugin } from 'vite';

declare const process: {
  cwd(): string;
  execPath: string;
};

declare const __dirname: string;

const rootDir = process.cwd().replaceAll('\\', '/');
const srcEntry = `${rootDir}/src/index.ts`;
const declarationsOutputDir = `${rootDir}/dist`;

function emitDeclarations(): Plugin {
  return {
    name: 'vme-emit-declarations',
    closeBundle: async () => {
      const dynamicImport = new Function('specifier', 'return import(specifier);') as (
        specifier: string,
      ) => Promise<{ execFileSync: (...args: unknown[]) => void }>;
      const { execFileSync } = await dynamicImport('node:child_process');
      const tscPath = `${rootDir}/node_modules/typescript/bin/tsc`;

      execFileSync(process.execPath, [
        tscPath,
        '--project',
        `${rootDir}/tsconfig.app.json`,
        '--rootDir',
        `${rootDir}/src`,
        '--declaration',
        '--emitDeclarationOnly',
        '--noEmit',
        'false',
        '--outDir',
        declarationsOutputDir,
      ], {
        stdio: 'inherit',
      });
    },
  };
}

export default defineConfig({
  build: {
    lib: {
      entry: srcEntry,
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'framer-motion'],
    },
  },
  plugins: [emitDeclarations()],
});
