import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Pages 项目页路径：base 必须是仓库名前缀；本地 dev 用根路径
  base: process.env.VITE_BASE ?? '/',
  server: { port: 5173 },
  test: {
    environment: 'node',
    globals: true,
  },
});
