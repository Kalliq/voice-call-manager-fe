interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  VITE_BACKEND_URL: string;
  VITE_BACKEND_DOMAIN: string;
  MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
