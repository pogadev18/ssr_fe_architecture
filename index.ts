import express from 'express';
import React, { Attributes } from 'react';
import ReactDOMServer from 'react-dom/server';
import bodyParser from 'body-parser';
import { join, resolve, basename } from 'path';
import { randomIdentifier } from './src/lib/utils';

const app = express();
const port = 3001;

const componentMap = generateComponentMap(require('./dist/manifest.json'));
// console.log(componentMap);

app.use(bodyParser.json());

// Route that serves the index.html file as a HTML page
app.get('/', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.get('/variant-b', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'variant-b.html'));
});

// the additional esi include call from variant B
// contains the js chunks are links rel='preloadmodule'
// and the css chinks as link rel='stylesheet' to prevent
// layout shifting https://en.wikipedia.org/wiki/Flash_of_unstyled_content
app.get('/dependecies', async (req, res) => {
  // get query param components that should contains strings
  const componentNames = (req.query.components as string).split(',');

  // preloads are non blocking,
  // scripts are blocking
  // links are blocking.
  const preloadLinks = [];
  const preloadModuleLinks = [];
  const improtMapAndReact =
    // TODO could be a html file that is added here
    `<!--    
  JSPM Generator Import Map
  Edit URL: https://generator.jspm.io/#U2VhYGBiDs0rySzJSU1hKEpNTC7RTcnPdTC00DPSM4AIQDkAFVlTAiwA
  -->
  <script type="importmap">
      {
        "imports": {
          "react": "https://ga.jspm.io/npm:react@18.2.0/dev.index.js",
          "react-dom/client": "https://ga.jspm.io/npm:react-dom@18.2.0/dev.client.js"
        },
        "scopes": {
          "https://ga.jspm.io/": {
            "react-dom": "https://ga.jspm.io/npm:react-dom@18.2.0/dev.index.js",
            "scheduler": "https://ga.jspm.io/npm:scheduler@0.23.0/dev.index.js"
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
  const headerScrips = [`<link rel='modulepreload' href='/shell-app.js' />`];

  const headerCSSLinks = [];

  for (const compDeclaration of componentNames) {
    // silently fail if the component is not found in the resulting
    // chunks. Only treat the case of existing components
    console.log(
      `componentMap[${compDeclaration}]`,
      componentMap[compDeclaration]
    );
    if (componentMap[compDeclaration]) {
      const { cssURL, bundleURL, assets } = componentMap[compDeclaration];

      preloadModuleLinks.push(
        `<link rel='modulepreload' href='${bundleURL}' />`
      );

      if (cssURL) {
        console.log('preloading', cssURL);
        // add a preload url for the css
        // see https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload for benefits
        preloadLinks.push(`<link rel='preload' href="${cssURL}" as="style" />`);
        headerCSSLinks.push(`<link rel='stylesheet' href=${cssURL} />`);
      }

      // if ( assets?.length ) {
      //   preloadLinks.push(...(assets.map((assetURL) => {
      //     return `<link rel='prefetch' href="${assetURL}" as="style" />`
      //   })))
      // }
    }
  }

  return res.send(
    [
      improtMapAndReact,
      ...preloadLinks,
      ...preloadModuleLinks,
      ...headerCSSLinks,
      ...headerScrips,
    ].join('\n')
  );
});

// Serve static files from the dist folder
app.use('/dist', express.static('dist'));
app.use('/assets', express.static('dist/assets'));
// Server the shell app JS for now
app.get('/shell-app.js', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'shell-app.js'));
});

app.get('/component/:compDeclaration', async (req, res) => {
  try {
    const { compDeclaration } = req.params;

    if (componentMap[compDeclaration]) {
      const {
        component: DynamicComponent,
        cssURL,
        bundleURL,
      } = componentMap[compDeclaration];

      let params: { props: unknown } = {
        props: {},
      };

      // add a try catch so we don't crash the entire response
      try {
        params = DynamicComponent.getStaticProps
          ? await DynamicComponent.getStaticProps({ query: req.query })
          : { props: {} };
      } catch (error) {
        console.log('error fetching static props for', compDeclaration, error);
      }

      const componentString = ReactDOMServer.renderToString(
        React.createElement(
          DynamicComponent.default,
          params.props as Attributes
        )
      );

      const uniqueIdentifier = `${compDeclaration}-${randomIdentifier()}`;
      const html = `
            <div style='display:contents'>${componentString}</div>
            <script type="module" id="${uniqueIdentifier}">
                import { importJSAndHydrate, importCSS } from '/shell-app.js'
                const scriptTag = document.getElementById('${uniqueIdentifier}');
                const previousElement = scriptTag.previousElementSibling;
                console.log('previousElement', previousElement);
                importJSAndHydrate('${bundleURL}', previousElement, ${JSON.stringify(
        params.props
      )})
                ${cssURL ? `importCSS('${cssURL}')` : ''}
            </script>
            `;

      return res.send(html);
    }
    return res.status(404).send('Component not found');
  } catch (error) {
    console.log(`${req.params.compDeclaration}`, error);
    res
      .status(500)
      .json({ error: 'An error occurred while rendering the component.' });
  }
});

app.post('/render-component', (req, res) => {
  try {
    const { componentName, props } = req.body;

    if (componentMap[componentName]) {
      const { component: DynamicComponent, cssURL } =
        componentMap[componentName];
      const componentString = ReactDOMServer.renderToString(
        React.createElement(DynamicComponent.default, props)
      );

      res.json({
        component: componentString,
        bundleURL: componentMap[componentName].bundleURL,
        cssURL,
      });
    } else {
      res.status(404).json({ error: 'Component not found' });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while rendering the component.' });
  }
});

// Deprecated at the moment. Each component rendered via the
// GET /component/:compDeclaration route injects the js and css
// bundle names as well as the server side fetched data in a
// script tag right after the rendered component HTML.
// With the inject approach we don't need to keep a component
// map on the client side. There are caching benefits though
// from sharing this component map(catalog) with the client,
// we could end up sending less code for each esi include,
// but the map could grow to dozens of components...
// return the component map to the client
app.get('/component-map.js', (req, res) => {
  const componentMapString = JSON.stringify(componentMap);
  const jsCode = `window.componentMap = ${componentMapString};`;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(jsCode);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export type GetStaticPropsType = (ctx: {
  query: Record<string, any>;
}) => Promise<{ props: unknown }>;
export type GetStaticPropsParams = Parameters<GetStaticPropsType>[0];

// TODO colocate with vite bundle getEntries as these two functions share
// the same manifest, and changes in one often require changes in the other
function generateComponentMap(manifest: Record<string, any>) {
  const componentMap: {
    [key: string]: {
      component: {
        default: React.ComponentType & { getStaticProps?: GetStaticPropsType };
        getStaticProps?: GetStaticPropsType;
      };
      bundleURL: string;
      cssURL?: string;
      assets?: string[];
    };
  } = {};

  for (const entryKey in manifest) {
    if (entryKey.startsWith('src/micro-roots/')) {
      if (!manifest[entryKey].isEntry) {
        continue;
      }

      // if file path end in index.tsx take the parent folder name
      // otherwise take the file name without the extension
      const componentName = entryKey.endsWith('index.tsx')
        ? basename(resolve(__dirname, entryKey, '..'))
        : basename(entryKey, '.tsx');

      const jsPath = `dist/${manifest[entryKey].file}`;
      const cssPaths: string[] = manifest[entryKey].css || [];

      if (cssPaths.length > 1) {
        console.log('we have more than one CSS file for this module!');
      }

      componentMap[componentName] = {
        bundleURL: `/` + jsPath,
        cssURL: cssPaths.length ? `/dist/${cssPaths[0]}` : undefined,
        component: require(resolve(__dirname, jsPath)),
        assets: manifest[entryKey].assets ?? [],
      };

      // console.log(`componentMap[${componentName}]`, componentMap[componentName])
    }
  }

  return componentMap;
}
