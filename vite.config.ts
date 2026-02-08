import pages from '@hono/vite-cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    devServer({
      entry: 'src/index.tsx', // The file path of your application.
    }),
    pages(),
  ],
  build: {
    outDir: 'dist',
  },
})
