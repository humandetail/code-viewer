import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        copyDtsFiles: true
      })
    ],
    build: {
      lib: {
        entry: './index.ts',
        name: 'codeViewer',
        fileName: 'code-viewer',
        formats: ['es', 'iife']
      },
      sourcemap: mode !== 'production',
      rollupOptions: {
        external: ['highlight.js']
      }
    }
  }
})
