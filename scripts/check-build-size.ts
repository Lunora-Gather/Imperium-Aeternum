import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ASSET_DIR = join(process.cwd(), 'dist', 'assets');
const KIB = 1024;
const budgets = {
  largestJavaScript: 400 * KIB,
  // Full feature inventory includes the lazy Appwrite web SDK; initial-route budgets stay unchanged.
  totalJavaScript: 1024 * KIB,
  totalCss: 85 * KIB,
  entryJavaScript: 180 * KIB,
  appJavaScript: 25 * KIB,
  accountJavaScript: 140 * KIB,
};

interface AssetInfo {
  name: string;
  bytes: number;
}

function assets(extension: string): AssetInfo[] {
  return readdirSync(ASSET_DIR)
    .filter((name) => name.endsWith(extension))
    .map((name) => ({ name, bytes: statSync(join(ASSET_DIR, name)).size }));
}

function kib(bytes: number): number {
  return Math.round((bytes / KIB) * 10) / 10;
}

function matchingSize(list: AssetInfo[], prefix: string): number {
  return list.filter((asset) => asset.name.startsWith(prefix)).reduce((sum, asset) => sum + asset.bytes, 0);
}

const js = assets('.js');
const css = assets('.css');
if (js.length === 0) throw new Error('构建体积门禁失败：dist/assets 中没有 JavaScript 产物，请先执行构建。');

const largest = [...js].sort((left, right) => right.bytes - left.bytes)[0];
const totalJs = js.reduce((sum, asset) => sum + asset.bytes, 0);
const totalCss = css.reduce((sum, asset) => sum + asset.bytes, 0);
const entryJs = matchingSize(js, 'index-');
const appJs = matchingSize(js, 'App-');
const accountJs = matchingSize(js, 'accountStore-');
const failures: string[] = [];

if (largest.bytes > budgets.largestJavaScript) failures.push(`最大 JS ${largest.name} 为 ${kib(largest.bytes)}KiB，预算 ${kib(budgets.largestJavaScript)}KiB`);
if (totalJs > budgets.totalJavaScript) failures.push(`JS 总量 ${kib(totalJs)}KiB，预算 ${kib(budgets.totalJavaScript)}KiB`);
if (totalCss > budgets.totalCss) failures.push(`CSS 总量 ${kib(totalCss)}KiB，预算 ${kib(budgets.totalCss)}KiB`);
if (entryJs === 0 || entryJs > budgets.entryJavaScript) failures.push(`入口 JS ${kib(entryJs)}KiB，预算 1–${kib(budgets.entryJavaScript)}KiB`);
if (appJs === 0 || appJs > budgets.appJavaScript) failures.push(`App 块 ${kib(appJs)}KiB，预算 1–${kib(budgets.appJavaScript)}KiB`);
if (accountJs === 0 || accountJs > budgets.accountJavaScript) failures.push(`懒加载账号块 ${kib(accountJs)}KiB，预算 1–${kib(budgets.accountJavaScript)}KiB`);

const summary = {
  jsFiles: js.length,
  totalJsKiB: kib(totalJs),
  largestJs: { name: largest.name, kib: kib(largest.bytes) },
  entryJsKiB: kib(entryJs),
  appJsKiB: kib(appJs),
  lazyAccountJsKiB: kib(accountJs),
  totalCssKiB: kib(totalCss),
};

if (failures.length > 0) {
  throw new Error(`构建体积门禁失败：\n- ${failures.join('\n- ')}\n当前：${JSON.stringify(summary)}`);
}

console.log(`✅ 构建体积门禁通过 ${JSON.stringify(summary)}`);
