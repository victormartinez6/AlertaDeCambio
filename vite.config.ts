import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: '_assets',
    rollupOptions: {
      output: {
        assetFileNames: '_assets/[name]-[hash][extname]',
        chunkFileNames: '_assets/[name]-[hash].js',
        entryFileNames: '_assets/[name]-[hash].js'
      }
    }
  }
})
