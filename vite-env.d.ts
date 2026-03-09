/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: 'local' | 'producao';
  readonly VITE_USAR_LOCALSTORAGE?: string;
  readonly VITE_USAR_BANCO_POSTGRES?: string;
  readonly VITE_WHATSAPP_SUPORTE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
