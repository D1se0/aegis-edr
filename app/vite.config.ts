import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron-store', 'electron-updater', 'systeminformation', 'chokidar', 'ps-list', 'sudo-prompt']
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
