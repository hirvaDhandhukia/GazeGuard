import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    // enabling plugins for vite to wrok with chrome extension structure
    react(),
    crx({ manifest })
  ],
  // resolve aliases for imports in other components
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // build configs
  // build: {
  //   rollupOptions: {
  //     input: {
  //       popup: 'index.html',
  //       login: 'src/pages/login/index.html',
  //       calibration: 'src/pages/calibration/index.html',
  //       settings: 'src/pages/settings/index.html',
  //       privacy: 'src/pages/privacy/index.html',
  //     },
  //   },
  // },
})