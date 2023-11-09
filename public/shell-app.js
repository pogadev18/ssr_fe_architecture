// TODO at some point this will be moved to a separate package
// and bundled with VITE just like a component so it gets a
// cache id in the name.

import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

export function importJSAndHydrate(bundleURL, domElement, props) {
  import(bundleURL).then((DynamicComponent) => {
    const reactElement = React.createElement(DynamicComponent.default, props);
    ReactDOM.hydrateRoot(domElement, reactElement);
  });
}

export function importCSS(cssURL) {
  if (cssURL && !document.querySelector(`link[href="${cssURL}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = cssURL;
    document.head.appendChild(link);
  }
}
