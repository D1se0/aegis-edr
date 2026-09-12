import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron-store', 'electron-updater', 'systeminformation', 'chokidar', 'ps-list', 'sudo-prompt', 'archiver', '@anthropic-ai/sdk']
            }
          }
        }
      },
      preload: {
        input: 'electron/main/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              output: {
                format: 'cjs',
                entryFileNames: '[name].cjs'
              }
            }
          }
        }
      },
      renderer: {}
    }),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'electron/shared')
    }
  }
})
