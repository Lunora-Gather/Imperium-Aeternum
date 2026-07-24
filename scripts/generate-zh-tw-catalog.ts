import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import OpenCC from 'opencc-js/cn2t';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const output = join(sourceRoot, 'i18n', 'generated', 'zh-TW.json');
const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });
const sourceCharacters = new Set<string>();

function sourceFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'i18n' || entry.name === '__tests__') return [];
      return sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

function collect(file: string): void {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node: ts.Node): void {
    const literal = ts.isStringLiteralLike(node)
      || ts.isNoSubstitutionTemplateLiteral(node)
      || ts.isTemplateHead(node)
      || ts.isTemplateMiddle(node)
      || ts.isTemplateTail(node)
      ? node.text
      : '';
    if (/[\u3400-\u9fff]/.test(literal)) {
      for (const character of literal) if (/[\u3400-\u9fff]/.test(character)) sourceCharacters.add(character);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

[
  join(sourceRoot, 'App.tsx'),
  ...['components', 'screens', 'gameplay', 'store'].flatMap((folder) => sourceFiles(join(sourceRoot, folder))),
].forEach(collect);
const generated = Object.fromEntries([...sourceCharacters]
  .map((character) => [character, converter(character)] as const)
  .filter(([source, target]) => source !== target)
  .sort(([a], [b]) => a.localeCompare(b, 'zh-CN')));
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(generated, null, 2)}\n`, 'utf8');
console.log(`Generated ${Object.keys(generated).length} zh-TW character mappings at ${relative(root, output)}.`);
