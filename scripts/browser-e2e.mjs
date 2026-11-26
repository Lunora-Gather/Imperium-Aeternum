import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { launchSafari } from './lib/safari-e2e.mjs';
import { join } from 'node:path';
import net from 'node:net';

const HOST = '127.0.0.1';
const requestedAppUrl = process.env.E2E_URL?.trim();
const previewBuild = !requestedAppUrl && process.argv.includes('--preview');
const localBase = previewBuild ? (process.env.VITE_BASE || '/Imperium-Aeternum/') : '/';
if (previewBuild && !existsSync('dist/index.html')) throw new Error('Build the Pages candidate before running the preview smoke test.');
const APP_PORT = requestedAppUrl ? undefined : await freePort();
const APP_URL = requestedAppUrl ? new URL(requestedAppUrl.endsWith('/') ? requestedAppUrl : `${requestedAppUrl}/`).href : new URL(localBase, `http://${HOST}:${APP_PORT}`).href;
const useLocalServer = !requestedAppUrl;


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

// Hold one real worker request while the player uses the lobby, then change
// the slot before its result arrives. An import in this tab has no storage event.
async function checkLobbyInspection(browser, checkpoint) {
  await browser.evaluate(`(() => {
    const NativeWorker = window.Worker;
    const key = 'imperium-aeternum-save-2';
    const prior = localStorage.getItem(key);
    const save = JSON.parse(${JSON.stringify(checkpoint)});
    window.changeTestYear = year => { save.gameState.turn = year - 1; localStorage.setItem(key, JSON.stringify(save)); };
    const refresh = () => window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage }));
    window.restoreTestInspection = () => {
      window.Worker = NativeWorker;
      if (prior === null) localStorage.removeItem(key); else localStorage.setItem(key, prior);
      refresh();
      delete window.releaseTestInspection;
      delete window.workerInspectedSave;
      delete window.changeTestYear;
      delete window.restoreTestInspection;
      delete window.inspectionErrorHandled;
    };
    window.Worker = class extends NativeWorker {
      postMessage(...args) {
        window.Worker = NativeWorker;
        this.addEventListener('message', event => { window.workerInspectedSave = Array.isArray(event.data); }, { once: true });
        window.releaseTestInspection = () => super.postMessage(...args);
      }
    };
    window.changeTestYear(13);
    refresh();
  })()`);
  try {
    await browser.waitFor(`!!window.releaseTestInspection && document.body.innerText.includes('正在检查存档')`, 'Save inspection blocked the lobby');
    assert(await browser.evaluate(clickButton('查看全部剧本')), 'Campaign library was unavailable during inspection');
    await browser.waitFor(`!document.querySelector('#scenario-library').hidden`, 'Library could not open while checking saves');
    await browser.evaluate(`(() => { window.changeTestYear(14); window.releaseTestInspection(); })()`);
    await browser.waitFor(`window.workerInspectedSave && document.querySelector('.ia-continue-panel strong')?.textContent.includes('第 14 年')`, 'Worker did not inspect the save or the lobby recommended a stale result');
    assert(await browser.evaluate(clickButton('收起剧本列表')), 'Could not collapse the campaign library');
    await browser.evaluate(`(() => {
      window.Worker = class { constructor() { throw new Error('Worker unavailable'); } };
      window.changeTestYear(15);
      window.dispatchEvent(new StorageEvent('storage', { key: 'imperium-aeternum-save-2', storageArea: localStorage }));
    })()`);
    await browser.waitFor(`document.querySelector('.ia-continue-panel strong')?.textContent.includes('第 15 年')`, 'Local saves became unavailable without workers');
    await browser.evaluate(`(() => {
      window.Worker = class {
        postMessage() {
          setTimeout(() => {
            const event = new Event('error', { cancelable: true });
            this.onerror(event);
            window.inspectionErrorHandled = event.defaultPrevented;
          });
        }
        terminate() {}
      };
      window.changeTestYear(16);
      window.dispatchEvent(new StorageEvent('storage', { key: 'imperium-aeternum-save-2', storageArea: localStorage }));
    })()`);
    await browser.waitFor(`window.inspectionErrorHandled && document.querySelector('.ia-continue-panel strong')?.textContent.includes('第 16 年')`, 'Worker load failure escaped the local inspection fallback');
  } finally { await browser.evaluate(`window.restoreTestInspection()`); }
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

function withPageChecks(session) {
  const { evaluate, runtimeErrors } = session;
  async function waitFor(expression, message, timeoutMs = 15_000) {
    const until = Date.now() + timeoutMs;
    while (Date.now() < until) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const page = await evaluate(`({
      text: document.body?.innerText?.slice(0, 500) ?? '',
      visibility: document.visibilityState, readyState: document.readyState,
      focus: document.activeElement?.id || document.activeElement?.tagName,
      headingTop: document.getElementById('campaign-step-title')?.getBoundingClientRect().top,
      scrollY, innerHeight,
    })`);
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

function key(target, options) {
  return `(${target}).dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...${JSON.stringify(options)} }))`;
}

function clickNavigationTab(tabId) {
  return `(() => {
    const button = document.querySelector('[data-navigation-tab="${tabId}"]');
    if (!button) return false;
    button.click();
    return true;
  })()`;
}

function fillInput(selector, value) {
  return `(() => {
    const field = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, ${JSON.stringify(value)});
    field.dispatchEvent(new Event('input', { bubbles: true }));
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

async function checkThemeContrast(browser) {
  const measure = `(() => {
    const style = getComputedStyle(document.documentElement);
    const light = (name) => {
      const color = style.getPropertyValue('--' + name).trim();
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Unexpected color for ' + name + ': ' + color);
      const channels = color.slice(1).match(/../g).map(hex => parseInt(hex, 16) / 255)
        .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
    };
    const contrast = (fg, bg) => (Math.max(light(fg), light(bg)) + .05) / (Math.min(light(fg), light(bg)) + .05);
    const results = [];
    for (const text of ['text', 'text-soft', 'text-mute', 'text-dim', 'gold', 'good', 'danger', 'warn', 'stable', 'accent', 'theme-mark']) {
      for (const surface of ['bg-void', 'bg-panel', 'bg-raised', 'bg-inset']) results.push([text, surface, contrast(text, surface)]);
    }
    for (const variant of ['primary', 'warn', 'good']) {
      results.push([variant, 'button', contrast('btn-' + variant + '-fg', 'btn-' + variant + '-top')]);
    }
    results.push(['primary', 'gradient end', contrast('btn-primary-fg', 'btn-primary-bot')]);
    results.push(['notification', 'danger', contrast('on-danger', 'danger')]);
    return results.filter(pair => pair[2] < 4.5);
  })()`;
  for (const theme of ['day', 'bamboo', 'ink', 'night']) {
    assert(await browser.evaluate(`(() => {
      const button = document.querySelector('.ia-theme-switch [data-palette="${theme}"]');
      button?.click();
      return !!button;
    })()`), `Missing theme switch for ${theme}`);
    await browser.waitFor(`document.documentElement.dataset.theme === '${theme}'`, `Could not apply theme ${theme}`);
    const failures = await browser.evaluate(measure);
    assert(failures.length === 0, `${theme} text below 4.5:1 contrast: ${JSON.stringify(failures)}`);
  }
}

const viteEntry = join(process.cwd(), 'node_modules/vite/bin/vite.js');
const viteArgs = previewBuild ? ['preview', '--base', localBase] : [];
const server = useLocalServer ? spawn(process.execPath, [viteEntry, ...viteArgs, '--host', HOST, '--port', String(APP_PORT), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] }) : null;
let browser;
try {
  await waitForHttp(APP_URL);
  browser = withPageChecks(await launchSafari());
  await browser.navigate(APP_URL);
  await browser.waitFor(`document.readyState === 'complete' && !!document.querySelector('#scenario-library, .ia-ruler-subline')`, 'App did not finish loading the first screen');
  await browser.evaluate(`(() => { localStorage.clear(); localStorage.setItem('ia-tutorial-done', '1'); localStorage.setItem('ia-locale', 'zh-CN'); })()`);
  await browser.navigate(`${APP_URL}?e2e=fresh`);
  await browser.waitFor(`document.body?.innerText.includes('开始推荐剧本')`, 'Campaign lobby did not load');
  await checkThemeContrast(browser);
  const launchAccessibility = await browser.evaluate(accessibilityAudit());
  assert(launchAccessibility.unnamedButtons.length === 0, `Campaign lobby has unnamed controls: ${JSON.stringify(launchAccessibility.unnamedButtons)}`);
  assert(launchAccessibility.unnamedFields.length === 0, `Campaign lobby has unnamed fields: ${JSON.stringify(launchAccessibility.unnamedFields)}`);
  assert(launchAccessibility.duplicateIds.length === 0, `Campaign lobby has duplicate IDs: ${JSON.stringify(launchAccessibility.duplicateIds)}`);
  assert(launchAccessibility.mainCount === 1, `Campaign lobby should expose exactly one main landmark, found ${launchAccessibility.mainCount}`);
  assert(await browser.evaluate(`document.querySelector('#scenario-library')?.hidden === true`), 'Full campaign library should be collapsed on initial entry');
  assert(await browser.evaluate(clickButton('查看全部剧本')), 'Campaign library toggle was not found');
  await browser.waitFor(`document.querySelector('#scenario-library')?.hidden === false`, 'Campaign library did not expand');
  assert(await browser.evaluate(`document.querySelectorAll('#scenario-library .ia-scenario-card').length === 10`), 'Campaign library does not expose all ten campaigns');
  await browser.evaluate(`document.querySelector('.ia-theme-switch button[title="羊皮主题"]').click()`);
  await browser.waitFor(`document.documentElement.dataset.theme === 'day'`, 'Lobby theme did not apply');
  assert(await browser.evaluate(clickButton('印度洋贸易')), 'Indian Ocean scenario is missing');
  assert(await browser.evaluate(clickButton('室利佛逝')), 'Srivijaya was not offered');
  assert(await browser.evaluate(clickButton('开启纪元')), 'Campaign confirmation button was not found');
  await browser.waitFor(`document.querySelector('.ia-ruler-subline') && document.body.innerText.includes('国政总览')`, 'Confirmed nation did not enter the game');
  assert(await browser.evaluate(`document.querySelector('button[aria-label="切换主题"]')?.textContent.includes('☀')`), 'The in-game theme differs from the lobby selection');
  await browser.evaluate(`document.querySelector('button[aria-label="切换主题"]').click()`);
  await browser.waitFor(`document.documentElement.dataset.theme === 'bamboo' && localStorage.getItem('ia-theme') === 'bamboo'`, 'The in-game theme cycle restarted instead of advancing');
  assert(await browser.evaluate(clickButton('存档')), 'Could not save the selected nation');
  assert(await browser.evaluate(`(() => {
    const state = JSON.parse(localStorage.getItem('imperium-aeternum-save-0')).gameState;
    return state.scenarioId === 'w8_indianocean' && state.playerNationId === 'n_oc_srivijaya' && state.nations[state.playerNationId].name === '室利佛逝';
  })()`), 'The saved ruler differs from the confirmed nation');
  await browser.evaluate(`document.querySelector('button[aria-label="返回标题页"]').click()`);
  assert(await browser.evaluate(clickButton('不保存，返回大厅')), 'Could not leave the completed scenario selection check');
  await browser.waitFor(`!!document.querySelector('#scenario-library')`, 'Selected nation did not return to the lobby');
  await browser.evaluate(`localStorage.removeItem('imperium-aeternum-save-0')`);
  await browser.navigate(`${APP_URL}?e2e=classic`);
  await browser.waitFor(`document.body?.innerText.includes('查看全部剧本')`, 'Could not return to the campaign library');
  assert(await browser.evaluate(clickButton('查看全部剧本')), 'Campaign library toggle was missing on return');
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
    if (tabId === 'province') {
      const farm = `[...document.querySelectorAll('button')].find((b) => b.firstElementChild?.textContent === '农田')`;
      const builtFarms = `[...document.querySelectorAll('.ia-tag')].filter((el) => /^农田 Lv/.test(el.textContent)).length`;
      const count = await browser.evaluate(builtFarms);
      assert(await browser.evaluate(`(() => { const b = ${farm}; if (!b || b.disabled) return false; b.focus(); b.click(); return true; })()`), 'Could not build the first farm');
      await browser.waitFor(`(${builtFarms}) === ${count + 1}`, 'Building a farm did not add it to the selected province');
      assert(await browser.evaluate(`document.activeElement === (${farm})`), 'Constructing a building lost keyboard focus');
      assert(await browser.evaluate(key('document.body', { key: 'b', repeat: true })), 'Holding B spent resources a second time');
      assert(await browser.evaluate(key('document.body', { key: 'r', ctrlKey: true })), 'A system shortcut recruited soldiers');
      assert(await browser.evaluate(`(${builtFarms}) === ${count + 1}`), 'The farm was built twice');
    }
    if (tabId === 'economy') {
      const navButton = `document.querySelector('[data-navigation-tab="economy"]')`;
      assert(await browser.evaluate(key(navButton, { key: ' ', code: 'Space' })), 'Space on a navigation button was intercepted');
      assert(await browser.evaluate(key('document.body', { key: ' ', code: 'Space', repeat: true })), 'Holding Space advanced another year');
      assert(await browser.evaluate(key('document.body', { key: 'ArrowRight', metaKey: true })), 'A system shortcut changed the tax rate');
      assert(await browser.evaluate(`(() => { const button = document.querySelector('button[aria-label="新手帮助"]'); button?.click(); return !!button; })()`), 'Help control was missing');
      await browser.waitFor(`!!document.querySelector('.ia-help-card[role="dialog"]')`, 'Help did not open on economy screen');
      assert(await browser.evaluate(key('document.activeElement', { key: 'ArrowRight' })), 'Economy page handled a key behind the dialog');
      await browser.evaluate(key('document.body', { key: 'Escape' }));
      await browser.waitFor(`!document.querySelector('.ia-help-card[role="dialog"]')`, 'Could not resume economy screen');
    }
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
  assert(await browser.evaluate(clickButton('选择新剧本')), 'Campaign exit control was not found');
  await browser.waitFor(`!!document.querySelector('#campaign-exit-title')`, 'Campaign exit dialog did not open');
  await browser.evaluate(`(() => {
    const write = Storage.prototype.setItem;
    window.restoreTestStorage = () => { Storage.prototype.setItem = write; delete window.restoreTestStorage; };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'imperium-aeternum-save-0') throw new DOMException('full', 'QuotaExceededError');
      return write.call(this, key, value);
    };
  })()`);
  try {
    assert(await browser.evaluate(clickButton('保存并返回大厅')), 'Save-and-return button was not found');
    await browser.waitFor(`!!document.querySelector('[role="dialog"] [role="alert"]')`, 'A failed save must keep the exit dialog open and explain the failure');
    assert(await browser.evaluate(`document.querySelector('.ia-ruler-subline')?.innerText.includes('Anno · 2')`), 'Failed save lost the active turn');
    assert(await browser.evaluate(`JSON.parse(localStorage.getItem('imperium-aeternum-save-0')).gameState.turn === 0`), 'Failed save changed the previous checkpoint');
  } finally {
    await browser.evaluate(`window.restoreTestStorage()`);
  }
  assert(await browser.evaluate(clickButton('继续治理')), 'Could not resume after the failed save');
  assert(await browser.evaluate(clickButton('读档')), 'Load button was not found');
  await browser.waitFor(`document.querySelector('.ia-ruler-subline')?.innerText.includes('Anno · 1')`, 'Loading the saved turn did not restore year one');

  const openingCheckpoint = await browser.evaluate(`localStorage.getItem('imperium-aeternum-save-0')`);
  try {
    await browser.evaluate(`(() => {
      const slot = JSON.parse(localStorage.getItem('imperium-aeternum-save-0'));
      const state = slot.gameState;
      const player = state.nations[state.playerNationId];
      Object.assign(player.resources, { gold: 2000, sciPt: 1000, adminPt: 1 });
      Object.assign(player.tech, { agri: 1, mil: 1, researchProgress: null });
      state.pendingEvents = ['evt_famine', 'evt_drought'].map(eventId => ({ nationId: player.id, eventId }));
      localStorage.setItem('imperium-aeternum-save-0', JSON.stringify(slot));
    })()`);
    assert(await browser.evaluate(clickButton('读档')), 'Could not load pending-event checkpoint');
    await browser.waitFor(`document.querySelector('#event-dialog-title')?.textContent.includes('粮食危机')`, 'First queued event did not open');
    await browser.evaluate(key('document.activeElement', { key: '1' }));
    await browser.waitFor(`document.querySelector('#event-dialog-title')?.textContent.includes('旱灾')`, 'Second queued event did not open');
    assert(await browser.evaluate(key('document.activeElement', { key: '1', repeat: true })), 'Held key resolved the next event');
    assert(await browser.evaluate(key('document.activeElement', { key: '1', metaKey: true })), 'System shortcut resolved an event');
    await browser.evaluate(key('document.activeElement', { key: '1' }));
    await browser.waitFor(`!document.querySelector('#event-dialog-title')`, 'Resolving both events did not empty the queue');

    assert(await browser.evaluate(clickNavigationTab('tech')), 'Technology tab unavailable');
    const techCard = (name) => `[...document.querySelectorAll('.ia-card')].find((el) => el.querySelector('strong')?.textContent === ${JSON.stringify(name)})`;
    const agriculture = techCard('铁制农具');
    await browser.waitFor(`!!(${agriculture})?.querySelector('button')`, 'Funded research is unavailable');
    await browser.evaluate(`(${agriculture}).querySelector('button').click()`);
    await browser.waitFor(`(${agriculture})?.textContent.includes('已学')`, 'Immediate research did not complete');
    assert(await browser.evaluate(`document.body.innerText.includes('行动点不足（需 1）')`), 'Research screen did not explain the exhausted AP');
    assert(await browser.evaluate(clickNavigationTab('dashboard')), 'Could not return to overview');
    await browser.waitFor(`document.body.innerText.includes('本回合简报')`, 'Overview did not reload');
    assert(await browser.evaluate(clickButton('存档')), 'Could not save the research purchase');
    const paid = await browser.evaluate(`(() => { const state = JSON.parse(localStorage.getItem('imperium-aeternum-save-0')).gameState; return state.nations[state.playerNationId].resources; })()`);
    assert(paid.sciPt === 600 && paid.adminPt === 0, 'Research did not charge exactly 400 research and 1 AP');
    await browser.evaluate(`(() => {
      const slot = JSON.parse(${JSON.stringify(openingCheckpoint)});
      const state = slot.gameState;
      const player = state.nations[state.playerNationId];
      Object.assign(player.resources, { gold: 1000, adminPt: 5, influence: 100 });
      localStorage.setItem('imperium-aeternum-save-0', JSON.stringify(slot));
    })()`);
    assert(await browser.evaluate(clickButton('读档')), 'Could not load diplomatic checkpoint');
    assert(await browser.evaluate(clickNavigationTab('military')), 'Military tab unavailable');
    await browser.waitFor(`!!document.querySelector('.ia-military-declare-row button')`, 'No legal neighboring target');
    const targetName = await browser.evaluate(`document.querySelector('.ia-military-declare-row .ia-military-target strong').textContent`);
    assert(await browser.evaluate(clickButton('宣战 1政')), 'Could not declare war');
    await browser.waitFor(`[...document.querySelectorAll('button')].some(b => b.textContent === '求和 1政30影')`, 'Declared war did not become active');
    assert(await browser.evaluate(clickButton('战报')), 'Could not open the battle report');
    await browser.waitFor(`!!document.querySelector('[role="dialog"][aria-labelledby="battle-report-title"]')`, 'Battle report dialog unavailable');
    assert(await browser.evaluate(key('document.body', { key: ' ', code: 'Space' })), 'A background turn advanced during the battle report');
    await browser.evaluate(key('document.activeElement', { key: 'Escape' }));
    await browser.waitFor(`!document.querySelector('#battle-report-title')`, 'Battle report did not close');
    assert(await browser.evaluate(clickButton('求和 1政30影')), 'Could not negotiate peace');
    await browser.waitFor(`document.body.innerText.includes('停战 10 回合')`, 'Military screen did not show the new truce');
    assert(await browser.evaluate(clickNavigationTab('dashboard')), 'Overview unavailable after peace');
    await browser.waitFor(`document.body.innerText.includes('本回合简报')`, 'Overview did not return after peace');
    assert(await browser.evaluate(clickButton('存档')), 'Could not save the negotiated peace');
    const treaty = await browser.evaluate(`(() => {
      const state = JSON.parse(localStorage.getItem('imperium-aeternum-save-0')).gameState;
      const player = state.nations[state.playerNationId];
      const other = Object.values(state.provinces).find(p => p.name === ${JSON.stringify(targetName)}).ownerId;
      const pair = state.relations.filter(r => [r.from, r.to].includes(other) && [r.from, r.to].includes(player.id));
      return { resources: player.resources, war: player.atWar, count: state.wars.length, truces: pair.map(r => [r.treaty, r.truceTurns]) };
    })()`);
    assert(!treaty.war && treaty.count === 0 && JSON.stringify(treaty.truces) === JSON.stringify([['truce', 10], ['truce', 10]]), 'Saved treaty did not end the war for both parties');
    assert(treaty.resources.gold === 920 && treaty.resources.influence === 70 && treaty.resources.adminPt === 3, 'Immediate peace did not settle the displayed costs');

    for (const ending of ['win_economy', 'fail_collapse']) {
      await browser.evaluate(`(() => {
        const slot = JSON.parse(${JSON.stringify(openingCheckpoint)});
        const state = slot.gameState;
        state.victory.type = ${JSON.stringify(ending)};
        state.pendingEvents = [{ nationId: state.playerNationId, eventId: 'evt_famine' }];
        const report = { turn: 1, nationId: state.playerNationId, income: { tax: 60, trade: 5, building: 0 },
          expense: { military: 20, corruption: 5 }, foodDelta: 0, popDelta: 0, unrestDelta: 0,
          stabilityDelta: 0, legitimacyDelta: 0, exhaustSnapshot: 0, events: [], warnings: [],
          warProgress: [], factionDelta: [], worldEvents: [], provinceChanges: [] };
        if (${ending === 'win_economy'}) report.goldDelta = -10;
        Object.assign(state, { turn: 1, lastReport: report, history: [report] });
        localStorage.setItem('imperium-aeternum-save-0', JSON.stringify(slot));
      })()`);
      assert(await browser.evaluate(clickButton('读档')), 'Could not open an ending checkpoint');
      await browser.waitFor(`!!document.querySelector('.ia-dash-victory') && !document.querySelector('#event-dialog-title')`, 'Queued event hid the campaign ending');
      assert(await browser.evaluate(clickNavigationTab('report')), 'Could not inspect the closing report');
      if (ending === 'win_economy') {
        const rowValue = label => `[...document.querySelectorAll('span')].find(el => el.textContent === ${JSON.stringify(label)} && el.nextElementSibling?.tagName === 'SPAN')?.nextElementSibling?.textContent`;
        await browser.waitFor(`(${rowValue('常规净收入')}) === '+40' && (${rowValue('其他结算差额')}) === '-50' && (${rowValue('国库实际变化')}) === '-10'`, 'Closing report did not reconcile the treasury');
      } else {
        await browser.waitFor(`document.body.innerText.includes('旧年报未记录国库实际变化。')`, 'Older report invented a treasury change');
        assert(await browser.evaluate(`!document.body.innerText.includes('国库净增 40 金')`), 'Older report presented regular income as a cash change');
      }
      assert(await browser.evaluate(clickNavigationTab('dashboard')), 'Could not return to the ending');
      await browser.waitFor(`!!document.querySelector('.ia-dash-victory')`, 'Ending controls unavailable');
      if (ending === 'win_economy') {
        assert(await browser.evaluate(clickButton('继续传世经营')), 'Winning campaign could not continue');
        await browser.waitFor(`!!document.querySelector('#event-dialog-title')`, 'Legacy mode lost the pending event');
        await browser.evaluate(key('document.activeElement', { key: '1' }));
        await browser.waitFor(`!document.querySelector('#event-dialog-title')`, 'Resumed event did not resolve');
      } else {
        assert(await browser.evaluate(clickButton('选择存档')), 'Defeated player could not choose a recovery slot');
        await browser.waitFor(`document.body.innerText.includes('刷新体检')`, 'Save selection did not open');
        assert(await browser.evaluate(clickNavigationTab('dashboard')), 'Could not return after inspecting saves');
        await browser.waitFor(`!!document.querySelector('.ia-dash-victory')`, 'Defeat should remain recorded');
      }
    }

  } finally {
    await browser.evaluate(`localStorage.setItem('imperium-aeternum-save-0', ${JSON.stringify(openingCheckpoint)})`);
  }
  assert(await browser.evaluate(clickButton('读档')), 'Could not restore opening checkpoint');

  await browser.evaluate(`localStorage.setItem('imperium-aeternum-save-3', '{broken')`);
  assert(await browser.evaluate(clickNavigationTab('save')), 'Save management tab was not found');
  const slotCard = `[...document.querySelectorAll('strong')].find((item) => item.textContent === '槽位 3')?.closest('.ia-card')`;
  await browser.waitFor(`${slotCard}?.innerText.includes('损坏')`, 'Damaged slot was not identified on its card');
  const clickSlotButton = (label) => `(() => {
    const button = [...(${slotCard}?.querySelectorAll('button') ?? [])].find((item) => item.textContent.trim() === ${JSON.stringify(label)});
    button?.click();
    return !!button;
  })()`;
  assert(await browser.evaluate(clickSlotButton('存档')), 'Damaged manual slot cannot be replaced');
  assert(await browser.evaluate(`localStorage.getItem('imperium-aeternum-save-3') === '{broken'`), 'Damaged slot was overwritten without confirmation');
  await browser.evaluate(`(() => {
    const replacement = JSON.parse(${JSON.stringify(openingCheckpoint)});
    replacement.gameState.turn = 27;
    localStorage.setItem('imperium-aeternum-save-3', JSON.stringify(replacement));
  })()`);
  const canConfirmOverwrite = `[...(${slotCard}?.querySelectorAll('button') ?? [])].some(b => !b.disabled && b.textContent.trim() === '确认覆盖')`;
  await browser.waitFor(canConfirmOverwrite, 'Initial overwrite prompt was unavailable');
  assert(await browser.evaluate(clickSlotButton('确认覆盖')), 'Initial overwrite prompt was missing');
  await browser.waitFor(`${slotCard}?.innerText.includes('第 28 年')`, 'Overwrite did not show the updated slot');
  assert(await browser.evaluate(`JSON.parse(localStorage.getItem('imperium-aeternum-save-3')).gameState.turn === 27`), 'Stale confirmation overwrote a newer checkpoint');
  await browser.waitFor(canConfirmOverwrite, 'Updated slot was still being checked');
  assert(await browser.evaluate(clickSlotButton('确认覆盖')), 'Updated slot could not be confirmed');
  await browser.waitFor(`JSON.parse(localStorage.getItem('imperium-aeternum-save-3')).gameState.turn === 0`, 'Confirmed replacement did not save the campaign');
  assert(await browser.evaluate(clickButton('选择新剧本')), 'Campaign exit control was not found on the save screen');
  assert(await browser.evaluate(clickButton('保存并返回大厅')), 'Save-and-return retry was not available');
  await browser.waitFor(`!!document.querySelector('#scenario-library')`, 'Successful save did not return to the lobby');

  await checkLobbyInspection(browser, openingCheckpoint);
  await browser.setMobileViewport();
  await browser.navigate(`${APP_URL}?e2e=mobile`);
  await browser.waitFor(`document.body?.innerText.includes('地中海黎明')`, 'Mobile campaign lobby did not load');
  assert(await browser.evaluate(clickButton('查看全部剧本')), 'Mobile library was unavailable');
  await browser.evaluate(`(() => { const b = document.querySelector('#scenario-world'); b.scrollIntoView(); b.click(); })()`);
  const headingInView = `document.activeElement.id === 'campaign-step-title' && document.activeElement.getBoundingClientRect().top >= 0 && document.activeElement.getBoundingClientRect().top < innerHeight`;
  await browser.waitFor(headingInView, 'Selecting a world left the nation list below the mobile viewport');
  assert(await browser.evaluate(`(() => {
    const nation = document.getElementById('nation-n_we_frank');
    nation?.scrollIntoView({ block: 'end', behavior: 'instant' });
    nation?.click();
    return !!nation;
  })()`), 'Could not select the last world nation');
  await browser.waitFor(headingInView, 'Campaign confirmation did not move focus to its heading');
  assert(await browser.evaluate(clickButton('重选邦国')), 'Could not return to the world roster');
  await browser.waitFor(`document.activeElement.id === 'nation-n_we_frank'`, 'Reselect lost the previously chosen nation');
  assert(await browser.evaluate(clickButton('剧本大厅')), 'Could not return to the mobile campaign library');
  await browser.waitFor(`document.activeElement.id === 'scenario-world'`, 'Back to lobby lost the scenario that opened the roster');
  await browser.waitFor(clickButton('继续最佳存档'), 'Mobile continue button was not available after checking local saves');
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
  await browser.waitFor(`document.querySelector('#mobile-page-navigation')?.contains(document.activeElement) === true`, 'Mobile page directory did not receive keyboard focus');
  await browser.evaluate(`document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await browser.waitFor(`!document.querySelector('#mobile-page-navigation')`, 'Escape did not close the mobile page directory');

  assert(await browser.evaluate(clickNavigationTab('map')), 'Mobile map navigation button was not found');
  await browser.waitFor(`!!document.querySelector('.ia-map-page')`, 'Mobile map did not load');
  const mobileMap = await browser.evaluate(`(() => { const page = document.querySelector('.ia-map-page'); return { scrollWidth: page.scrollWidth, clientWidth: page.clientWidth, hasSearch: !!page.querySelector('.ia-map-search') }; })()`);
  assert(mobileMap.hasSearch, 'Strategic map search is missing');
  assert(mobileMap.scrollWidth <= mobileMap.clientWidth + 1, `Mobile map overflows horizontally (${mobileMap.scrollWidth}px > ${mobileMap.clientWidth}px)`);

  const mapState = JSON.parse(openingCheckpoint).gameState;
  const provinces = Object.values(mapState.provinces);
  const neutral = provinces.find((p) => p.terrain === 'ocean' && !mapState.nations[p.ownerId]);
  const owned = provinces.filter((p) => p.ownerId === mapState.playerNationId).at(-1);
  assert(neutral && owned, 'Map campaign must include neutral water and an owned province');
  const edgeKeys = new Set(provinces.flatMap((p) => p.adjacent
    .filter((id) => id !== p.id && mapState.provinces[id])
    .map((id) => JSON.stringify([p.id, id].sort()))));
  assert(await browser.evaluate(`document.querySelectorAll('.wm-links line').length === ${edgeKeys.size}`), 'Map hid a one-way link or drew a link twice');
  assert(await browser.evaluate(`document.querySelectorAll('.wm-province[tabindex="0"]').length === 1`), 'Map keyboard navigation requires tabbing through every province');
  await browser.evaluate(key("document.querySelector('.wm-province')", { key: 'ArrowRight' }));
  await browser.waitFor(`document.activeElement?.matches('.wm-province[aria-pressed="true"]')`, 'Arrow navigation did not focus the selected province');
  await browser.evaluate(fillInput('.ia-map-search', neutral.name));
  await browser.waitFor(`document.querySelector('.ia-map-detail h3')?.textContent === ${JSON.stringify(neutral.name)}`, 'Filtered neutral province did not open its intel');
  assert(await browser.evaluate(`document.querySelector('.ia-map-detail').textContent.includes('海洋') && !document.querySelector('.ia-map-detail button')`), 'Neutral ocean type or ownership is incorrect');
  await browser.evaluate(fillInput('.ia-map-search', 'no-such-province'));
  await browser.waitFor(`!!document.querySelector('.ia-map-detail--empty') && !document.querySelector('.wm-province')`, 'Empty map kept stale intel');
  await browser.evaluate(fillInput('.ia-map-search', ''));
  await browser.waitFor(`document.querySelectorAll('.wm-province').length === ${provinces.length}`, 'Clearing map search did not restore all provinces');
  await browser.evaluate(`(() => {
    const picker = document.querySelector('.ia-map-info select');
    picker.value = ${JSON.stringify(owned.id)};
    picker.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await browser.waitFor(`document.querySelector('.ia-map-detail h3')?.textContent.startsWith(${JSON.stringify(owned.name)}) && !!document.querySelector('.ia-map-detail button')`, 'Province picker did not select own province');
  await browser.evaluate(`document.querySelector('.ia-map-detail button').click()`);
  await browser.waitFor(`document.querySelector('.ia-panel:last-child header h3')?.textContent.trim().startsWith(${JSON.stringify(owned.name)})`, 'Govern action opened the wrong province');
  await browser.evaluate(fillInput('input[aria-label="搜索省份"]', 'no-such-province'));
  await browser.waitFor(`!!document.querySelector('.ia-risk-empty') && ![...document.querySelectorAll('button')].some((b) => b.firstElementChild?.textContent === '农田')`, 'Empty province search still allowed construction in a hidden province');
  assert(await browser.evaluate(key('document.body', { key: 'b' })), 'Build shortcut still acted on a filtered-out province');

  assert(await browser.evaluate(clickNavigationTab('military')), 'Mobile military navigation button was not found');
  await browser.waitFor(`[...document.querySelectorAll('.ia-military-screen')].some((item) => getComputedStyle(item).display !== 'none')`, 'Mobile military screen did not load');
  const mobileMilitary = await browser.evaluate(screenLayoutAudit());
  assert(mobileMilitary.minGap >= 8, `Mobile military cards have collapsed spacing (${mobileMilitary.minGap}px)`);
  assert(mobileMilitary.scrollWidth <= mobileMilitary.clientWidth + 1, `Mobile military screen overflows horizontally (${mobileMilitary.scrollWidth}px > ${mobileMilitary.clientWidth}px)`);

  assert(await browser.evaluate(clickNavigationTab('dashboard')), 'Could not select the autosave before refresh');
  await browser.waitFor(`!!document.querySelector('.ia-dash-priority-grid')`, 'Overview did not load');
  assert(await browser.evaluate(clickButton('存档')), 'Could not establish an autosave for this campaign');
  assert(await browser.evaluate(clickNavigationTab('economy')), 'Could not open taxes before refresh');
  const taxBar = `document.querySelector('[role="progressbar"][aria-label="税率"]')`;
  await browser.waitFor(`!!${taxBar}`, 'Current tax rate was unavailable');
  const initialTax = Number(await browser.evaluate(`${taxBar}.getAttribute('aria-valuenow')`));
  assert(await browser.evaluate(clickButton(initialTax < 50 ? '+2%' : '-5%')), 'Tax change control was missing');
  await browser.waitFor(`Number(${taxBar}.getAttribute('aria-valuenow')) !== ${initialTax}`, 'Tax change was not applied');
  const changedTax = await browser.evaluate(`${taxBar}.getAttribute('aria-valuenow')`);
  await browser.navigate(`${APP_URL}?e2e=resume`);
  await browser.waitFor(`!!document.querySelector('#scenario-library')`, 'Refresh did not return to the lobby');
  await browser.waitFor(clickButton('继续最佳存档'), 'No recovery checkpoint was offered after checking local saves');
  await browser.waitFor(`!!document.querySelector('.ia-ruler-subline')`, 'Recovery checkpoint did not open');
  assert(await browser.evaluate(clickNavigationTab('economy')), 'Could not verify the recovered tax rate');
  await browser.waitFor(`${taxBar}?.getAttribute('aria-valuenow') === ${JSON.stringify(changedTax)}`, 'Refresh lost the latest unsaved tax change');

  console.log(`Browser E2E passed [Safari] (${useLocalServer ? 'local' : APP_URL}): construction, research, event queue, declaration, negotiated peace, keyboard shortcuts, turn advance, treasury reconciliation, ending recovery, save/load, accessibility and mobile layout.`);
} finally {
  try { await browser?.close(); } finally { await stopChild(server); }
}
