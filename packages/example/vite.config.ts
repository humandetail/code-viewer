import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname)

  return {
    base: env.VITE_APP_PATHNAME,
    plugins: [vue()]
  }
})
