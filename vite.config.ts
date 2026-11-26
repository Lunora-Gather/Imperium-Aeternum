import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      // The worker imports this same client module by URL. Preserve its named
      // exports and share the recovery rules, scenario tables and decompressor.
      name: 'save-recovery-module-url',
      apply: 'build',
      enforce: 'pre',
      resolveId(id) {
        if (id.endsWith('/saveRecovery.ts?url')) return '\0save-recovery-module-url';
      },
      load(id) {
        if (id !== '\0save-recovery-module-url') return;
        const recovery = this.emitFile({ type: 'chunk', id: fileURLToPath(new URL('./src/gameplay/saveRecovery.ts', import.meta.url)), preserveSignature: 'strict' });
        return `export default import.meta.ROLLUP_FILE_URL_${recovery};`;
      },
    },
  ],
  // Pages 项目页路径：base 必须是仓库名前缀；本地 dev 用根路径
  base: process.env.VITE_BASE ?? '/',
  server: { port: 5173 },
  test: {
    environment: 'node',
    globals: true,
  },
});
