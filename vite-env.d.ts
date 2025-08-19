interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
  VITE_BACKEND_URL: string;
  VITE_BACKEND_DOMAIN: string;
  VITE_GOOGLE_CLIENT_ID: string;
  VITE_GOOGLE_API_KEY: string;
  MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.svg?react" {
  import * as React from "react";
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
