import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 5175 },
  plugins: [
    devServer({
      adapter, // Enable Cloudflare bindings in Vite
      entry: 'src/index.tsx', // The file path of your application.
    }),
    pages(),
  ],
  build: {
    outDir: 'dist',
  },
})
