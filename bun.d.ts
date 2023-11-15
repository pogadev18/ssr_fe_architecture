declare module 'bun' {
  interface Env {
    AEM_DEV_ENV_USER: string;
    AEM_DEV_ENV_PASS: string;
    ALGOLIA_APP_ID: string;
    ALGOLIA_API_KEY: string;
  }
}
