# micro-react

This repository describes the architecture and setup of a server-side rendering (SSR) system for React components using Express.js and Vite, including fetching data needed for rendering (using getStaticProps ) and handling CSS and JavaScript (JS) assets for these components. The system leverages the <esi:include/> tag for dynamic content inclusion, optimizing for performance, maintainability, and scalability.

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
```

## Project setup:

```bash
npm install
```

To run:

```bash
npm run index.ts
```
