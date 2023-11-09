import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  build: {
    manifest: true,
    minify: false,
    rollupOptions: {
      input: getComponentEntries(),
      external: ['react', 'react-dom'],
      preserveEntrySignatures: 'exports-only',
      output: {
        format: 'es',
        dir: 'dist',
        entryFileNames: '[name]-[hash].js',
      },
    },
  },
});

// TODO colocate this function with the manifest
// parser function that generates the components
// map used by the express server. Changes made here
// are also accompanied by changes in there.
function getComponentEntries() {
  const componentsDir = path.resolve(__dirname, 'src/micro-roots');

  // Read the files in the components directory
  const files = fs.readdirSync(componentsDir);

  const componentEntries: Record<string, string> = {};

  for (const file of files) {
    if (path.extname(file) === '.tsx') {
      componentEntries[file] = path.resolve(componentsDir, file);
      continue;
    }

    const filePath = path.resolve(componentsDir, file);
    // if we have a directory that has an index.tsx file we consider it a micro root
    if (
      fs.statSync(filePath).isDirectory() &&
      fs.existsSync(path.resolve(filePath, 'index.tsx'))
    ) {
      componentEntries[file] = path.resolve(filePath, 'index.tsx');
    }
  }

  return componentEntries;
}
