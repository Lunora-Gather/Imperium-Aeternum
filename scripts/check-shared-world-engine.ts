import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const entryPoint = resolve(root, 'scripts/shared-world-engine-entry.ts');
const generatedPath = resolve(root, 'functions/shared-world-gateway/src/generated/engine-bundle.js');

const result = await build({
  entryPoints: [entryPoint],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  write: false,
});

const expected = result.outputFiles[0]?.text.replaceAll('\r\n', '\n');
const committed = (await readFile(generatedPath, 'utf8')).replaceAll('\r\n', '\n');

if (!expected || expected !== committed) {
  throw new Error('共享世界引擎与源码不一致。请运行 npm run build:shared-world-engine，并提交生成文件。');
}

console.log('✅ 共享世界引擎与当前源码一致');
