import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Docker mounts OncoVision/app/src at /app/oncovision-src; fall back to relative path for local dev
const oncovisionDir = existsSync('/app/oncovision-src/lib.tsx')
  ? '/app/oncovision-src'
  : resolve(__dirname, '../OncoVision/app/src')
const oncovisionSrc = resolve(oncovisionDir, 'lib.tsx')

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      // OncoVision utilise des décorateurs legacy (@subscribe) dans viewers/socket/canva.tsx
      babel: {
        plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
      },
    }),
    basicSsl()
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      // 'oncovision' -> point d'entrée lib.tsx (composants/hook publics)
      { find: /^oncovision$/, replacement: oncovisionSrc },
      // 'oncovision-src/...' -> accès direct aux sources (ex: hooks/rest, qui n'est pas exporté par lib.tsx)
      { find: /^oncovision-src\//, replacement: oncovisionDir + '/' },
    ],
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
      },
      '/room': {
        target: 'http://oncovision-api:8000',
        changeOrigin: true,
        ws: true,
      },
      '/viewer': {
        target: 'http://oncovision-api:8000',
        changeOrigin: true,
      },
      '/draw': {
        target: 'http://oncovision-api:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
