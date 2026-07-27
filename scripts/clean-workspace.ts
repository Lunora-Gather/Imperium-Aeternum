import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const root = resolve(process.cwd());
const dryRun = process.argv.includes('--dry-run');
const cleanFunctionDependencies = process.argv.includes('--function-deps');
const removed: string[] = [];

function removeWorkspacePath(relativePath: string): void {
  const target = resolve(root, relativePath);
  if (target === root || !target.startsWith(`${root}${sep}`)) {
    throw new Error(`拒绝清理工作区之外的路径：${relativePath}`);
  }
  if (!existsSync(target)) return;
  if (!dryRun) rmSync(target, { recursive: true, force: true });
  removed.push(relativePath.replaceAll('\\', '/'));
}

[
  'dist',
  'coverage',
  '.tmp',
  '.tmp-codex',
  'tsconfig.tsbuildinfo',
  'tsconfig.node.tsbuildinfo',
  'vite.config.js',
  'vite.config.d.ts',
].forEach(removeWorkspacePath);

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /^(?:\.codex-|\.tmp-).+\.log$/.test(entry.name)) {
    removeWorkspacePath(entry.name);
  }
}

if (cleanFunctionDependencies) {
  const functionsRoot = resolve(root, 'functions');
  for (const entry of readdirSync(functionsRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) removeWorkspacePath(`functions/${entry.name}/node_modules`);
  }
}

const action = dryRun ? '将清理' : '已清理';
console.log(`${action} ${removed.length} 项可再生成内容${removed.length ? `：\n- ${removed.join('\n- ')}` : ''}`);
