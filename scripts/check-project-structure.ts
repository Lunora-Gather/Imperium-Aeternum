import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import ts from 'typescript';

const root = resolve(process.cwd());
const sourceRoot = join(root, 'src');
const scriptsRoot = join(root, 'scripts');
const docsRoot = join(root, 'docs');
const slash = (value: string) => value.replaceAll('\\', '/');

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => (
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]
  ));
}

const moduleFiles = [...walk(sourceRoot), ...walk(scriptsRoot)]
  .filter((file) => ['.ts', '.tsx'].includes(extname(file)));
const sourceFiles = moduleFiles.filter((file) => file.startsWith(`${sourceRoot}${sep}`));
const moduleSet = new Set(moduleFiles.map((file) => resolve(file)));
const inbound = new Map(sourceFiles.map((file) => [resolve(file), [] as string[]]));

function resolveRelativeImport(from: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(from), specifier);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];
  return candidates.find((candidate) => moduleSet.has(candidate)) ?? null;
}

for (const file of moduleFiles) {
  const imports = ts.preProcessFile(readFileSync(file, 'utf8'), true, true).importedFiles;
  for (const imported of imports) {
    const target = resolveRelativeImport(file, imported.fileName);
    if (target && inbound.has(target)) inbound.get(target)?.push(slash(relative(root, file)));
  }
}

const entrypoints = new Set([
  'src/main.tsx',
  'src/data/__validate__.ts',
  'src/vite-env.d.ts',
]);
const retainedDormantModules = new Map([
  ['src/utils/perf.ts', 'DEC-015 性能分阶段计时工具，保留供后续大地图观测接入'],
]);
const orphaned = [...inbound]
  .filter(([file, importers]) => {
    const projectPath = slash(relative(root, file));
    return importers.length === 0
      && !projectPath.includes('/__tests__/')
      && !entrypoints.has(projectPath)
      && !retainedDormantModules.has(projectPath);
  })
  .map(([file]) => slash(relative(root, file)));

const expectedDocDirectories = ['audits', 'maintenance', 'planning', 'reference', 'releases'];
const missingDocDirectories = expectedDocDirectories.filter((name) => !existsSync(join(docsRoot, name)));
const looseDocs = readdirSync(docsRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name !== 'README.md')
  .map((entry) => `docs/${entry.name}`);

const markdownFiles = [
  join(root, 'README.md'),
  join(root, 'CHANGELOG.md'),
  ...walk(docsRoot).filter((file) => extname(file) === '.md'),
];
const brokenLinks: string[] = [];
for (const file of markdownFiles) {
  const body = readFileSync(file, 'utf8');
  for (const match of body.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const rawTarget = match[1].split('#')[0].trim();
    if (!rawTarget || /^(?:https?:|mailto:|#)/.test(rawTarget)) continue;
    const target = resolve(dirname(file), decodeURI(rawTarget));
    if (!existsSync(target)) brokenLinks.push(`${slash(relative(root, file))} → ${match[1]}`);
  }
}

const failures = [
  ...(orphaned.length ? [`未被入口、脚本、测试或其他源码引用的模块：${orphaned.join(', ')}`] : []),
  ...(missingDocDirectories.length ? [`缺少文档分区：${missingDocDirectories.join(', ')}`] : []),
  ...(looseDocs.length ? [`docs 根目录存在未分类文件：${looseDocs.join(', ')}`] : []),
  ...(brokenLinks.length ? [`失效的本地文档链接：${brokenLinks.join('; ')}`] : []),
];

if (failures.length) throw new Error(`项目结构检查失败：\n- ${failures.join('\n- ')}`);

console.log(
  `✅ 项目结构检查通过（${sourceFiles.length} 个源码模块 / ${markdownFiles.length} 份 Markdown / `
  + `${retainedDormantModules.size} 个有理由保留的待接入模块）`,
);
