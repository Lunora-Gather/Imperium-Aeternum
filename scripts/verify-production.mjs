import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
if (process.argv[2] === '--manifest') {
  const dir = process.argv[3];
  const files = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const path = join(entry.parentPath, entry.name);
    files[relative(dir, path).split(sep).join('/')] = digest(readFileSync(path));
  }
  assert(files['index.html'], 'Pages build is missing index.html');
  process.stdout.write(JSON.stringify(files) + '\n');
} else {
  await verifyDeployment();
}

function assetUrls(html, extension, baseUrl) {
  const matches = [...html.matchAll(new RegExp(`(?:src|href)="([^"]+\\.${extension})"`, 'g'))];
  return [...new Set(matches.map((match) => new URL(match[1], baseUrl).href))];
}

async function fetchBytes(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}verify=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
    signal: AbortSignal.timeout(30_000),
  });
  assert(response.ok, `${url} returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function verifyDeployment() {
  const requestedUrl = process.argv[2] ?? process.env.PRODUCTION_URL ?? 'https://lunora-gather.github.io/Imperium-Aeternum/';
  const baseUrl = new URL(requestedUrl.endsWith('/') ? requestedUrl : `${requestedUrl}/`);
  const attempts = Number(process.env.PRODUCTION_VERIFY_ATTEMPTS ?? 12);
  const waitMs = Number(process.env.PRODUCTION_VERIFY_WAIT_MS ?? 5_000);
  const expectedVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  const manifest = process.env.EXPECTED_PAGES_FILES === undefined ? null : JSON.parse(process.env.EXPECTED_PAGES_FILES);
  if (process.env.EXPECTED_PAGES_FILES !== undefined) assert(manifest?.['index.html'], 'Expected Pages manifest is missing index.html');

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const responses = new Map();
      function read(url) {
        if (!responses.has(url)) responses.set(url, fetchBytes(url));
        return responses.get(url);
      }
      const fetchText = async (url) => (await read(url)).toString('utf8');
      const html = await fetchText(baseUrl.href);
      assert(html.includes('<div id="root"></div>'), 'Production HTML is missing the React root');
      assert(html.includes('Imperium Aeternum'), 'Production HTML has the wrong title');
      assert(html.includes('Content-Security-Policy'), 'Production HTML is missing the content security policy');
      const cssUrls = assetUrls(html, 'css', baseUrl);
      const jsUrls = assetUrls(html, 'js', baseUrl);
      assert(cssUrls.length > 0, 'Production HTML references no CSS asset');
      assert(jsUrls.length > 0, 'Production HTML references no JavaScript asset');

      const [cssAssets, jsAssets] = await Promise.all([
        Promise.all(cssUrls.map(fetchText)),
        Promise.all(jsUrls.map(fetchText)),
      ]);
      const css = cssAssets.join('\n');
      const js = jsAssets.join('\n');
      assert(css.includes('.ia-screen-stack'), 'Production CSS is missing the screen rhythm contract');
      assert(css.includes('.ia-map-search'), 'Production CSS is missing the strategic map search layout');
      assert(js.includes(expectedVersion), `Production entry JavaScript is missing build marker ${expectedVersion}`);
      assert(js.includes('刷新并恢复'), 'Production entry JavaScript is missing stale-deployment recovery');

      const files = Object.entries(manifest ?? {});
      for (let start = 0; start < files.length; start += 8) {
        await Promise.all(files.slice(start, start + 8).map(async ([path, expected]) => {
          const url = path === 'index.html' ? baseUrl.href : new URL(path, baseUrl).href;
          assert(digest(await read(url)) === expected, `Published file differs from the candidate: ${path}`);
        }));
      }
      console.log(JSON.stringify({
        ok: true,
        url: baseUrl.href,
        cssAssets: cssUrls.map((url) => new URL(url).pathname),
        jsAssets: jsUrls.map((url) => new URL(url).pathname),
        attempt,
        ...(manifest && { verifiedFiles: files.length }),
      }));
      return;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

function assert(value, message) {
  if (!value) throw new Error(message);
}
