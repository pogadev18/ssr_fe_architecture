require('dotenv').config();

import express from 'express';
import React, { Attributes } from 'react';
import ReactDOMServer from 'react-dom/server';
import bodyParser from 'body-parser';
import { join, resolve } from 'path';
import { randomIdentifier } from './src/lib/utils';

const app = express();
const port = process.env.COMPONENTS_RENDERER_SERVER_PORT;

const scriptWorkingDir = process.cwd();

// const componentMap = generateComponentMap(require(resolve(scriptWorkingDir, '/dist/cjs/manifest.json')));
const cjsManifest = require(resolve(
  scriptWorkingDir,
  'dist/cjs/manifest.json'
)) as Record<string, any>;
const esmManifest = require(resolve(
  scriptWorkingDir,
  'dist/es/manifest.json'
)) as Record<string, any>;

const getComponentMetadataAndCJSModule = (
  componentName: string,
  cjsManifest: Record<string, any>,
  esmManifest: Record<string, any>
) => {
  const directName = `src/micro-roots/${componentName}.tsx`;
  const indexName = `src/micro-roots/${componentName}/index.tsx`;
  const matchedCJSComponent = cjsManifest[directName] || cjsManifest[indexName];
  const matchedESComponent = esmManifest[directName] || esmManifest[indexName];
  if (!matchedCJSComponent || !matchedESComponent) {
    console.log(`no component found for ${componentName}`);
    return undefined;
  }

  const serverCompiledModule = require(resolve(
    scriptWorkingDir,
    `dist/cjs/${matchedCJSComponent.file}`
  ));
  const esmModulePath = `/dist/es/${matchedESComponent.file}`;
  const cssPaths: string[] = matchedESComponent.css || [];
  const cssURL = cssPaths.length ? `/dist/es/${cssPaths[0]}` : undefined;

  return {
    componentName,
    component: serverCompiledModule,
    bundleURL: esmModulePath,
    cssURL,
  };
};

app.use(bodyParser.json());

// Route that serves the index.html file as a HTML page
app.get('/', (_req, res) => {
  res.sendFile(join(scriptWorkingDir, 'public', 'index.html'));
});

// Variant B goes away, it is now handled by edge worker

// Serve static files from the dist folder
app.use('/dist', express.static(join(scriptWorkingDir, 'dist')));
app.use('/assets', express.static(join(scriptWorkingDir, 'dist/es/assets')));

app.get('/component/:compDeclaration', async (req, res) => {
  try {
    const { compDeclaration } = req.params;
    const componentMetaAndModule = getComponentMetadataAndCJSModule(
      compDeclaration,
      cjsManifest,
      esmManifest
    );
    if (componentMetaAndModule) {
      const {
        component: DynamicComponent,
        cssURL,
        bundleURL,
      } = componentMetaAndModule;

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

      const shouldAddHydrationScript =
        DynamicComponent.islandType === 'client-and-server' ||
        DynamicComponent.islandType === 'client-only';

      const uniqueIdentifier = `${compDeclaration}-${randomIdentifier()}`;
      // BEWARE! Even a \n in the comopentString breaks hydration. Took me 30 mins to debug :|
      const htmlChunks = [
        `
        <div 
          style='display:contents'
          data-island
          data-island-type='${
            DynamicComponent.islandType ?? 'client-and-server'
          }'
          ${
            shouldAddHydrationScript
              ? `data-island-js-chunk='${bundleURL}'`
              : ''
          }
          data-island-css-chunk='${cssURL}'
        >${componentString}</div>`,
      ];

      if (shouldAddHydrationScript) {
        htmlChunks.push(`
        <script type="module" id="${uniqueIdentifier}">
          import * as React from 'react'
          import * as ReactDOM from 'react-dom/client'
          import MicroRootComponent from '${bundleURL}'
          const scriptTag = document.getElementById('${uniqueIdentifier}');
          const previousElement = scriptTag.previousElementSibling;
          const reactElement = React.createElement(MicroRootComponent, ${JSON.stringify(
            params.props
          )})
          ReactDOM.hydrateRoot(previousElement, reactElement)
        </script>
        `);
      }

      return res.send(htmlChunks.join('\n'));
    }
    return res.status(404).send('Component not found');
  } catch (error) {
    console.log(`${req.params.compDeclaration}`, error);
    res
      .status(500)
      .json({ error: 'An error occurred while rendering the component.' });
  }
});

app.get('/htmx/:compDeclaration/:action', async (req, res) => {
  try {
    const { compDeclaration } = req.params;
    const componentMetaAndModule = getComponentMetadataAndCJSModule(
      compDeclaration,
      cjsManifest,
      esmManifest
    );

    if (componentMetaAndModule) {
      const { component: DynamicComponent } = componentMetaAndModule;
      try {
        const { htmxActions } = DynamicComponent;
        const { action } = req.params;

        if (htmxActions && htmxActions[action]) {
          const component = await htmxActions[action]();
          const html = ReactDOMServer.renderToString(component);
          res.send(html);
        }
      } catch (error) {
        console.log('error fetching static props for', compDeclaration, error);
        res.status(500).send('An error occurred while fetching static props');
      }
    }
  } catch (error) {
    console.log(`${req.params.compDeclaration}`, error);
    res
      .status(500)
      .json({ error: 'An error occurred while rendering the component.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export type GetStaticPropsType = (ctx: {
  query: Record<string, any>;
}) => Promise<{ props: unknown }>;
export type GetStaticPropsParams = Parameters<GetStaticPropsType>[0];
export type ExpectedComponentModuleExports = {
  default: React.ComponentType & { getStaticProps?: GetStaticPropsType };
  getStaticProps?: GetStaticPropsType;
  islandType?:
    | 'server-only'
    | 'client-and-server'
    | 'client-only'
    | 'client-htmx'; //todo: remove this and use one existing islandType
  htmxActions?: Record<string, () => JSX.Element>;
};
