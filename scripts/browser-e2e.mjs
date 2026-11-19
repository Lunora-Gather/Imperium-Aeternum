import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';

const HOST = '127.0.0.1';
const requestedAppUrl = process.env.E2E_URL?.trim();
const APP_PORT = requestedAppUrl ? undefined : await freePort();
const APP_URL = requestedAppUrl ? new URL(requestedAppUrl.endsWith('/') ? requestedAppUrl : `${requestedAppUrl}/`).href : `http://${HOST}:${APP_PORT}/`;
const useLocalServer = !requestedAppUrl;
const isWindows = process.platform === 'win32';

assert(['http:', 'https:'].includes(new URL(APP_URL).protocol), `Unsupported E2E URL protocol: ${APP_URL}`);

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function stopChild(child) {
  if (!child) return;
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  child.kill();
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
}

async function removeTempDir(path) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, HOST, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function chromeExecutable() {
  const candidates = [
    process.env.CHROME_BIN,
    process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
    isWindows ? join(process.env.ProgramFiles ?? '', 'Google/Chrome/Application/chrome.exe') : undefined,
    isWindows ? join(process.env['ProgramFiles(x86)'] ?? '', 'Microsoft/Edge/Application/msedge.exe') : undefined,
    isWindows ? join(process.env.ProgramFiles ?? '', 'Microsoft/Edge/Application/msedge.exe') : undefined,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

async function waitForHttp(url, timeoutMs = 30_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForJson(url, timeoutMs = 15_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Browser is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for browser endpoint ${url}`);
}

function createCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const runtimeErrors = [];
  let nextId = 0;

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      runtimeErrors.push(details.exception?.description ?? details.text);
    }
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error('Chrome DevTools WebSocket failed')), { once: true });
  });

  async function send(method, params = {}) {
    await ready;
    const id = ++nextId;
    const response = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    socket.send(JSON.stringify({ id, method, params }));
    return response;
  }

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result?.value;
  }

  return {
    evaluate,
    runtimeErrors,
    enable: () => Promise.all([send('Page.enable'), send('Runtime.enable')]),
    navigate: url => send('Page.navigate', { url }),
    setMobileViewport: () => send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }),
    close: () => socket.close(),
  };
}

async function launchChromium() {
  const chromePath = chromeExecutable();
  assert(chromePath, 'Chrome or Edge is required for the Chromium E2E run');
  const debugPort = await freePort();
  const userDataDir = await mkdtemp(join(tmpdir(), 'imperium-e2e-'));
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank',
  ], { stdio: 'ignore' });
  let session;
  async function close() {
    session?.close();
    await stopChild(chrome);
    await removeTempDir(userDataDir);
  }
  try {
    const pages = await waitForJson(`http://${HOST}:${debugPort}/json/list`);
    const page = pages.find(item => item.type === 'page');
    assert(page?.webSocketDebuggerUrl, 'No debuggable browser page was created');
    session = createCdp(page.webSocketDebuggerUrl);
    await session.enable();
    return { ...session, close };
  } catch (error) {
    await close();
    throw error;
  }
}

async function launchWebKit() {
  const { webkit } = await import('playwright-core');
  const browser = await webkit.launch({ headless: true });
  try {
    const viewport = { width: 1280, height: 800 };
    const page = await browser.newPage({ viewport });
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    return {
      evaluate: expression => page.evaluate(expression),
      runtimeErrors,
      navigate: url => page.goto(url),
      setMobileViewport: () => page.setViewportSize({ width: 390, height: 844 }),
      close: () => browser.close(),
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

function withPageChecks(session) {
  const { evaluate, runtimeErrors } = session;
  async function waitFor(expression, message, timeoutMs = 15_000) {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const page = await evaluate(`({ text: document.body?.innerText?.slice(0, 500) ?? '', visibility: document.visibilityState, readyState: document.readyState })`);
    const errors = runtimeErrors?.length ? `\nRuntime errors: ${JSON.stringify(runtimeErrors)}` : '';
    throw new Error(`${message}\nPage state: ${JSON.stringify(page)}${errors}`);
  }

  return { ...session, waitFor };
}

function clickButton(text) {
  return `(() => {
    const buttons = [...document.querySelectorAll('button')];
    const button = buttons.find((item) => item.textContent?.trim() === ${JSON.stringify(text)})
      ?? buttons.find((item) => item.textContent?.trim().includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`;
}

function clickNavigationTab(tabId) {
  return `(() => {
    const button = document.querySelector('[data-navigation-tab="${tabId}"]');
    if (!button) return false;
    button.click();
    return true;
  })()`;
}

function screenLayoutAudit() {
  return `(() => {
    const screen = [...document.querySelectorAll('.ia-screen-stack')].find((item) => getComputedStyle(item).display !== 'none');
    if (!screen) return null;
    const children = [...screen.children].filter((item) => getComputedStyle(item).position !== 'fixed');
    const gaps = children.slice(1).map((item, index) => {
      const previous = children[index].getBoundingClientRect();
      const current = item.getBoundingClientRect();
      return Math.round((current.top - previous.bottom) * 10) / 10;
    });
    return {
      gaps,
      minGap: gaps.length > 0 ? Math.min(...gaps) : null,
      scrollWidth: screen.scrollWidth,
      clientWidth: screen.clientWidth,
      display: getComputedStyle(screen).display,
      rowGap: getComputedStyle(screen).rowGap,
      children: children.map((item) => item.className),
    };
  })()`;
}

function accessibilityAudit() {
  return `(() => {
    const visible = (item) => {
      const style = getComputedStyle(item);
      return style.display !== 'none' && style.visibility !== 'hidden' && item.getClientRects().length > 0;
    };
    const unnamedButtons = [...document.querySelectorAll('button, [role="button"]')]
      .filter(visible)
      .filter((item) => !(item.getAttribute('aria-label') || item.getAttribute('aria-labelledby') || item.textContent?.trim() || item.getAttribute('title')))
      .map((item) => item.outerHTML.slice(0, 120));
    const unnamedFields = [...document.querySelectorAll('input, select, textarea')]
      .filter(visible)
      .filter((item) => {
        if (item.getAttribute('aria-label') || item.getAttribute('aria-labelledby')) return false;
        if (item.id && document.querySelector('label[for="' + CSS.escape(item.id) + '"]')) return false;
        return !item.closest('label');
      })
      .map((item) => item.outerHTML.slice(0, 120));
    const unnamedProgress = [...document.querySelectorAll('[role="progressbar"]')]
      .filter(visible)
      .filter((item) => !(item.getAttribute('aria-label') || item.getAttribute('aria-labelledby')))
      .map((item) => item.outerHTML.slice(0, 120));
    const ids = [...document.querySelectorAll('[id]')].map((item) => item.id);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const visualProgressWithoutSemantics = [...document.querySelectorAll('.ia-goal-line > i, .ia-purpose-progress > i')]
      .filter(visible)
      .filter((item) => item.getAttribute('role') !== 'progressbar')
      .map((item) => item.outerHTML.slice(0, 120));
    return { unnamedButtons, unnamedFields, unnamedProgress, visualProgressWithoutSemantics, duplicateIds, nestedMain: document.querySelectorAll('main main').length, mainCount: document.querySelectorAll('main').length };
  })()`;
}

const [browserFlag, ...extraFlags] = process.argv.slice(2);
assert(!extraFlags.length && [undefined, '--safari', '--webkit', '--chromium'].includes(browserFlag),
  'Usage: node scripts/browser-e2e.mjs [--safari | --webkit | --chromium]');
const defaultFlag = process.platform === 'darwin' ? '--safari' : '--webkit';
const browserName = { '--safari': 'Safari', '--webkit': 'WebKit', '--chromium': 'Chromium' }[browserFlag ?? defaultFlag];
const viteEntry = join(process.cwd(), 'node_modules/vite/bin/vite.js');
const server = useLocalServer ? spawn(process.execPath, [viteEntry, '--host', HOST, '--port', String(APP_PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] }) : null;
let browser;
try {
  await waitForHttp(APP_URL);
  if (browserName === 'Safari') {
    const { launchSafari } = await import('./lib/safari-e2e.mjs');
    browser = withPageChecks(await launchSafari());
  } else {
    browser = withPageChecks(await (browserName === 'WebKit' ? launchWebKit() : launchChromium()));
  }
  await browser.navigate(APP_URL);
  await browser.waitFor('document.readyState === "complete"', 'App did not finish loading');
  await browser.evaluate(`(() => { localStorage.clear(); localStorage.setItem('ia-tutorial-done', '1'); localStorage.setItem('ia-locale', 'zh-CN'); })()`);
  // Keep navigation outside Runtime.evaluate. A fresh top-level navigation is
  // more reliable than Page.reload across Chrome/Edge CDP implementations.
  await browser.navigate(`${APP_URL}?e2e=fresh`);
  await browser.waitFor(`document.body?.innerText.includes('开始推荐剧本')`, 'Campaign lobby did not load');
  const launchAccessibility = await browser.evaluate(accessibilityAudit());
  assert(launchAccessibility.unnamedButtons.length === 0, `Campaign lobby has unnamed controls: ${JSON.stringify(launchAccessibility.unnamedButtons)}`);
  assert(launchAccessibility.unnamedFields.length === 0, `Campaign lobby has unnamed fields: ${JSON.stringify(launchAccessibility.unnamedFields)}`);
  assert(launchAccessibility.duplicateIds.length === 0, `Campaign lobby has duplicate IDs: ${JSON.stringify(launchAccessibility.duplicateIds)}`);
  assert(launchAccessibility.mainCount === 1, `Campaign lobby should expose exactly one main landmark, found ${launchAccessibility.mainCount}`);
  assert(await browser.evaluate(`document.querySelector('#scenario-library')?.hidden === true`), 'Full campaign library should be collapsed on initial entry');
  assert(await browser.evaluate(clickButton('查看全部剧本')), 'Campaign library toggle was not found');
  await browser.waitFor(`document.querySelector('#scenario-library')?.hidden === false`, 'Campaign library did not expand');
  assert(await browser.evaluate(`document.querySelectorAll('#scenario-library .ia-scenario-card').length === 10`), 'Campaign library does not expose all ten campaigns');
  assert(await browser.evaluate(clickButton('收起剧本列表')), 'Campaign library collapse control was not found');
  await browser.waitFor(`document.querySelector('#scenario-library')?.hidden === true`, 'Campaign library did not collapse');

  assert(await browser.evaluate(clickButton('开始推荐剧本')), 'Recommended campaign button was not found');
  await browser.waitFor(`document.body?.innerText.includes('国政总览')`, 'Dashboard did not load after starting a campaign');
  const briefCount = await browser.evaluate(`document.querySelectorAll('.ia-dash-priority-grid .ia-dash-section').length`);
  assert(briefCount === 1, `Expected one authoritative turn brief, found ${briefCount}`);
  assert(await browser.evaluate(`document.body.innerText.includes('本回合简报')`), 'Turn brief heading is missing');

  for (const tabId of ['province', 'economy', 'population', 'politics', 'tech', 'military', 'diplomacy', 'chronicle', 'save']) {
    assert(await browser.evaluate(clickNavigationTab(tabId)), `Navigation tab ${tabId} was not found`);
    await browser.waitFor(`document.querySelector('[data-navigation-tab="${tabId}"]')?.classList.contains('is-active')`, `Navigation tab ${tabId} did not become active`);
    await browser.waitFor(`[...document.querySelectorAll('.ia-screen-stack')].some((item) => getComputedStyle(item).display !== 'none')`, `Screen stack for ${tabId} did not load`);
    const layout = await browser.evaluate(screenLayoutAudit());
    assert(layout, `Screen layout for ${tabId} could not be measured`);
    assert(layout.minGap === null || layout.minGap >= 10, `Screen ${tabId} has collapsed vertical spacing: ${JSON.stringify(layout)}`);
    assert(layout.scrollWidth <= layout.clientWidth + 1, `Screen ${tabId} overflows horizontally (${layout.scrollWidth}px > ${layout.clientWidth}px)`);
    const accessibility = await browser.evaluate(accessibilityAudit());
    assert(accessibility.unnamedButtons.length === 0, `Screen ${tabId} has unnamed controls: ${JSON.stringify(accessibility.unnamedButtons)}`);
    assert(accessibility.unnamedFields.length === 0, `Screen ${tabId} has unnamed fields: ${JSON.stringify(accessibility.unnamedFields)}`);
    assert(accessibility.unnamedProgress.length === 0, `Screen ${tabId} has unnamed progress indicators: ${JSON.stringify(accessibility.unnamedProgress)}`);
    assert(accessibility.visualProgressWithoutSemantics.length === 0, `Screen ${tabId} has visual progress without semantics: ${JSON.stringify(accessibility.visualProgressWithoutSemantics)}`);
    assert(accessibility.duplicateIds.length === 0, `Screen ${tabId} has duplicate IDs: ${JSON.stringify(accessibility.duplicateIds)}`);
    assert(accessibility.nestedMain === 0, `Screen ${tabId} contains nested main landmarks`);
  }

  assert(await browser.evaluate(clickNavigationTab('dashboard')), 'Overview navigation button was not found after layout audit');
  await browser.waitFor(`document.body?.innerText.includes('本回合简报')`, 'Dashboard did not return after layout audit');
  assert(await browser.evaluate(clickButton('存档')), 'Save button was not found');
  assert(await browser.evaluate(`JSON.parse(localStorage.getItem('imperium-aeternum-save-0')).gameState.turn === 0`), 'Manual save did not preserve the opening turn');
  assert(await browser.evaluate(clickButton('下一回合')), 'Next-turn button was not found');
  await browser.waitFor(`document.querySelector('.ia-ruler-subline')?.innerText.includes('Anno · 2')`, 'The first turn did not advance');
  assert(await browser.evaluate(`JSON.parse(localStorage.getItem('imperium-aeternum-save-0')).gameState.turn === 0`), 'Turn advance unexpectedly overwrote the manual save');
  assert(await browser.evaluate(clickNavigationTab('stats')), 'Statistics navigation button was not found');
  await browser.waitFor(`document.body?.innerText.includes('长局体检')`, 'Campaign health panel did not load');
  const statsLayout = await browser.evaluate(screenLayoutAudit());
  assert(statsLayout.scrollWidth <= statsLayout.clientWidth + 1, `Statistics screen overflows horizontally (${statsLayout.scrollWidth}px > ${statsLayout.clientWidth}px)`);
  const chartFit = await browser.evaluate(`[...document.querySelectorAll('svg[aria-label]')].every((svg) => svg.getBoundingClientRect().width <= svg.parentElement.getBoundingClientRect().width + 1)`);
  assert(chartFit, 'A statistics chart exceeds its panel width');
  assert(await browser.evaluate(`(() => { const button = document.querySelector('[data-navigation-tab="dashboard"]'); button?.click(); return !!button; })()`), 'Overview navigation button was not found');
  await browser.waitFor(`document.body?.innerText.includes('本回合简报')`, 'Dashboard did not return after the first turn');
  assert(await browser.evaluate(clickButton('读档')), 'Load button was not found');
  await browser.waitFor(`document.querySelector('.ia-ruler-subline')?.innerText.includes('Anno · 1')`, 'Loading the saved turn did not restore year one');

  await browser.setMobileViewport();
  await browser.navigate(`${APP_URL}?e2e=mobile`);
  await browser.waitFor(`document.body?.innerText.includes('地中海黎明')`, 'Mobile campaign lobby did not load');
  const continuedMobileSave = await browser.evaluate(clickButton('继续槽位 0'));
  if (!continuedMobileSave) assert(await browser.evaluate(clickButton('开始推荐剧本')), 'Mobile campaign start button was not found');
  await browser.waitFor(`document.body?.innerText.includes('本回合简报')`, 'Mobile dashboard did not load');
  const mobile = await browser.evaluate(`(() => ({
    statusHidden: getComputedStyle(document.querySelector('.ia-status-panel')).display === 'none',
    briefTop: document.querySelector('.ia-dash-priority-grid').getBoundingClientRect().top,
    minTabHeight: Math.min(...[...document.querySelectorAll('[data-navigation-tab]')].map((item) => item.getBoundingClientRect().height)),
    viewportHeight: innerHeight,
  }))()`);
  assert(mobile.statusHidden, 'Secondary status cards should be hidden on a 390px viewport');
  assert(mobile.briefTop < mobile.viewportHeight, `Turn brief begins below the mobile fold (${mobile.briefTop}px)`);
  assert(mobile.minTabHeight >= 32, `Mobile navigation touch target is too short (${mobile.minTabHeight}px)`);
  assert(await browser.evaluate(clickButton('全部页面')), 'Mobile page directory trigger was not found');
  await browser.waitFor(`!!document.querySelector('#mobile-page-navigation')`, 'Mobile page directory did not open');
  assert(await browser.evaluate(`document.querySelector('#mobile-page-navigation')?.contains(document.activeElement) === true`), 'Mobile page directory did not receive keyboard focus');
  await browser.evaluate(`document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await browser.waitFor(`!document.querySelector('#mobile-page-navigation')`, 'Escape did not close the mobile page directory');

  assert(await browser.evaluate(clickNavigationTab('map')), 'Mobile map navigation button was not found');
  await browser.waitFor(`!!document.querySelector('.ia-map-page')`, 'Mobile map did not load');
  const mobileMap = await browser.evaluate(`(() => { const page = document.querySelector('.ia-map-page'); return { scrollWidth: page.scrollWidth, clientWidth: page.clientWidth, hasSearch: !!page.querySelector('.ia-map-search') }; })()`);
  assert(mobileMap.hasSearch, 'Strategic map search is missing');
  assert(mobileMap.scrollWidth <= mobileMap.clientWidth + 1, `Mobile map overflows horizontally (${mobileMap.scrollWidth}px > ${mobileMap.clientWidth}px)`);

  assert(await browser.evaluate(clickNavigationTab('military')), 'Mobile military navigation button was not found');
  await browser.waitFor(`[...document.querySelectorAll('.ia-military-screen')].some((item) => getComputedStyle(item).display !== 'none')`, 'Mobile military screen did not load');
  const mobileMilitary = await browser.evaluate(screenLayoutAudit());
  assert(mobileMilitary.minGap >= 8, `Mobile military cards have collapsed spacing (${mobileMilitary.minGap}px)`);
  assert(mobileMilitary.scrollWidth <= mobileMilitary.clientWidth + 1, `Mobile military screen overflows horizontally (${mobileMilitary.scrollWidth}px > ${mobileMilitary.clientWidth}px)`);

  console.log(`Browser E2E passed [${browserName}] (${useLocalServer ? 'local' : APP_URL}): launch disclosure, start, turn advance, save/load, campaign health, search, modal focus, accessibility, screen spacing, horizontal fit, single brief, mobile fold.`);
} finally {
  try { await browser?.close(); } finally { await stopChild(server); }
}
