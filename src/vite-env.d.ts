/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY?: string
  readonly VITE_APP_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
