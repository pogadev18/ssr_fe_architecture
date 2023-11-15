# micro-react

This document describes the architecture and setup of a server-side rendering (SSR) system for React components using Express.js and Vite, including fetching data needed for rendering (using getStaticProps) and handling CSS and JavaScript (JS) assets for these components. The system leverages the <esi:include/> tag for dynamic content inclusion.

## NPM Scripts

- `dev` is the main components renderer in dev mode, which receives requests to 
  send HTML at the request of the ESI resolver.
- `build:components-server` is the `dev` server transpiled as a nodejs script. 
  This transpilation is needed because we are using typescript in the server code.
- `run:comopnents-server` is the run command that should run in the clouud as well
  which will pick up the transpiled source code from `build:components-server`.

- `esi-proxy` is the esi resolver. This should not become part of the
  final architecture as it is just a mock for Akamai or other similar services.

- `edge-worker-proxy` is the main page orchestrator, which is supposed to 
  receive the resolved HTML document, after the `esi-proxy` does its thing which
  injects additional HTML tags in the head of the document. 


- `build:micro-roots` and `build:micro-roots-cjs` build the components used by
  the `dev` server (the component renderer responsible for generating HTML
  for the ESI includes)
- `watch:micro-roots` is a script that bundles ONLY what changes in the code of
  the micro roots (the components that will render their HTML when ESI includes
  are resolved) 

- `build:css-modules` generates the type definitions of CSS modules styles for 
  type safe imports in typescript files. Without these, `import styles from 'my.module.css'`
  will show an error in typescript because ts does not understand the css module.
- `watch:css-modules` is the incremental update of the `build:css-module` script,
  allowing minimal update to be generated for the type defs of the css modules.\

- `check:up-to-date-types` and `prepare` are not to be used by hand, they will run
  when a commit is make and make sure that whoever is making the commit is doing so
  with the latest css modules type definitions. The `prepare` script can be extended
  for additional pre-commit hook actions, preventing poor quality or clrealy broken
  code from making it into the codebase.



## Edge worker Proxy

A server that intercepts http requests and if the responses are HTML documents 
it will parse them, find the micro front end roots and inject additional JS and CSS
tags in the head.

## ESI Proxy Server

This is a small proxy server that will replace the `<esi:include .../>` tags with
their corresponding html chunks. It is just for demo purposes. The expectation is
that Akamai will handle this esi includes for us.

To start the server run `npm run esi-proxy` and navigate to the port of the proxy 
server (see terminal logs for port). 

This will be the main entry point for the demo. It will be the final resolved
result of the html page with all the micro frontend components serverside rendered
and ready for action.

## Required env variables

```
# used by the carousel and other componetns to fetch
# cms data from AEM
AEM_DEV_ENV_USER=
AEM_DEV_ENV_PASS=
# Algolia search creds for some components
ALGOLIA_APP_ID=
ALGOLIA_API_KEY=

# Ports for the servers running in the PoC
ESI_PROXY_PORT=3002
COMPONENTS_RENDERER_SERVER_PORT=3001
EDGE_WORKER_PROXY_PORT=3000
```

## Project setup:

```bash
npm install
```

To run:

```bash
npm run dev
```
