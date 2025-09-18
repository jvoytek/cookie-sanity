import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    globals: true,
    setupFiles: ['tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~': path.resolve(__dirname, '.'),
    }
  }
})