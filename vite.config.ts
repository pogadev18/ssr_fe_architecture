import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

import { config } from 'dotenv';
config();

export default defineConfig((env) => {
  const isCJSBundleTarget = process.env.BUNDLE_TARGET === 'cjs';
  return {
    // temp solution, see
    // https://vitejs.dev/guide/env-and-mode.html
    // and
    // https://github.com/vladnicula/micro-react-frontends/issues/10
    // define: Object.entries(process.env).reduce((acc: Record<string, string>, [key, value]) => {
    //   // IDEA. I could send over process.env.foo = 'process.env.foo' and
    //   // then the server will work. Or we could have if statements here like
    //   // if (key.startWith(SERVER_ONLY) then process.env.foo = 'process.env.foo' :-?
    //   // acc[`process.env.${key}`] = 'process.env.' + key works, it lets env vars in bundle
    //   // but breaks the jsx runtime. More exploration is needed. Unsure if this is
    //   // a worthy exploration now.
    //   acc[`process.env.${key}`] = JSON.stringify(value)
    //   return acc
    // }, {}),
    // temp hack for the temp fix :| inlining all env vars breaks hydration
    define: [
      'AEM_DEV_ENV_USER',
      'AEM_DEV_ENV_PASS',
      'ALGOLIA_APP_ID',
      'ALGOLIA_API_KEY',
    ].reduce((acc: Record<string, string>, key) => {
      acc[`process.env.${key}`] = JSON.stringify(
        process.env[key] ?? 'undefined'
      );
      return acc;
    }, {}),
    build: {
      manifest: true,
      minify: false,
      rollupOptions: {
        input: getComponentEntries(),
        external: ['react', 'react-dom'],
        preserveEntrySignatures: 'exports-only',
        output: [
          isCJSBundleTarget
            ? {
                format: 'cjs',
                dir: 'dist/cjs',
                entryFileNames: '[name]-[hash].js',
              }
            : {
                format: 'es',
                dir: 'dist/es',
                entryFileNames: '[name]-[hash].js',
              },
        ],
      },
    },
  };
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
