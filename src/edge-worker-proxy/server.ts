require('dotenv').config();
/**
 * The edge worker proxy will receive a HTML doucment
 * from the esi proxy server and will parse it to
 * figure out what inslands/micro-frontends were
 * included via the ESI includes. It will then
 * inject additional links and scripts into the
 * document head (and maybe at the end of the page)
 * to enable the micro-frontends to be loaded fast
 * and avoid the flash of unstyled content.
 */

import express from 'express';
import httpProxy from 'express-http-proxy';
import { parse } from 'node-html-parser';

const port = process.env.EDGE_WORKER_PROXY_PORT ?? 3000;

const edgeWorkerProxyServer = express();

const reactImportMap = `
<!--    
JSPM Generator Import Map
Edit URL: https://generator.jspm.io/#U2VhYGBiDs0rySzJSU1hKEpNTC7RTcnPdTC00DPSM4AIQDkAFVlTAiwA
-->
<script type="importmap">
 {
   "imports": {
     "react": "https://ga.jspm.io/npm:react@18.2.0/index.js",
     "react-dom": "https://ga.jspm.io/npm:react-dom@18.2.0/index.js",
     "react-dom/client": "https://ga.jspm.io/npm:react-dom@18.2.0/client.js"
   },
   "scopes": {
     "https://ga.jspm.io/": {
       "scheduler": "https://ga.jspm.io/npm:scheduler@0.23.0/index.js"
     }
   }
 }
</script>
<!-- ES Module Shims: Import maps polyfill for older browsers without import maps support (eg Safari 16.3) -->
<script
 async
 src="https://ga.jspm.io/npm:es-module-shims@1.8.0/dist/es-module-shims.js"
 crossorigin="anonymous"
></script>`;

edgeWorkerProxyServer.use(
  '/',
  httpProxy(`http://localhost:${process.env.ESI_PROXY_PORT}`, {
    userResDecorator: async (proxyRes, proxyResData, userReq, userRes) => {
      try {
        if (!proxyRes.headers['content-type']?.startsWith('text/html')) {
          return proxyResData;
        }
        const html = proxyResData.toString();
        const root = parse(html);
        const head = root.querySelector('head');
        const islands = root.querySelectorAll('[data-island]');
        if (!head) {
          // log error?
          return proxyResData;
        }

        const jsBundles = new Set();
        const cssBundles = new Set();
        for (const island of islands) {
          const islandType = island.getAttribute('data-island-type');
          const islandCSS = island.getAttribute('data-island-css-chunk');
          // todo: if islandJS is undefined, don't add it to the set
          const islandJS = island.getAttribute('data-island-js-chunk');
          if (islandType !== 'server-only') {
            jsBundles.add(islandJS);
          }
          cssBundles.add(islandCSS);
        }

        // preload css and other assets
        const preloadLinks = [];
        // preload js modules and prepare them to run
        const preloadModuleLinks = [];
        // the links parse requrie the stylesheets, might be
        // changed based on https://web.dev/articles/defer-non-critical-css
        const styleSheetLinks = [];

        for (const jsBundle of jsBundles) {
          preloadModuleLinks.push(
            `<link rel="modulepreload" href="${jsBundle}" as="script">`
          );
        }

        for (const cssBundle of cssBundles) {
          preloadLinks.push(
            `<link rel="preload" href="${cssBundle}" as="style">`
          );
          styleSheetLinks.push(`<link rel="stylesheet" href="${cssBundle}">`);
        }

        const allInjectableHeadElements = [
          reactImportMap,
          ...preloadLinks,
          ...preloadModuleLinks,
          ...styleSheetLinks,
        ];
        for (const element of allInjectableHeadElements) {
          head.appendChild(parse(element));
        }
        return root.toString();
      } catch (err) {
        // log error?
        return proxyResData;
      }
    },
  })
);

edgeWorkerProxyServer.listen(port, () => {
  console.log('Edge Worker Proxy server operationl on', port);
});
