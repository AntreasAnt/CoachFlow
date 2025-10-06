import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Exit if port is already in use
    host: true // Allow external connections
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `$suppress-deprecation-warnings: true;`,
        quietDeps: true,
        silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions']
      }
    }
  }
})
