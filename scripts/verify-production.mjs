import { readFileSync } from 'node:fs';

const requestedUrl = process.argv[2] ?? process.env.PRODUCTION_URL ?? 'https://lunora-gather.github.io/Imperium-Aeternum/';
const baseUrl = new URL(requestedUrl.endsWith('/') ? requestedUrl : `${requestedUrl}/`);
const attempts = Number(process.env.PRODUCTION_VERIFY_ATTEMPTS ?? 12);
const waitMs = Number(process.env.PRODUCTION_VERIFY_WAIT_MS ?? 5_000);
const expectedVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

function assert(value, message) {
  if (!value) throw new Error(message);
}

function assetUrls(html, extension) {
  const matches = [...html.matchAll(new RegExp(`(?:src|href)="([^"]+\\.${extension})"`, 'g'))];
  return [...new Set(matches.map((match) => new URL(match[1], baseUrl).href))];
}

async function fetchText(url) {
  const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}verify=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache', pragma: 'no-cache' },
  });
  assert(response.ok, `${url} returned HTTP ${response.status}`);
  return response.text();
}

let lastError;
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const html = await fetchText(baseUrl.href);
    assert(html.includes('<div id="root"></div>'), 'Production HTML is missing the React root');
    assert(html.includes('Imperium Aeternum'), 'Production HTML has the wrong title');
    assert(html.includes('Content-Security-Policy'), 'Production HTML is missing the content security policy');
    const cssUrls = assetUrls(html, 'css');
    const jsUrls = assetUrls(html, 'js');
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

    console.log(JSON.stringify({
      ok: true,
      url: baseUrl.href,
      cssAssets: cssUrls.map((url) => new URL(url).pathname),
      jsAssets: jsUrls.map((url) => new URL(url).pathname),
      attempt,
    }));
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

throw lastError;
